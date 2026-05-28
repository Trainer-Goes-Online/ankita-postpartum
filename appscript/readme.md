# BodyWorx Postpartum — Apps Script Downstream CAPI Engine

Apps Script bound to the **BodyWorx Postpartum CRM** Google Sheet that fires
three downstream Meta Conversions API events whenever a team-edited dropdown is
set to TRUE:

| Sheet dropdown → TRUE | Meta CAPI event fired | Carries value? |
|---|---|---|
| `attended` (col X) | `LeadShowUp` | no |
| `qualified` (col AB) | `QualifiedLead` | no |
| `sale_closed` (col AF) | `HighTicketPurchase` | yes — `contracted_value` from col AG |

The tripwire `Purchase` + `sales` events for the ₹497 challenge ticket are fired
separately by the Next.js backend at payment-verify time
([app/api/razorpay/verify-payment/route.ts](../app/api/razorpay/verify-payment/route.ts)).
This script handles only the three downstream events. The two systems share the
same Meta pixel ID + access token but never talk to each other directly — the
Sheet is the only link.

This is a **webinar / live-challenge funnel**: all buyers attend the SAME
scheduled 5-Day Postpartum Recovery Challenge, then the sales team manually sells
a high-ticket offer post-challenge.

---

## Files

- **`code.gs`** — paste into the Apps Script editor (replaces the default file)
- **`appscript.json`** — paste into the manifest (Apps Script editor → gear icon → Show "appsscript.json" manifest file)
- **`sheet-header.tsv`** — the 36-column header row; paste into cell A1 of the Sheet (tab-separated, lands across A1:AJ1)
- **`readme.md`** — this file

These are a template, NOT auto-deployed. To make them live, copy-paste into a
Google Sheet's Apps Script editor (steps below).

> **Note on the manifest filename:** Apps Script's manifest is literally named
> `appsscript.json` (double-s) inside the editor. This repo stores it as
> `appscript.json` to match the folder name; when you paste, the editor's file
> is `appsscript.json` — paste the contents in regardless of our filename.

---

## How external_id matches across systems

Both the backend (Pabbly payload) and this Apps Script compute
`external_id = sha256(lowercase(trim(email)))`. That same hash is also the `em`
field on every event. So the downstream `LeadShowUp` / `QualifiedLead` /
`HighTicketPurchase` events join the tripwire `Purchase` on Meta's side via the
email hash — one identity across the whole funnel.

(The browser pixel's tripwire `external_id` uses an anonymous `bw_uid` cookie
instead; that's a separate signal. The `em` field is the reliable cross-system
join, which is why we standardize downstream `external_id` on the email hash.)

---

## Prerequisites

1. **The CRM Google Sheet exists** with the 36-column schema in row 1 (paste
   `sheet-header.tsv` into A1). Columns A–W are auto-filled by Pabbly; X–AJ are
   the webinar lifecycle.

2. **The hidden `_Errors` tab exists** with this header in row 1:
   `timestamp | row_number | event_type | http_status | response_body | retry_count`

3. **Column types set correctly:**
   - X (`attended`), AB (`qualified`), AF (`sale_closed`) → **Dropdown** (Data →
     Data validation → Dropdown → values `TRUE` and `FALSE`, exact uppercase).
     **Do NOT use checkboxes** — they pre-populate as FALSE when Pabbly adds a
     row, indistinguishable from "team explicitly marked FALSE". Dropdowns stay
     blank until someone picks a value.
   - Y (`showup_time`), AC (`qualified_time`), AH (`sales_time`) → **Date+time**
     (Format → Number → Date time)
   - AG (`contracted_value`) → **Plain number** (no thousands separator, no
     currency symbol)
   - Z, AA, AD, AE, AI, AJ → Apps Script writes these; leave as plain text

4. **Spreadsheet timezone = `Asia/Kolkata`** (File → Settings → Timezone). The
   script reads `showup_time` / `qualified_time` / `sales_time` as Date objects;
   the timezone determines what those datetimes resolve to.

5. **Pabbly is writing rows correctly** — at least one real payment has produced
   a row with all 23 auto-fill columns populated (especially `lead_id`, `email`,
   `fbc`, `fbp`, `client_ip_address`, `client_user_agent`, `external_id`).

---

## Deployment (first-time setup, ~10 minutes)

### 1. Open the Sheet's Apps Script editor
In the CRM Sheet → **Extensions** → **Apps Script**. Opens a new tab with an
empty `Code.gs`.

### 2. Paste in `code.gs`
- Select all in the default `Code.gs` → delete.
- Paste the entire contents of [`code.gs`](./code.gs).
- Cmd+S / Ctrl+S to save.

### 3. Replace the manifest
- Gear icon (Project Settings) → check **"Show 'appsscript.json' manifest file in editor"**.
- Back to the Editor → open `appsscript.json` → replace with [`appscript.json`](./appscript.json) contents → save.

### 4. Add Script Properties (where secrets live)
Project Settings (gear) → **Script Properties** → **Add script property**:

| Property name | Value | Notes |
|---|---|---|
| `META_PIXEL_ID` | `1631857927981266` | The dedicated postpartum pixel (matches Vercel's `NEXT_PUBLIC_META_PIXEL_ID` — the two must always match). |
| `META_CAPI_ACCESS_TOKEN` | `<your token>` | Same value as Vercel's `META_CAPI_ACCESS_TOKEN`. **Treat as a secret** — anyone with edit access to this Apps Script can read it. |
| `EVENT_SOURCE_URL_DEFAULT` | `https://bodyworx.in/checkout` | Fallback if a row's `event_source_url` column is empty |

Optional overrides:

| Property | Default | Use when |
|---|---|---|
| `MAIN_SHEET_NAME` | `Sheet1` | You renamed the main tab |
| `META_GRAPH_API_VERSION` | `v25.0` | Meta releases a new API version you want to pin |

Click **Save script properties**.

### 5. Install the onEdit trigger
- Editor → function dropdown → `setupTriggers` → **Run**.
- Authorize on first run: Review permissions → choose the Sheet owner account →
  "Google hasn't verified this app" → Advanced → Go to (project) (unsafe) →
  approve scopes (current spreadsheet, external request, manage triggers).
- Expect log: `setupTriggers OK — removed 0 old, installed 1 new onSheetEdit trigger`.

### 6. Smoke test
Open **Meta Events Manager → your dataset → Test Events**, copy the Test Event Code.

Drive the dummy row below (or a real row):
1. **LeadShowUp**: fill `showup_time` (col Y), set `attended` (col X) → `TRUE`.
   After 5–10s: col Z = `<lead_id>_showup`, col AA = `TRUE`; Test Events shows
   `LeadShowUp`, EMQ 8–9+.
2. **QualifiedLead**: fill `qualified_time` (col AC), set `qualified` (col AB) →
   `TRUE`. Expect `QualifiedLead`.
3. **HighTicketPurchase**: fill `contracted_value` (col AG, e.g. `60000`) +
   `sales_time` (col AH), set `sale_closed` (col AF) → `TRUE`. Expect
   `HighTicketPurchase` with `value: 60000, currency: INR`.

---

## How it works internally

```
Team sets `attended` = TRUE on row 47
  → installable onEdit trigger → onSheetEdit(e)
  → identifies col X = attended → looks up EVENTS.LEAD_SHOWUP
  → confirms e.value is TRUE, col AA (sent flag) is blank
  → fireDownstreamEvent(sheet, 47, EVENTS.LEAD_SHOWUP)
      • reads the 36-cell row
      • event_id = `${lead_id}_showup`
      • event_time = showup_time (col Y) → Unix seconds
      • user_data: sha256 of em/ph/fn/ln/ct/country + external_id(=em hash)
                   + raw fbc/fbp/client_ip_address/client_user_agent
      • custom_data: payment_id + UTM context (+ value for HT sale)
      • POST graph.facebook.com/v25.0/{PIXEL_ID}/events, retry 3x on 429/5xx
  → on 200: col Z = event_id, col AA = TRUE
  → on non-200: append to _Errors tab, leave AA blank (retry-able)
```

### Deduplication
- **Sheet-side**: `*_capi_sent` flag check before firing.
- **Meta-side**: deterministic `event_id = {lead_id}_{suffix}`. Meta dedupes same
  `event_name` + `event_id` within 48h.
- **Cross-event**: each event has a different `event_name`, so they never dedupe
  against each other.

---

## Operations & troubleshooting

- **Logs**: Apps Script editor → **Executions** tab. Failures also append to the
  `_Errors` tab.
- **Dropdown set TRUE but no event fired**: check the trigger is installed
  (Triggers / clock icon); check Executions; if Pabbly wrote the row
  programmatically, toggle the dropdown blank→TRUE again to fire `onEdit`.
- **Low EMQ (5–6 instead of 9+)**: an identifier column is blank for that row —
  check `fbc`, `fbp`, `client_ip_address`, `client_user_agent`, `external_id`,
  `email`, `phone` are populated (Pabbly mapping issue).
- **Force a re-fire**: clear the `*_capi_sent` flag (AA / AE / AJ), then toggle
  the trigger dropdown blank→TRUE.
- **Bulk replay** (after a Meta outage): Editor → function `replayPendingEvents`
  → Run. Self-throttles at 500ms/event.
- **Rotate token**: update `META_CAPI_ACCESS_TOKEN` in Script Properties; no
  redeploy needed.

---

## Dummy row for smoke testing

Paste into row 2 (adjust the time columns to recent IST timestamps). The
`external_id` is `sha256('test+bodyworx@example.com')` — pre-computed so the
script's hash matches (sanity check).

| Col | Field | Value |
|---|---|---|
| A | `lead_id` | `pay_dummyBW123` |
| B | `created_at` | `2026-05-27T09:30:00.000Z` |
| C | `first_name` | `Test` |
| D | `last_name` | `Lead` |
| E | `email` | `test+bodyworx@example.com` |
| F | `phone` | `+919999999999` |
| G | `city` | `Mumbai` |
| H | `country_code` | `IN` |
| I | `fbc` | `fb.1.1716200533000.IwAR2_test_fbc` |
| J | `fbp` | `fb.1.1716200533000.1234567890` |
| K | `client_ip_address` | `203.0.113.42` |
| L | `client_user_agent` | `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15` |
| M | `external_id` | `9270980b8f88c56dbae754e488cb4f22d58b86831cf1916ee6228a456de25f74` |
| N | `event_source_url` | `https://bodyworx.in/checkout` |
| O | `amount` | `497` |
| P | `is_test` | `true` |
| Q | `purchase_event_id` | `pay_dummyBW123` |
| R | `utm_source` | `facebook` |
| S | `utm_medium` | `cpc` |
| T | `utm_campaign` | `bodyworx_5day_challenge` |
| U | `utm_content` | `ad_creative_v1` |
| V | `utm_term` | `postpartum_recovery` |
| W | `fbclid` | `IwAR2_test_fbclid` |
| X–AJ | (lifecycle) | leave blank — team / script fills these |

Smoke sequence:
1. Fill Y `2026-05-27 15:30` → set X `attended` = `TRUE` → expect `LeadShowUp`
   (col Z = `pay_dummyBW123_showup`, col AA = `TRUE`).
2. Fill AC `2026-05-27 16:00` → set AB `qualified` = `TRUE` → expect `QualifiedLead`.
3. Fill AG `60000` + AH `2026-05-28 11:00` → set AF `sale_closed` = `TRUE` →
   expect `HighTicketPurchase` with `value: 60000`.

---

## Known limitations

- `onEdit` triggers don't fire on edits made by other Apps Scripts in the same
  project (not relevant — single script).
- Installable trigger time limit is 30 min; a single CAPI fire is sub-second.
  Only `replayPendingEvents` over hundreds of rows could approach this.
- `UrlFetchApp` quota: 20,000 calls/day (consumer) / 100,000/day (Workspace) —
  far above this funnel's volume.
- Script Properties are visible to all editors of the Apps Script project.
  Restrict editor access to dev/ops; give the sales team viewer/commenter access
  to the Sheet only.
- Programmatic writes from the Sheets API (e.g. Pabbly "Add Row") may not fire
  installable `onEdit` consistently — which is why the manual dropdown selection
  by the team is the canonical trigger path (and why we use dropdowns, blank by
  default, rather than checkboxes).

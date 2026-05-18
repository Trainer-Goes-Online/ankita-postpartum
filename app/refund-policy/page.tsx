import type { Metadata } from 'next';
import LegalPageLayout from '@/components/LegalPageLayout';
import { CHECKOUT_CONFIG } from '@/lib/checkout-config';

export const metadata: Metadata = {
  title: 'Refund Policy | BodyWorx',
  description:
    '7-day money-back guarantee policy for the BodyWorx 5-Day Postpartum Recovery Challenge.',
  robots: { index: true, follow: true },
};

const PRICE = CHECKOUT_CONFIG.amountRupeesNumeric;

export default function RefundPolicyPage() {
  return (
    <LegalPageLayout
      title="Refund Policy"
      effectiveDate="18 May 2026"
      intro="We stand behind the BodyWorx 5-Day Postpartum Recovery Challenge with a simple, no-questions-asked money-back guarantee. If you don&rsquo;t feel the Program was right for you, we&rsquo;ll refund you in full — quickly and politely."
    >
      <h2>1. 100% Money-Back Guarantee</h2>
      <p>If you purchase the 5-Day Postpartum Recovery Challenge (₹{PRICE}) and decide it&apos;s not the right fit, you can request a full refund within <strong>7 days</strong> of your purchase date. We will not ask intrusive questions or make you justify your decision.</p>

      <h2>2. How to Request a Refund</h2>
      <ul>
        <li>
          Email <a href="mailto:hello@bodyworx.in">hello@bodyworx.in</a> from the same email address you used at checkout.
        </li>
        <li>Use the subject line: <strong>&ldquo;Refund Request — 5-Day Postpartum Challenge&rdquo;</strong>.</li>
        <li>Include your full name and the date of purchase. A one-line reason is optional but helps us improve.</li>
      </ul>

      <h2>3. Processing Time</h2>
      <p>Refunds are processed within 2 business days of receiving your request. Once processed, the amount typically reflects in your bank account or card within <strong>5–7 business days</strong>, depending on your bank and payment method. UPI refunds are usually faster.</p>

      <h2>4. Refund Method</h2>
      <p>Refunds are credited back to the original payment method you used at checkout (the same card, UPI ID, or netbanking account). We are unable to refund to a different account.</p>

      <h2>5. What Is Not Refundable</h2>
      <ul>
        <li>Requests made <strong>after 7 days</strong> from your purchase date.</li>
        <li>Requests made <strong>after you have attended all five live sessions</strong> of the same batch.</li>
        <li>Bonus or add-on products clearly labelled as non-refundable at the time of purchase.</li>
      </ul>

      <h2>6. Chargebacks &amp; Disputes</h2>
      <p>If you have a concern about your purchase, please email us first — we are responsive and refunds are easy. Initiating a chargeback with your bank without first contacting us may delay the resolution and may temporarily suspend your Program access while the dispute is being reviewed.</p>

      <h2>7. Free or Promotional Access</h2>
      <p>If you received the Program for free, at a heavily discounted promotional rate, or as part of a giveaway, refunds may not apply. The terms of any such promotion will be made clear at the time of the offer.</p>

      <h2>8. Contact</h2>
      <p>Have a question about a refund or your order? Write to <a href="mailto:hello@bodyworx.in">hello@bodyworx.in</a> and a real human from our team will respond within one business day.</p>
    </LegalPageLayout>
  );
}

import type { Metadata } from 'next';
import LegalPageLayout from '@/components/LegalPageLayout';
import { CHECKOUT_CONFIG } from '@/lib/checkout-config';

export const metadata: Metadata = {
  title: 'Terms & Conditions | BodyWorx',
  description:
    'Terms of use for the BodyWorx 5-Day Postpartum Recovery Challenge by Dr. Ankita.',
  robots: { index: true, follow: true },
};

const PRICE = CHECKOUT_CONFIG.amountRupeesNumeric;

export default function TermsAndConditionsPage() {
  return (
    <LegalPageLayout
      title="Terms &amp; Conditions"
      effectiveDate="18 May 2026"
      intro="These Terms govern your access to and use of the BodyWorx website and the 5-Day Postpartum Recovery Challenge (the &lsquo;Program&rsquo;) by Dr. Ankita. By purchasing the Program or using our site, you agree to be bound by these Terms."
    >
      <h2>1. Acceptance of Terms</h2>
      <p>By accessing or using our website and services, you confirm that you are at least 18 years old and that you have read, understood, and agreed to be bound by these Terms and our Privacy Policy.</p>

      <h2>2. Description of the Program</h2>
      <p>The BodyWorx 5-Day Postpartum Recovery Challenge is a live, physiotherapist-led educational program delivered over five consecutive days. The Program includes:</p>
      <ul>
        <li>Live Zoom sessions at {CHECKOUT_CONFIG.webinarTimes} (you choose the slot that suits you).</li>
        <li>Same-day replay access in a private community space.</li>
        <li>Educational materials on breathing, diastasis recti awareness, core &amp; pelvic floor reconnection, mobility, posture, and postpartum-supportive nutrition.</li>
        <li>Q&amp;A with Dr. Ankita&apos;s team during the live sessions.</li>
      </ul>

      <h2>3. Medical Disclaimer</h2>
      <p>The Program is provided for educational and informational purposes only. It is <strong>not medical advice, diagnosis, or treatment</strong>. The postpartum period is a unique medical state and individual recovery timelines vary widely. You must consult your obstetrician, gynaecologist, or qualified healthcare provider before beginning any exercise program — especially if you are less than 6 weeks postpartum, have had a Caesarean section, are still experiencing significant lochia (bleeding), have a wide or symptomatic diastasis recti, pelvic organ prolapse symptoms, severe pelvic or back pain, postpartum hypertension, post-surgical complications, or any concern raised by your doctor.</p>
      <p>If you experience pain, dizziness, heavy bleeding, urinary or faecal leakage, a feeling of heaviness or bulging in the pelvic floor, or any unusual symptom during or after a session, stop immediately and seek medical care.</p>

      <h2>4. Eligibility</h2>
      <ul>
        <li>You must be at least 18 years old.</li>
        <li>You must be currently in your postpartum stage (typically 6 weeks or more after delivery, or as cleared by your doctor).</li>
        <li>You must have clearance from your treating physician before participating in any movement portion of the Program.</li>
      </ul>

      <h2>5. Payment, Pricing &amp; Access</h2>
      <p>The current price of the Program is <strong>₹{PRICE}</strong> (one-time payment). Payment is processed by Razorpay and is required to confirm your seat. Access details (Zoom links, community group, materials) are emailed within minutes of a successful payment.</p>
      <p>BodyWorx may change pricing or modify the offer at any time. Any changes will not affect orders that have already been confirmed.</p>

      <h2>6. Refunds</h2>
      <p>Refunds are governed by our <a href="/refund-policy">Refund Policy</a>. In short: if you complete the Program and don&apos;t feel it delivered on its promise, write to us within 7 days of purchase and we&apos;ll refund you in full.</p>

      <h2>7. Your Responsibilities</h2>
      <ul>
        <li>Provide accurate information at checkout and during the Program.</li>
        <li>Use the Program only for your personal benefit. Do not record, redistribute, resell, or share access with anyone else.</li>
        <li>Respect Dr. Ankita, the team, and other participants in the community group.</li>
        <li>Listen to your body. Modify or skip any exercise that doesn&apos;t feel right.</li>
      </ul>

      <h2>8. Intellectual Property</h2>
      <p>All materials, recordings, videos, audio, branding, written content, and the BodyWorx Postpartum Recovery Method™ are the intellectual property of BodyWorx and Dr. Ankita. You receive a personal, non-transferable license to access these materials for your own postpartum recovery. You may not copy, reproduce, modify, screen-record, or redistribute any part of the Program.</p>

      <h2>9. Limitation of Liability</h2>
      <p>To the maximum extent permitted by law, BodyWorx, Dr. Ankita, and our affiliates shall not be liable for any indirect, incidental, consequential, or punitive damages arising from your use of the Program. Our total liability for any direct claim is limited to the amount you paid for the Program.</p>

      <h2>10. Termination</h2>
      <p>We may suspend or terminate your access without refund if you breach these Terms, engage in abusive behaviour in the community, or attempt to redistribute Program materials.</p>

      <h2>11. Governing Law</h2>
      <p>These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts at Delhi, India.</p>

      <h2>12. Changes to These Terms</h2>
      <p>We may update these Terms occasionally. Material changes will be reflected on this page with a new effective date. Continued use of the Program constitutes acceptance of the updated Terms.</p>

      <h2>13. Contact</h2>
      <p>Questions about these Terms? Reach us at <a href="mailto:hello@bodyworx.in">hello@bodyworx.in</a>.</p>
    </LegalPageLayout>
  );
}

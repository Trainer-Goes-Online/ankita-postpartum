import type { Metadata } from 'next';
import LegalPageLayout from '@/components/LegalPageLayout';

export const metadata: Metadata = {
  title: 'Privacy Policy | BodyWorx',
  description:
    'How BodyWorx collects, uses, and protects your personal information for the 5-Day Postpartum Recovery Challenge.',
  robots: { index: true, follow: true },
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      effectiveDate="18 May 2026"
      intro="This Privacy Policy explains how BodyWorx (operated by Dr. Ankita) collects, uses, stores, and protects information you share with us when you visit our website, register for the 5-Day Postpartum Recovery Challenge, or interact with our communications."
    >
      <h2>1. Information We Collect</h2>
      <p>We collect information you provide to us directly, as well as limited information collected automatically when you use the website:</p>
      <ul>
        <li>
          <strong>Account &amp; checkout details:</strong> your name, email address, phone number, billing details, and postpartum stage / time since delivery (if shared voluntarily).
        </li>
        <li>
          <strong>Payment information:</strong> processed securely by Razorpay. We do not store your full card or UPI details on our servers.
        </li>
        <li>
          <strong>Communications:</strong> messages you send us via email, WhatsApp, or the community group.
        </li>
        <li>
          <strong>Usage data:</strong> device type, browser, IP address, pages viewed, and approximate location — collected via cookies and analytics tools listed below.
        </li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <ul>
        <li>To deliver the 5-Day Postpartum Recovery Challenge — including Zoom session links, replays, and follow-up materials.</li>
        <li>To provide customer support and respond to your questions about exercises, modifications, or your recovery stage.</li>
        <li>To send transactional emails and reminders related to your purchase.</li>
        <li>To improve our website, content, and educational material based on aggregated usage trends.</li>
        <li>With your consent, to send you updates about new BodyWorx programs, prenatal &amp; postpartum offerings, or community events.</li>
      </ul>

      <h2>3. Cookies &amp; Analytics Tools</h2>
      <p>We use a small number of analytics and marketing tools to understand how our site is being used and to deliver relevant content:</p>
      <ul>
        <li><strong>Google Analytics 4</strong> — anonymised traffic and behaviour analytics.</li>
        <li><strong>Microsoft Clarity</strong> — session recordings and heatmaps to improve site usability.</li>
        <li><strong>Meta Pixel (Facebook &amp; Instagram)</strong> — used only if we run ads, to measure ad effectiveness.</li>
      </ul>
      <p>You can block cookies through your browser settings. Please note that some site features may not work correctly with all cookies blocked.</p>

      <h2>4. How We Share Information</h2>
      <p>We do not sell your personal information. We share limited information only with trusted service providers that help us run the program:</p>
      <ul>
        <li><strong>Razorpay</strong> — to process payments securely.</li>
        <li><strong>Pabbly / email service providers</strong> — to send transactional emails and program access.</li>
        <li><strong>Zoom</strong> — to host the live sessions.</li>
        <li>Government authorities or law enforcement when required by Indian law.</li>
      </ul>

      <h2>5. Data Retention</h2>
      <p>We retain your information for as long as your account or order remains active, plus a reasonable period to comply with tax, accounting, or legal obligations. You can request deletion of your data at any time using the contact details below.</p>

      <h2>6. Your Rights</h2>
      <p>You have the right to access, correct, or request deletion of the personal information we hold about you. You may also withdraw consent for marketing communications at any time by clicking &ldquo;unsubscribe&rdquo; in our emails or contacting us.</p>

      <h2>7. Children&apos;s Privacy</h2>
      <p>BodyWorx is intended for adults (18+) who are in their postpartum recovery stage. We do not knowingly collect information from minors.</p>

      <h2>8. Changes to This Policy</h2>
      <p>We may update this Privacy Policy from time to time. Material changes will be highlighted on this page with a new effective date.</p>

      <h2>9. Contact Us</h2>
      <p>For any privacy-related questions, contact us at <a href="mailto:hello@bodyworx.in">hello@bodyworx.in</a>.</p>
    </LegalPageLayout>
  );
}

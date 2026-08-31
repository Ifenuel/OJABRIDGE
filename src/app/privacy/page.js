import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy — OjaBridge',
  description: 'How OjaBridge collects, uses, protects and manages your personal information across our marketplace platform.',
};

export default function PrivacyPage() {
  return (
    <>
      <section className="bg-ob-navy text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-ob-lime font-semibold text-sm uppercase tracking-wider">Legal</span>
          <h1 className="text-4xl md:text-5xl font-bold mt-4 mb-6">Privacy Policy</h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            How OjaBridge collects, uses, protects and manages your personal information across our marketplace platform.
          </p>
          <p className="text-gray-400 text-sm mt-4">Last updated: August 2025</p>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="max-w-3xl mx-auto space-y-10">

          <div>
            <h2 className="text-xl font-bold text-ob-navy mb-3">1. Introduction</h2>
            <p className="text-gray-600 leading-relaxed">
              OjaBridge (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose and safeguard your personal information when you use our marketplace platform, including our website, vendor dashboard, admin dashboard and related services.
            </p>
            <p className="text-gray-600 leading-relaxed mt-3">
              This policy applies to all users of the Platform, including customers, retailers, vendors and administrators. By using OjaBridge, you consent to the practices described in this policy.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-ob-navy mb-3">2. Information We Collect</h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              We collect only the information necessary to provide and improve our marketplace services:
            </p>

            <h3 className="font-semibold text-ob-navy mt-4 mb-2">2.1 Account Information</h3>
            <p className="text-gray-600 leading-relaxed">
              When you create an account, we collect your name, email address, phone number and password (stored in hashed form). This information is required for account creation and authentication.
            </p>

            <h3 className="font-semibold text-ob-navy mt-4 mb-2">2.2 Vendor and Business Information</h3>
            <p className="text-gray-600 leading-relaxed">
              Vendors provide business details as part of the onboarding and KYC/KYB process. This may include business name, business registration details, business address, identification documents, bank account information and settlement details. This information is collected for verification, compliance and payment settlement purposes.
            </p>

            <h3 className="font-semibold text-ob-navy mt-4 mb-2">2.3 Transaction and Order Information</h3>
            <p className="text-gray-600 leading-relaxed">
              We process transaction data including order details, payment references, transaction amounts, currencies and order status. This information is necessary for marketplace operations, payment processing, commission calculation and dispute resolution.
            </p>

            <h3 className="font-semibold text-ob-navy mt-4 mb-2">2.4 Device and Security Information</h3>
            <p className="text-gray-600 leading-relaxed">
              We collect device information such as IP address, browser type, operating system and security signals. This information is used for fraud prevention, account protection, security monitoring and ensuring the integrity of marketplace transactions.
            </p>

            <h3 className="font-semibold text-ob-navy mt-4 mb-2">2.5 Communication Records</h3>
            <p className="text-gray-600 leading-relaxed">
              Support inquiries, dispute communications and platform messages between users are recorded to provide customer service, resolve disputes and maintain accountability.
            </p>

            <h3 className="font-semibold text-ob-navy mt-4 mb-2">2.6 Reviews and Feedback</h3>
            <p className="text-gray-600 leading-relaxed">
              When you leave reviews, ratings or feedback, this content is associated with your account and displayed on the Platform as part of the marketplace experience.
            </p>

            <h3 className="font-semibold text-ob-navy mt-4 mb-2">2.7 Cookies and Similar Technologies</h3>
            <p className="text-gray-600 leading-relaxed">
              We use cookies and local storage to maintain session state, remember preferences, secure authentication and improve platform performance. For details, see our <Link href="/cookies" className="text-ob-purple hover:underline">Cookie Policy</Link>.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-ob-navy mb-3">3. How We Use Your Information</h2>
            <p className="text-gray-600 leading-relaxed mb-3">We use the information we collect for the following purposes:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>To provide and maintain the OjaBridge marketplace</li>
              <li>To create and manage user accounts</li>
              <li>To process transactions, payments and vendor settlements</li>
              <li>To calculate and manage platform commissions</li>
              <li>To verify vendor identity and business information (KYC/KYB)</li>
              <li>To verify bank account information for settlement purposes</li>
              <li>To detect and prevent fraud, abuse and security threats</li>
              <li>To monitor platform integrity and enforce marketplace policies</li>
              <li>To communicate transactional updates (order status, payment confirmations, delivery notifications)</li>
              <li>To send important security alerts and platform announcements</li>
              <li>To provide customer support and resolve disputes</li>
              <li>To process refund requests and manage returns</li>
              <li>To improve platform functionality and user experience</li>
              <li>To comply with legal and regulatory obligations</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-ob-navy mb-3">4. Information Sharing</h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              We share information only as necessary to operate the marketplace and provide our services:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li><strong>With vendors:</strong> When a customer places an order, the vendor receives the order details, customer name and delivery information necessary to fulfill the order</li>
              <li><strong>With payment providers:</strong> Transaction data is shared with Paystack for payment processing and verification</li>
              <li><strong>With verification providers:</strong> Vendor KYC/KYB documents may be shared with identity verification services as part of the verification process</li>
              <li><strong>With logistics providers:</strong> Delivery information is shared with logistics partners to facilitate order fulfillment and tracking</li>
              <li><strong>With email providers:</strong> Transactional emails are sent through third-party email service providers</li>
              <li><strong>With administrators:</strong> Platform administrators with appropriate access may view user data for operational, support and security purposes</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-3">
              We do not sell personal information to third parties. We do not share personal information for third-party marketing purposes without explicit consent.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-ob-navy mb-3">5. Data Protection and Security</h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              We implement appropriate technical and organisational security measures to protect your information:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li><strong>Encryption in Transit:</strong> All data transmitted between your device and OjaBridge is encrypted using TLS/SSL</li>
              <li><strong>Encryption at Rest:</strong> Sensitive data is stored using encrypted database infrastructure</li>
              <li><strong>Access Controls:</strong> Role-based access controls ensure only authorised personnel can access specific information</li>
              <li><strong>Audit Logging:</strong> Access to sensitive data is logged and monitored</li>
              <li><strong>Secure Authentication:</strong> Passwords are hashed using bcrypt. Multi-factor authentication is supported</li>
              <li><strong>Payment Security:</strong> Payment processing is handled by Paystack, a PCI DSS-compliant payment provider. We do not store payment card details on our servers</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-ob-navy mb-3">6. Data Retention</h2>
            <p className="text-gray-600 leading-relaxed">
              We retain your information only for as long as necessary to provide our services and fulfil the purposes described in this policy. Specific retention periods include:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4 mt-3">
              <li><strong>Account data:</strong> Retained while your account is active and for a reasonable period after closure</li>
              <li><strong>Transaction records:</strong> Retained for financial reporting, tax compliance and audit purposes as required by applicable regulations</li>
              <li><strong>KYC/KYB documents:</strong> Retained for the duration of the vendor relationship and as required by verification and compliance obligations</li>
              <li><strong>Support communications:</strong> Retained for customer service and dispute resolution purposes</li>
              <li><strong>Audit logs:</strong> Retained for security monitoring and regulatory compliance</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-ob-navy mb-3">7. Your Rights</h2>
            <p className="text-gray-600 leading-relaxed mb-3">You have the right to:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li><strong>Access:</strong> Request the personal information we hold about you</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information, subject to our legal and operational retention obligations</li>
              <li><strong>Data Portability:</strong> Request a copy of your personal data in a structured, machine-readable format</li>
              <li><strong>Objection:</strong> Object to certain types of processing of your personal information</li>
              <li><strong>Opt Out:</strong> Opt out of non-essential communications while maintaining your account</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-3">
              To exercise any of these rights, please contact us through our support channels. We will respond to your request within a reasonable timeframe.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-ob-navy mb-3">8. Third-Party Services</h2>
            <p className="text-gray-600 leading-relaxed">
              OjaBridge integrates with the following categories of third-party services:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4 mt-3">
              <li><strong>Payment Processing:</strong> Paystack — processes payments and handles payment-related data according to their privacy policy</li>
              <li><strong>Identity Verification:</strong> KYC/KYB providers — verify vendor identity and business information</li>
              <li><strong>Logistics:</strong> Shipping and delivery partners — receive delivery information to fulfil orders</li>
              <li><strong>Email Services:</strong> Transactional email providers — deliver order confirmations, notifications and security alerts</li>
              <li><strong>Cloud Infrastructure:</strong> Hosting and database providers — securely store platform data</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-3">
              Each third-party service has its own privacy policy. We encourage you to review the privacy policies of these services. We select third-party providers carefully and require them to maintain appropriate data protection standards.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-ob-navy mb-3">9. International Data Processing</h2>
            <p className="text-gray-600 leading-relaxed">
              OjaBridge operates primarily in Nigeria. However, certain third-party services (such as cloud infrastructure and email providers) may process data in other jurisdictions. Where your data is processed outside of Nigeria, we ensure that appropriate data protection safeguards are in place.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-ob-navy mb-3">10. Children&apos;s Privacy</h2>
            <p className="text-gray-600 leading-relaxed">
              OjaBridge is not intended for use by individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have collected personal information from a child under 18, we will take steps to delete that information promptly.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-ob-navy mb-3">11. Changes to This Policy</h2>
            <p className="text-gray-600 leading-relaxed">
              We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements or other factors. Significant changes will be communicated through appropriate platform notifications. The updated policy will be posted on this page with a revised &quot;Last updated&quot; date.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-ob-navy mb-3">12. Contact Us</h2>
            <p className="text-gray-600 leading-relaxed">
              For privacy-related inquiries, data access requests or any questions about this Privacy Policy, please contact us at:
            </p>
            <div className="bg-ob-light rounded-xl p-5 border border-gray-100 mt-4">
              <p className="text-gray-600 text-sm">
                <strong>Email:</strong> awoyoemmanuel12@gmail.com<br />
                <strong>Support:</strong> <Link href="/support" className="text-ob-purple hover:underline">Help Center</Link><br />
                <strong>Contact:</strong> <Link href="/contact" className="text-ob-purple hover:underline">Contact Page</Link>
              </p>
            </div>
          </div>

          <div className="bg-ob-light rounded-xl p-6 border border-gray-100">
            <p className="text-gray-500 text-sm italic">
              <strong>Important Notice:</strong> This Privacy Policy is a working document that must be reviewed and finalised against applicable Nigerian data protection requirements — including the Nigeria Data Protection Regulation (NDPR) and any successor legislation — and any other jurisdictions in which OjaBridge operates. It does not constitute legal advice. Please seek qualified legal counsel before commercial launch.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

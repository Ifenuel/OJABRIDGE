import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service — OjaBridge',
  description: 'The terms governing your use of the OjaBridge marketplace platform.',
};

export default function TermsPage() {
  return (
    <>
      <section className="bg-ob-navy text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-ob-lime font-semibold text-sm uppercase tracking-wider">Legal</span>
          <h1 className="text-4xl md:text-5xl font-bold mt-4 mb-6">Terms of Service</h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            The terms governing your use of the OjaBridge marketplace platform, including customer, vendor and retailer accounts.
          </p>
          <p className="text-gray-400 text-sm mt-4">Last updated: August 2025</p>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="max-w-3xl mx-auto space-y-10">

          <div>
            <h2 className="text-xl font-bold text-ob-navy mb-3">1. Acceptance of Terms</h2>
            <p className="text-gray-600 leading-relaxed">
              By accessing or using the OjaBridge platform (&quot;Platform&quot;), including our website, vendor dashboard, admin dashboard and related services, you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree, do not use the Platform.
            </p>
            <p className="text-gray-600 leading-relaxed mt-3">
              These Terms form a legally binding agreement between you (&quot;User&quot;, &quot;you&quot;) and OjaBridge (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;). By creating an account, browsing, purchasing or listing products on the Platform, you confirm that you have read, understood and accepted these Terms.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-ob-navy mb-3">2. Platform Description</h2>
            <p className="text-gray-600 leading-relaxed">
              OjaBridge is a multi-vendor marketplace platform that connects suppliers, vendors, retailers and customers. The Platform provides marketplace infrastructure, vendor verification, payment processing, order management, buyer protection and related services.
            </p>
            <p className="text-gray-600 leading-relaxed mt-3">
              OjaBridge acts as an intermediary marketplace. We do not own, manufacture, warehouse or directly sell products listed by vendors. Each vendor is responsible for their own products, inventory, pricing, descriptions, fulfillment and customer service obligations within the framework established by these Terms and platform policies.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-ob-navy mb-3">3. Account Registration</h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              To use certain features of the Platform, you must create an account. You agree to:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Provide accurate, current and complete information during registration</li>
              <li>Maintain and promptly update your account information</li>
              <li>Keep your password confidential and secure</li>
              <li>Accept responsibility for all activity that occurs under your account</li>
              <li>Notify OjaBridge immediately of any unauthorised use of your account</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-3">
              You must be at least 18 years of age to create an account. OjaBridge reserves the right to suspend or terminate accounts that provide false, misleading or incomplete information.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-ob-navy mb-3">4. User Accounts and Roles</h2>
            <p className="text-gray-600 leading-relaxed mb-3">The Platform supports the following account types:</p>

            <h3 className="font-semibold text-ob-navy mt-4 mb-2">4.1 Customer Accounts</h3>
            <p className="text-gray-600 leading-relaxed">
              Customers may browse products, make purchases, track orders, leave reviews, open disputes and manage their accounts. Customers must provide accurate delivery information and payment details.
            </p>

            <h3 className="font-semibold text-ob-navy mt-4 mb-2">4.2 Retailer Accounts</h3>
            <p className="text-gray-600 leading-relaxed">
              Retailers are business buyers who source products from OjaBridge vendors for resale. Retailers may access business-focused features including bulk ordering and sourcing tools. Retailers are responsible for their own resale activities and compliance with applicable business regulations.
            </p>

            <h3 className="font-semibold text-ob-navy mt-4 mb-2">4.3 Vendor Accounts</h3>
            <p className="text-gray-600 leading-relaxed">
              Vendors list and sell products through the Platform. Vendors must complete the required verification process (KYC/KYB), maintain accurate product information, fulfill orders promptly and comply with all applicable laws and platform policies. Vendors are independent businesses and are not employees, agents or partners of OjaBridge.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-ob-navy mb-3">5. Vendor Verification and KYC/KYB</h2>
            <p className="text-gray-600 leading-relaxed">
              All vendors must complete OjaBridge&apos;s verification process before listing products or receiving orders. This includes identity verification (KYC), business verification (KYB) where applicable and bank account verification for settlement purposes.
            </p>
            <p className="text-gray-600 leading-relaxed mt-3">
              Verification requirements may include government-issued identification, business registration documents, proof of address and bank account details. OjaBridge reserves the right to request additional documentation, re-verify vendors at any time and restrict vendor accounts where verification requirements are not met.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-ob-navy mb-3">6. Product Listings</h2>
            <p className="text-gray-600 leading-relaxed mb-3">Vendors are responsible for ensuring that all product listings:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Accurately describe the product, including features, specifications, condition and limitations</li>
              <li>Use truthful, high-quality images that represent the actual product</li>
              <li>Display correct pricing, including any applicable taxes or fees</li>
              <li>Reflect accurate stock availability</li>
              <li>Comply with all applicable laws regarding the product category</li>
              <li>Do not infringe upon the intellectual property rights of any third party</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-3">
              OjaBridge reserves the right to review, reject, remove or modify product listings that violate platform policies, are misleading or do not meet quality standards.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-ob-navy mb-3">7. Prohibited Products</h2>
            <p className="text-gray-600 leading-relaxed mb-3">The following are not permitted on OjaBridge:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Counterfeit, fake or unauthorised replica products</li>
              <li>Products prohibited by applicable Nigerian or international law</li>
              <li>Weapons, ammunition or explosives</li>
              <li>Controlled substances, illegal drugs or drug paraphernalia</li>
              <li>Hazardous materials without appropriate licensing</li>
              <li>Stolen or illegally obtained goods</li>
              <li>Products that violate intellectual property rights</li>
              <li>Adult or explicit content violating platform standards</li>
              <li>Products designed to deceive, defraud or harm consumers</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-3">
              Listing prohibited products may result in immediate account suspension, permanent ban and potential legal action.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-ob-navy mb-3">8. Orders</h2>
            <p className="text-gray-600 leading-relaxed">
              When a customer places an order, the customer agrees to purchase the listed product(s) at the stated price. An order becomes binding once payment is confirmed and the vendor receives the order for processing. OjaBridge facilitates the transaction but is not a party to the sale between vendor and customer.
            </p>
            <p className="text-gray-600 leading-relaxed mt-3">
              Vendors are expected to process and ship orders within the timeframe communicated to the customer. Failure to fulfill orders within the stated timeframe may result in automatic cancellation and refund, and may affect the vendor&apos;s standing on the Platform.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-ob-navy mb-3">9. Payments</h2>
            <p className="text-gray-600 leading-relaxed">
              All payments on OjaBridge are processed through Paystack. By making a payment, you agree to comply with Paystack&apos;s terms of service and any applicable payment regulations.
            </p>
            <p className="text-gray-600 leading-relaxed mt-3">
              OjaBridge uses a split payment model. When a customer makes a payment for an order, the funds are processed through Paystack and allocated as follows:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4 mt-3">
              <li>OjaBridge receives a <strong>10% platform commission</strong> on the transaction amount</li>
              <li>The vendor receives the remaining <strong>90%</strong>, subject to settlement terms</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-3">
              Commission rates are calculated server-side and are not subject to modification by customers or vendors. OjaBridge reserves the right to adjust commission rates with reasonable notice to vendors.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-ob-navy mb-3">10. Vendor Settlements</h2>
            <p className="text-gray-600 leading-relaxed">
              Vendor payouts are processed according to the settlement schedule configured on the Platform. Settlement eligibility requires that the order has been completed (delivered and confirmed) and that no active dispute or refund request is pending for the relevant transaction.
            </p>
            <p className="text-gray-600 leading-relaxed mt-3">
              Vendors are responsible for maintaining accurate bank account information. OjaBridge is not responsible for failed settlements resulting from incorrect banking details provided by the vendor.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-ob-navy mb-3">11. Delivery</h2>
            <p className="text-gray-600 leading-relaxed">
              Vendors are responsible for fulfilling orders and ensuring products reach customers in good condition. Delivery responsibilities include proper packaging, accurate addressing, providing tracking information and meeting the delivery timeframe communicated to the customer.
            </p>
            <p className="text-gray-600 leading-relaxed mt-3">
              OjaBridge provides order tracking infrastructure but is not responsible for the physical delivery of products. Where third-party logistics providers are used, their terms and conditions apply to the delivery service.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-ob-navy mb-3">12. Returns and Refunds</h2>
            <p className="text-gray-600 leading-relaxed">
              Customers may request refunds in accordance with the OjaBridge Refund Policy. Refund eligibility depends on the nature of the issue, including but not limited to: product not received, wrong product, damaged product, missing items or product significantly different from the listing description.
            </p>
            <p className="text-gray-600 leading-relaxed mt-3">
              Refund requests are subject to evidence review and dispute resolution procedures. Approved refunds are processed back to the original payment method. See our <Link href="/refund-policy" className="text-ob-purple hover:underline">Refund Policy</Link> for full details.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-ob-navy mb-3">13. Disputes</h2>
            <p className="text-gray-600 leading-relaxed">
              If a customer and vendor cannot resolve an issue directly, either party may open a dispute through the Platform. OjaBridge will review the evidence provided by both parties and make a determination based on the evidence, platform policies and applicable terms.
            </p>
            <p className="text-gray-600 leading-relaxed mt-3">
              Both parties agree to cooperate with OjaBridge&apos;s dispute resolution process. OjaBridge&apos;s decision in dispute matters is final within the Platform, subject to applicable legal rights.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-ob-navy mb-3">14. Reviews</h2>
            <p className="text-gray-600 leading-relaxed">
              Customers may leave reviews for products they have purchased through the Platform. Reviews must be honest, relevant and based on genuine experience. OjaBridge reserves the right to remove reviews that are fraudulent, defamatory, irrelevant or violate platform policies.
            </p>
            <p className="text-gray-600 leading-relaxed mt-3">
              Vendors may not solicit fake reviews, offer incentives for positive reviews or engage in any review manipulation. Violations may result in account restrictions.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-ob-navy mb-3">15. Marketplace Conduct</h2>
            <p className="text-gray-600 leading-relaxed mb-3">All users agree not to:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Use the Platform for fraudulent, illegal or unauthorised purposes</li>
              <li>Manipulate pricing, orders, reviews or any other Platform mechanism</li>
              <li>Circumvent platform fees or commission structures</li>
              <li>Harass, threaten or abuse other users, vendors or OjaBridge staff</li>
              <li>Collect or harvest user data without authorisation</li>
              <li>Interfere with or disrupt Platform infrastructure or security</li>
              <li>Use automated systems to access or scrape the Platform without authorisation</li>
              <li>Create multiple accounts to circumvent restrictions or enforcement actions</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-ob-navy mb-3">16. Fraud</h2>
            <p className="text-gray-600 leading-relaxed">
              OjaBridge takes fraud seriously. Suspected fraudulent activity — including payment fraud, identity fraud, product counterfeiting, review manipulation or account misuse — may result in immediate account suspension, permanent ban and referral to appropriate law enforcement authorities.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-ob-navy mb-3">17. Account Restrictions, Suspension and Banning</h2>
            <p className="text-gray-600 leading-relaxed">
              OjaBridge reserves the right to restrict, suspend or permanently ban any account at its reasonable discretion where there is evidence of policy violations, fraud, security risks, non-payment, persistent complaints or conduct harmful to the Platform, its users or its integrity.
            </p>
            <p className="text-gray-600 leading-relaxed mt-3">
              Where practicable, OjaBridge will notify the affected user and provide an opportunity to respond before imposing permanent restrictions. However, OjaBridge may take immediate action where necessary to protect the Platform, its users or ongoing transactions.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-ob-navy mb-3">18. Intellectual Property</h2>
            <p className="text-gray-600 leading-relaxed">
              All intellectual property rights in the OjaBridge platform, including its design, code, branding, logo and documentation, are owned by or licensed to OjaBridge. Users are granted a limited, non-exclusive licence to use the Platform in accordance with these Terms.
            </p>
            <p className="text-gray-600 leading-relaxed mt-3">
              Vendors retain ownership of their product images, descriptions and brand content but grant OjaBridge a licence to display, promote and market such content as necessary to operate the Platform.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-ob-navy mb-3">19. Communications</h2>
            <p className="text-gray-600 leading-relaxed">
              By using the Platform, you agree to receive transactional communications related to your orders, account and Platform activity. These may include email notifications, order updates, security alerts and important platform announcements.
            </p>
            <p className="text-gray-600 leading-relaxed mt-3">
              You may manage your communication preferences through your account settings, though certain transactional and security-related communications cannot be opted out of while maintaining an active account.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-ob-navy mb-3">20. Privacy</h2>
            <p className="text-gray-600 leading-relaxed">
              Your use of the Platform is also governed by our <Link href="/privacy" className="text-ob-purple hover:underline">Privacy Policy</Link>, which describes how we collect, use, protect and manage your personal information. By using the Platform, you consent to the practices described in the Privacy Policy.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-ob-navy mb-3">21. Security</h2>
            <p className="text-gray-600 leading-relaxed">
              OjaBridge implements technical and organisational security measures to protect user accounts, data and transactions. However, no digital platform can guarantee absolute security. Users are responsible for maintaining the security of their own accounts, including using strong passwords, enabling multi-factor authentication where available and reporting suspicious activity.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-ob-navy mb-3">22. Third-Party Services</h2>
            <p className="text-gray-600 leading-relaxed">
              The Platform integrates with third-party services including payment processors (Paystack), identity verification providers, logistics providers and email services. These services have their own terms and privacy policies. OjaBridge is not responsible for the performance, availability or practices of third-party services, though we select service providers carefully and monitor their performance.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-ob-navy mb-3">23. Limitation of Liability</h2>
            <p className="text-gray-600 leading-relaxed">
              To the maximum extent permitted by applicable law, OjaBridge shall not be liable for indirect, incidental, special, consequential or punitive damages, including loss of profits, data, business opportunities or goodwill, arising out of or related to your use of the Platform.
            </p>
            <p className="text-gray-600 leading-relaxed mt-3">
              OjaBridge facilitates marketplace transactions but is not a party to sales between vendors and customers. Product quality, delivery, accuracy of descriptions and customer satisfaction are primarily the responsibility of the vendor. OjaBridge&apos;s liability is limited to the Platform services it provides directly.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-ob-navy mb-3">24. Changes to the Platform</h2>
            <p className="text-gray-600 leading-relaxed">
              OjaBridge reserves the right to modify, update, suspend or discontinue any feature of the Platform at any time. Where changes materially affect existing transactions or user rights, reasonable efforts will be made to communicate such changes in advance.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-ob-navy mb-3">25. Changes to These Terms</h2>
            <p className="text-gray-600 leading-relaxed">
              OjaBridge may update these Terms from time to time. Significant changes will be communicated through the Platform. Your continued use of the Platform after such changes constitutes acceptance of the updated Terms. If you do not agree with revised Terms, you should discontinue use of the Platform.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-ob-navy mb-3">26. Termination</h2>
            <p className="text-gray-600 leading-relaxed">
              You may close your account at any time by contacting OjaBridge support, provided that no pending transactions, disputes or obligations remain outstanding. OjaBridge may terminate or suspend your account in accordance with these Terms and platform policies.
            </p>
            <p className="text-gray-600 leading-relaxed mt-3">
              Upon termination, your right to use the Platform ceases. Pending orders, settlements and obligations survive termination as required to complete existing transactions and comply with legal obligations.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-ob-navy mb-3">27. Governing Law</h2>
            <p className="text-gray-600 leading-relaxed">
              These Terms are governed by and construed in accordance with the laws of the Federal Republic of Nigeria. Any disputes arising from or related to these Terms or the Platform shall be subject to the exclusive jurisdiction of the courts of Nigeria, unless otherwise required by applicable consumer protection law.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-ob-navy mb-3">28. Contact Information</h2>
            <p className="text-gray-600 leading-relaxed">
              For questions about these Terms, please contact us at <strong>awoyoemmanuel12@gmail.com</strong> or visit our <Link href="/contact" className="text-ob-purple hover:underline">Contact Page</Link>.
            </p>
          </div>

          <div className="bg-ob-light rounded-xl p-6 border border-gray-100">
            <p className="text-gray-500 text-sm italic">
              <strong>Important Notice:</strong> These Terms of Service are a working commercial and legal draft. They must be reviewed and finalised by qualified legal counsel against applicable Nigerian laws and regulations — including the Nigeria Data Protection Regulation, the Consumer Protection Act, the Electronic Transactions Act, applicable payment and financial regulations and any other jurisdictions in which OjaBridge operates — before the Platform launches commercially. These Terms do not constitute legal advice.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

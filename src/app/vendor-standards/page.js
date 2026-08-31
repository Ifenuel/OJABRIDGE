'use client';

export default function VendorStandardsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <p className="text-ob-purple text-sm font-semibold tracking-wider uppercase mb-2">Standards</p>
        <h1 className="text-3xl md:text-4xl font-bold text-ob-navy mb-2">Vendor & Seller Standards</h1>
        <p className="text-gray-400 text-sm mb-8">Last updated: August 29, 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-ob-navy mb-3">1. Vendor Eligibility</h2>
            <p className="text-gray-600">Vendors on OjaBridge must be legitimate businesses or individuals operating within applicable law. All vendors must complete KYC/KYB verification, including identity verification, business registration (RC number where applicable) and bank account verification before they can publish products.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ob-navy mb-3">2. Product Quality</h2>
            <p className="text-gray-600">Vendors are expected to list accurate product descriptions, images, pricing and availability. Products must match the listing as closely as reasonably possible. Misleading listings, counterfeit products and materially inaccurate descriptions are prohibited.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ob-navy mb-3">3. Order Fulfillment</h2>
            <p className="text-gray-600">Vendors must process and ship orders within the timeframe indicated at purchase. Failure to fulfill orders in a timely manner may result in order cancellation, refund initiation and potential account review.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ob-navy mb-3">4. Customer Communication</h2>
            <p className="text-gray-600">Vendors should respond to customer inquiries and order-related messages through OjaBridge in a professional and timely manner. Good communication helps build trust and reduces disputes.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ob-navy mb-3">5. Returns & Refunds</h2>
            <p className="text-gray-600">Vendors must honor OjaBridge&apos;s Refund &amp; Returns Policy. When a refund is approved, vendors must cooperate with the process. Repeated failure to address legitimate customer issues may result in account restrictions.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ob-navy mb-3">6. Pricing</h2>
            <p className="text-gray-600">Vendors set their own prices. Prices must be accurate and must not include hidden fees not disclosed before checkout. OjaBridge charges a 10% platform commission on each completed transaction.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ob-navy mb-3">7. Compliance</h2>
            <p className="text-gray-600">Vendors must comply with all applicable local, national and international laws regarding the products they sell, including but not limited to product safety, labeling, import/export regulations and consumer protection requirements.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ob-navy mb-3">8. Account Review & Enforcement</h2>
            <p className="text-gray-600">OjaBridge reserves the right to review, restrict, suspend or terminate vendor accounts that violate these standards, engage in fraudulent activity or repeatedly fail to meet customer expectations.</p>
          </section>

          <section className="bg-amber-50 border border-amber-200 rounded-xl p-6 mt-8">
            <p className="text-amber-700 text-sm">
              <strong>Note:</strong> This is a working product document. It should be reviewed and finalized by qualified legal professionals before commercial launch.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

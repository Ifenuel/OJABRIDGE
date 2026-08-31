'use client';

export default function ProhibitedProductsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <p className="text-ob-purple text-sm font-semibold tracking-wider uppercase mb-2">Policy</p>
        <h1 className="text-3xl md:text-4xl font-bold text-ob-navy mb-2">Prohibited Products & Activities</h1>
        <p className="text-gray-400 text-sm mb-8">Last updated: August 29, 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-ob-navy mb-3">1. Overview</h2>
            <p className="text-gray-600">OjaBridge maintains standards for what can and cannot be sold or promoted on the platform. Listing prohibited products or engaging in prohibited activities may result in product removal, account restriction or permanent suspension.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ob-navy mb-3">2. Prohibited Products</h2>
            <p className="text-gray-600 mb-3">The following product categories are prohibited on OjaBridge:</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                'Counterfeit or fake products',
                'Weapons, firearms and ammunition',
                'Drugs, narcotics and controlled substances',
                'Stolen goods',
                'Products violating intellectual property rights',
                'Hazardous materials and chemicals',
                'Live animals',
                'Human body parts or remains',
                'Recalled products',
                'Products requiring prescription without authorization',
                'Gambling items or lottery tickets',
                'Adult or explicit content',
                'Surveillance or spy equipment',
                'Products promoting illegal activity',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                  <span className="text-red-500 text-sm">✗</span>
                  <span className="text-gray-700 text-sm">{item}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ob-navy mb-3">3. Prohibited Activities</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Listing products with false or misleading descriptions</li>
              <li>Manipulating reviews or ratings</li>
              <li>Circumventing OjaBridge payment processing</li>
              <li>Operating multiple accounts to evade restrictions</li>
              <li>Using the platform for money laundering or fraud</li>
              <li>Harassing, threatening or abusing other users</li>
              <li>Attempting to access other users&apos; accounts without authorization</li>
              <li>Uploading malicious software or code</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ob-navy mb-3">4. Reporting</h2>
            <p className="text-gray-600">If you encounter prohibited products or activities on OjaBridge, please report them through the platform support system or contact us directly.</p>
          </section>

          <section className="bg-amber-50 border border-amber-200 rounded-xl p-6 mt-8">
            <p className="text-amber-700 text-sm">
              <strong>Note:</strong> This document should be reviewed by qualified legal professionals before commercial launch.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

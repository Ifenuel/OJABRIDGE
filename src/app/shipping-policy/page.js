'use client';

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <p className="text-ob-purple text-sm font-semibold tracking-wider uppercase mb-2">Policy</p>
        <h1 className="text-3xl md:text-4xl font-bold text-ob-navy mb-2">Shipping & Delivery Policy</h1>
        <p className="text-gray-400 text-sm mb-8">Last updated: August 29, 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-ob-navy mb-3">1. Overview</h2>
            <p className="text-gray-600">OjaBridge is a marketplace platform connecting verified vendors with customers. Shipping and delivery of products is the responsibility of the individual vendor fulfilling the order, coordinated through OjaBridge&apos;s order management system.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ob-navy mb-3">2. Shipping Responsibility</h2>
            <p className="text-gray-600">Each vendor is responsible for packaging, preparing and shipping their products to customers. OjaBridge provides the order management infrastructure and tracking support, but the actual fulfillment is performed by the vendor.</p>
            <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
              <li>Vendor confirms and processes the order</li>
              <li>Vendor dispatches the product through an approved logistics channel</li>
              <li>Tracking information is shared with the customer through OjaBridge</li>
              <li>Customer can track order status in real time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ob-navy mb-3">3. Delivery Timeframes</h2>
            <p className="text-gray-600">Delivery timeframes depend on the vendor&apos;s location, the customer&apos;s delivery address, and the logistics provider used. Estimated delivery times are provided at checkout but may vary. OjaBridge does not guarantee specific delivery dates unless explicitly confirmed by the vendor.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ob-navy mb-3">4. Order Tracking</h2>
            <p className="text-gray-600">Once an order is shipped, customers receive tracking information through their OjaBridge account and, where configured, through email notifications. Tracking updates depend on the logistics provider&apos;s reporting.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ob-navy mb-3">5. Delivery Confirmation</h2>
            <p className="text-gray-600">Customers are encouraged to confirm receipt of their order through OjaBridge. This confirmation is part of the order completion process and may affect vendor settlement eligibility.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ob-navy mb-3">6. Failed or Undeliverable Orders</h2>
            <p className="text-gray-600">If a delivery fails or the product is undeliverable due to customer-provided incorrect address, unavailability or other customer-related issues, the vendor and customer should coordinate through OjaBridge support. Additional shipping charges may apply for redelivery.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ob-navy mb-3">7. Third-Party Logistics</h2>
            <p className="text-gray-600">OjaBridge may integrate with third-party logistics providers to support order tracking and delivery coordination. OjaBridge is not responsible for delays, losses or damages caused by third-party logistics providers.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ob-navy mb-3">8. International Shipping</h2>
            <p className="text-gray-600">International shipping availability, customs duties, import taxes and delivery timeframes depend on the vendor, logistics provider and destination country. Customers are responsible for understanding import requirements for their location.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ob-navy mb-3">9. Damaged or Lost Shipments</h2>
            <p className="text-gray-600">If a product arrives damaged or is lost in transit, the customer should contact OjaBridge support within [NUMBER] days of the expected delivery date. Appropriate evidence (photographs, description) should be provided to support the claim.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ob-navy mb-3">10. Changes to This Policy</h2>
            <p className="text-gray-600">OjaBridge reserves the right to update this Shipping &amp; Delivery Policy. Material changes will be communicated through the platform.</p>
          </section>

          <section className="bg-amber-50 border border-amber-200 rounded-xl p-6 mt-8">
            <p className="text-amber-700 text-sm">
              <strong>Important:</strong> This Shipping &amp; Delivery Policy is a working product document. It should be reviewed and finalized by qualified legal and compliance professionals before commercial launch.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

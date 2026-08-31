import Link from 'next/link';

export const metadata = {
  title: 'Refund & Return Policy — OjaBridge',
  description: 'The OjaBridge Refund and Return Policy — how refunds, returns and dispute resolution work on the marketplace.',
};

export default function RefundPolicyPage() {
  return (
    <>
      <section className="bg-ob-navy text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-ob-lime font-semibold text-sm uppercase tracking-wider">Policy</span>
          <h1 className="text-4xl md:text-5xl font-bold mt-4 mb-6">Refund &amp; Return Policy</h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            How refunds, returns and dispute resolution work when you shop on the OjaBridge marketplace.
          </p>
          <p className="text-gray-400 text-sm mt-4">Last updated: August 2025</p>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="max-w-3xl mx-auto space-y-10">

          <div>
            <h2 className="text-xl font-bold text-ob-navy mb-3">1. Overview</h2>
            <p className="text-gray-600 leading-relaxed">
              OjaBridge is committed to fair and transparent commerce. This Refund and Return Policy explains when and how customers may request refunds, how disputes are handled and what responsibilities vendors and OjaBridge each have in the refund process.
            </p>
            <p className="text-gray-600 leading-relaxed mt-3">
              Because OjaBridge is a marketplace connecting independent vendors with customers, refunds involve coordination between the customer, the vendor and the Platform. This policy applies to all purchases made through OjaBridge.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-ob-navy mb-3">2. When You May Request a Refund</h2>
            <p className="text-gray-600 leading-relaxed mb-3">Customers may request a refund in the following situations:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li><strong>Product not received:</strong> The order was not delivered within the stated timeframe or was never received</li>
              <li><strong>Wrong product:</strong> The product received is different from what was ordered</li>
              <li><strong>Damaged product:</strong> The product arrived damaged, broken or defective</li>
              <li><strong>Missing items:</strong> The order is incomplete with items missing from the delivery</li>
              <li><strong>Misrepresented product:</strong> The product is significantly different from the listing description, images or specifications</li>
              <li><strong>Not as described:</strong> The product does not match what was advertised on the product page</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-ob-navy mb-3">3. Cancellation Scenarios</h2>
            <div className="space-y-4">
              <div className="bg-ob-light rounded-xl p-5 border border-gray-100">
                <h3 className="font-semibold text-ob-navy mb-2">Before Shipment</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  If you cancel an order before the vendor has shipped it, a full refund will be processed. Cancellation is not guaranteed once the vendor has begun processing or shipping the order.
                </p>
              </div>
              <div className="bg-ob-light rounded-xl p-5 border border-gray-100">
                <h3 className="font-semibold text-ob-navy mb-2">After Shipment</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  If you wish to cancel after the product has been shipped, you may refuse delivery (where possible) or return the product in accordance with this policy. Return shipping costs may apply depending on the circumstances.
                </p>
              </div>
              <div className="bg-ob-light rounded-xl p-5 border border-gray-100">
                <h3 className="font-semibold text-ob-navy mb-2">Payment Not Completed</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  If payment was not successfully completed, the order will not be processed. No money is deducted and no refund action is required.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-ob-navy mb-3">4. Return Process</h2>
            <ol className="list-decimal list-inside text-gray-600 space-y-3 ml-4">
              <li><strong>Submit a request:</strong> Go to your order in your account and select Request Refund or Return. Choose the reason and provide details.</li>
              <li><strong>Provide evidence:</strong> Where applicable, upload photos or videos showing the issue with the product, packaging or delivery.</li>
              <li><strong>Vendor review:</strong> The vendor is notified and given the opportunity to respond. In many cases, the vendor may offer a resolution directly (replacement, partial refund, return shipping label).</li>
              <li><strong>Return the product:</strong> If a return is required, the vendor will provide instructions. Products must be returned in the condition described in the return instructions.</li>
              <li><strong>OjaBridge mediation:</strong> If the customer and vendor cannot reach agreement, OjaBridge will review the evidence and make a determination.</li>
            </ol>
          </div>

          <div>
            <h2 className="text-xl font-bold text-ob-navy mb-3">5. Evidence Requirements</h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              To support your refund request, please provide:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Clear photos or videos of the product showing the issue</li>
              <li>Photos of the packaging (if damaged during shipping)</li>
              <li>Screenshots of the product listing for comparison</li>
              <li>Any communication with the vendor related to the issue</li>
              <li>Order number and delivery confirmation</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-3">
              Incomplete or unclear evidence may delay the resolution process. Requests without supporting evidence for damage or discrepancy claims may not be approved.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-ob-navy mb-3">6. Dispute Process</h2>
            <p className="text-gray-600 leading-relaxed">
              If you and the vendor cannot reach a resolution within a reasonable timeframe, you may escalate the matter to OjaBridge for mediation. OjaBridge will:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4 mt-3">
              <li>Review all evidence submitted by both parties</li>
              <li>Review the product listing, order details and communication history</li>
              <li>Make a fair determination based on the evidence and platform policies</li>
              <li>Communicate the decision to both parties</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-3">
              OjaBridge&apos;s dispute resolution decision is final within the Platform, subject to applicable consumer protection rights.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-ob-navy mb-3">7. Refund Types</h2>
            <div className="space-y-4">
              <div className="bg-ob-light rounded-xl p-5 border border-gray-100">
                <h3 className="font-semibold text-ob-navy mb-2">Full Refund</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  A full refund includes the complete product cost. This typically applies when the product was not received, was significantly misrepresented, was defective or was the wrong item entirely.
                </p>
              </div>
              <div className="bg-ob-light rounded-xl p-5 border border-gray-100">
                <h3 className="font-semibold text-ob-navy mb-2">Partial Refund</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  A partial refund covers a portion of the product cost. This may apply when the product has minor defects, some items are missing from a multi-item order or the product is partially different from what was described.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-ob-navy mb-3">8. Refund Processing</h2>
            <p className="text-gray-600 leading-relaxed">
              Approved refunds are processed back to the original payment method used for the purchase. Processing time depends on your bank or payment provider, typically 3-5 business days after the refund is approved and initiated.
            </p>
            <p className="text-gray-600 leading-relaxed mt-3">
              OjaBridge initiates the refund through Paystack once a refund is approved. The actual timing of the funds appearing in your account depends on your bank&apos;s processing timelines.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-ob-navy mb-3">9. Payment Provider Limitations</h2>
            <p className="text-gray-600 leading-relaxed">
              Refund capabilities are subject to the policies and technical limitations of the payment provider (Paystack). In certain cases — for example, if the original payment was made through a bank transfer or if the payment account is no longer active — the refund process may differ or take longer. OjaBridge will communicate any such limitations transparently.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-ob-navy mb-3">10. Non-Refundable Situations</h2>
            <p className="text-gray-600 leading-relaxed mb-3">Refunds may not be available in the following situations:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Change of mind after the product has been used, worn or altered from its original condition (unless the product was misrepresented)</li>
              <li>Products that were clearly described and match the listing but do not meet subjective expectations</li>
              <li>Products marked as final sale or non-returnable on the product listing</li>
              <li>Digital products or services that have been delivered or activated (where applicable)</li>
              <li>Perishable goods that cannot be returned due to their nature</li>
              <li>Customised or personalised products (unless defective or misrepresented)</li>
              <li>Products returned after the allowable return window without a valid reason</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-ob-navy mb-3">11. Vendor Responsibilities</h2>
            <p className="text-gray-600 leading-relaxed">
              Vendors are expected to:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4 mt-2">
              <li>Provide accurate product descriptions, images and specifications</li>
              <li>Ship products that match what was listed and sold</li>
              <li>Package products appropriately to prevent damage during shipping</li>
              <li>Respond to refund inquiries promptly and professionally</li>
              <li>Honour the refund policies outlined on their product listings and this policy</li>
              <li>Cooperate with OjaBridge dispute resolution processes</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-3">
              Persistent issues with product quality, misleading listings or uncooperative behaviour may result in account review, restrictions or removal from the Platform.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-ob-navy mb-3">12. OjaBridge&apos;s Role</h2>
            <p className="text-gray-600 leading-relaxed">
              OjaBridge facilitates the refund process but is not the seller of the products. Our role is to:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4 mt-2">
              <li>Provide the infrastructure for refund requests and dispute resolution</li>
              <li>Mediate between customers and vendors when direct resolution is not possible</li>
              <li>Process refund payments through the payment provider when approved</li>
              <li>Enforce platform policies regarding product quality and vendor conduct</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-ob-navy mb-3">13. Buyer Protection</h2>
            <p className="text-gray-600 leading-relaxed">
              Every purchase made through OjaBridge is covered by our Buyer Protection programme. This means your payment is held securely until you receive your order and have the opportunity to confirm that it meets the product listing. If something goes wrong, our dispute resolution process ensures your case is reviewed fairly.
            </p>
            <p className="text-gray-600 leading-relaxed mt-3">
              Buyer Protection covers: non-delivery, wrong items, damaged products, significantly misrepresented products and vendor non-response to reasonable refund requests.
            </p>
          </div>

          <div className="bg-ob-light rounded-xl p-6 border border-gray-100">
            <p className="text-gray-500 text-sm italic">
              This Refund and Return Policy is a working document that must be reviewed against applicable Nigerian consumer protection requirements and any other jurisdictions in which OjaBridge operates before commercial launch.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

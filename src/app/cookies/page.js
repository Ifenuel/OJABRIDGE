export const metadata = {
  title: 'Cookie Policy — OjaBridge',
  description: 'How OjaBridge uses cookies and similar technologies to provide and improve our marketplace services.',
};

export default function CookiePolicyPage() {
  return (
    <>
      <section className="bg-ob-navy text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-ob-lime font-semibold text-sm uppercase tracking-wider">Legal</span>
          <h1 className="text-4xl md:text-5xl font-bold mt-4 mb-6">Cookie Policy</h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            How OjaBridge uses cookies and similar technologies on our marketplace platform.
          </p>
          <p className="text-gray-400 text-sm mt-4">Last updated: August 2025</p>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="max-w-3xl mx-auto space-y-10">
          <div>
            <h2 className="text-xl font-bold text-ob-navy mb-3">1. What Are Cookies</h2>
            <p className="text-gray-600 leading-relaxed">
              Cookies are small text files placed on your device when you visit a website. They help websites function correctly, remember your preferences and provide information to the website operator. OjaBridge uses cookies and similar technologies (such as local storage) to provide and improve our marketplace services.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-ob-navy mb-3">2. How We Use Cookies</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              OjaBridge uses cookies for the following purposes:
            </p>
            <div className="space-y-4">
              <div className="bg-ob-light rounded-xl p-5 border border-gray-100">
                <h3 className="font-semibold text-ob-navy mb-2">Essential Cookies</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Required for OjaBridge to function correctly. These include authentication cookies (keeping you logged in), security cookies (protecting your session), session cookies (maintaining your shopping cart and checkout state) and load-balancing cookies (distributing traffic across our infrastructure). You cannot opt out of essential cookies while using OjaBridge.
                </p>
              </div>
              <div className="bg-ob-light rounded-xl p-5 border border-gray-100">
                <h3 className="font-semibold text-ob-navy mb-2">Functional Cookies</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Remember your preferences such as currency selection, language settings, recently viewed products and region. These improve your experience but are not strictly necessary for the platform to function.
                </p>
              </div>
              <div className="bg-ob-light rounded-xl p-5 border border-gray-100">
                <h3 className="font-semibold text-ob-navy mb-2">Analytics Cookies</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Help us understand how visitors interact with OjaBridge — which pages are visited, how users navigate the marketplace and where technical issues occur. This information helps us improve the platform. Analytics data is aggregated and does not identify individual users.
                </p>
              </div>
              <div className="bg-ob-light rounded-xl p-5 border border-gray-100">
                <h3 className="font-semibold text-ob-navy mb-2">Security Cookies</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Used to detect suspicious activity, prevent fraud and protect accounts from unauthorised access. These cookies support the security infrastructure described in our Privacy Policy and help ensure marketplace integrity.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-ob-navy mb-3">3. Specific Cookies We Use</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-ob-navy">Cookie</th>
                    <th className="text-left py-3 px-4 font-semibold text-ob-navy">Purpose</th>
                    <th className="text-left py-3 px-4 font-semibold text-ob-navy">Duration</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600">
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 font-mono text-xs">ob_access_token</td>
                    <td className="py-3 px-4">Authentication — keeps you logged in</td>
                    <td className="py-3 px-4">24 hours</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 font-mono text-xs">ob_refresh_token</td>
                    <td className="py-3 px-4">Session refresh — maintains your session</td>
                    <td className="py-3 px-4">7 days</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 font-mono text-xs">ob_currency</td>
                    <td className="py-3 px-4">Remembers your preferred currency</td>
                    <td className="py-3 px-4">30 days</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 font-mono text-xs">ob_cart</td>
                    <td className="py-3 px-4">Shopping cart contents (local storage)</td>
                    <td className="py-3 px-4">30 days</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-ob-navy mb-3">4. Third-Party Cookies</h2>
            <p className="text-gray-600 leading-relaxed">
              Some third-party services integrated into OjaBridge may set their own cookies. For example, Paystack (our payment provider) may use cookies during payment processing. These third-party cookies are governed by the respective third party&apos;s privacy and cookie policies. OjaBridge does not control third-party cookies and recommends reviewing the relevant third-party policies.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-ob-navy mb-3">5. Local Storage</h2>
            <p className="text-gray-600 leading-relaxed">
              OjaBridge also uses browser local storage to maintain certain functionality, including shopping cart contents, user preferences and, in development environments, authentication session data. Local storage is stored on your device and can be cleared through your browser settings.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-ob-navy mb-3">6. Managing Cookies</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              You can manage cookie preferences through your browser settings. Most browsers allow you to:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>View what cookies are stored on your device</li>
              <li>Delete cookies individually or all at once</li>
              <li>Block cookies from specific websites</li>
              <li>Block all cookies (though this may affect OjaBridge functionality)</li>
              <li>Set preferences for specific websites</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-4">
              If you disable or block essential cookies, certain OjaBridge features may not function correctly, including login, checkout and security protections.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-ob-navy mb-3">7. Do Not Track</h2>
            <p className="text-gray-600 leading-relaxed">
              Some browsers offer a &quot;Do Not Track&quot; (DNT) signal. There is currently no universally accepted standard for how websites should respond to DNT signals. OjaBridge will continue to monitor developments in this area and update our practices as standards emerge.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-ob-navy mb-3">8. Changes to This Policy</h2>
            <p className="text-gray-600 leading-relaxed">
              We may update this Cookie Policy from time to time to reflect changes in our practices, technology, legal requirements or other factors. Significant changes will be communicated through appropriate platform notifications.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-ob-navy mb-3">9. Contact Us</h2>
            <p className="text-gray-600 leading-relaxed">
              For questions about our use of cookies, please contact us at <strong>awoyoemmanuel12@gmail.com</strong> or through our support channels.
            </p>
          </div>

          <div className="bg-ob-light rounded-xl p-6 border border-gray-100">
            <p className="text-gray-500 text-sm italic">
              This Cookie Policy is a working document that should be reviewed against applicable Nigerian data protection requirements before commercial launch.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

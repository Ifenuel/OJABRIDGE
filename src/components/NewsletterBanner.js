'use client';

import NewsletterSubscribe from './NewsletterSubscribe';

/**
 * NewsletterBanner — Full-width section above the footer.
 * Shows email subscribe form on every page.
 */
export default function NewsletterBanner() {
  return (
    <section className="bg-ob-navy py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h3 className="text-white text-lg font-bold mb-1">Stay in the Loop</h3>
        <p className="text-gray-400 text-sm mb-5">
          Get the latest product updates, exclusive offers, and marketplace news from OjaBridge.
        </p>
        <div className="max-w-md mx-auto">
          <NewsletterSubscribe dark />
        </div>
      </div>
    </section>
  );
}

/**
 * ============================================
 * OJABRIDGE PLATFORM CONFIGURATION
 * ============================================
 * 
 * Central place for all platform-wide settings.
 * When you get a real email/domain, update these values.
 * Everything across the site references this file.
 */

export const PLATFORM = {
  // Contact emails — update these when you have real email addresses
  emails: {
    support: process.env.PLATFORM_SUPPORT_EMAIL || 'support@ojabridge.com',
    press: process.env.PLATFORM_PRESS_EMAIL || 'press@ojabridge.com',
    careers: process.env.PLATFORM_CAREERS_EMAIL || 'careers@ojabridge.com',
    business: process.env.PLATFORM_BUSINESS_EMAIL || 'business@ojabridge.com',
    general: process.env.PLATFORM_GENERAL_EMAIL || 'hello@ojabridge.com',
  },

  // Social media links — update these when accounts are created
  social: {
    twitter: process.env.PLATFORM_TWITTER_URL || null,
    instagram: process.env.PLATFORM_INSTAGRAM_URL || null,
    linkedin: process.env.PLATFORM_LINKEDIN_URL || null,
    facebook: process.env.PLATFORM_FACEBOOK_URL || null,
    youtube: process.env.PLATFORM_YOUTUBE_URL || null,
  },

  // Platform info
  name: 'OjaBridge',
  tagline: 'Shop • Connect • Grow',
  description: "Africa's Leading Multi-Vendor Marketplace",
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://ojabridge.com',

  // Social link status message (shown when links are null)
  comingSoonMessage: 'Coming Soon',
};

/**
 * Get social links with fallback status
 * Returns array of { name, url, icon, available } objects
 */
export function getSocialLinks() {
  const links = [
    { name: 'Twitter', url: PLATFORM.social.twitter, icon: 'M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z' },
    { name: 'Instagram', url: PLATFORM.social.instagram, icon: 'M16 4H8a4 4 0 00-4 4v8a4 4 0 004 4h8a4 4 0 004-4V8a4 4 0 00-4-4zm-4 11a3 3 0 110-6 3 3 0 010 6zm4.5-7.5a1 1 0 110-2 1 1 0 010 2z' },
    { name: 'LinkedIn', url: PLATFORM.social.linkedin, icon: 'M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2zM4 6a2 2 0 100-4 2 2 0 000 4z' },
    { name: 'Facebook', url: PLATFORM.social.facebook, icon: 'M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z' },
    { name: 'YouTube', url: PLATFORM.social.youtube, icon: 'M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.43zM9.75 15.02V8.48l5.75 3.27-5.75 3.27z' },
  ];

  return links.map(link => ({
    ...link,
    available: !!link.url,
  }));
}

'use client';

import FirstVisitPopup from './FirstVisitPopup';

/**
 * ClientProviders — Client-side wrappers that need to be inside the body.
 * FirstVisitPopup: shows welcome modal on first visit.
 */
export default function ClientProviders() {
  return <FirstVisitPopup />;
}

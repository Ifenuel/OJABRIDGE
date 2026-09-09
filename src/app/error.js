'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

/**
 * Route error boundary.
 *
 * After every redeploy, browsers holding a cached page can request JS
 * chunks that no longer exist ("ChunkLoadError", "dynamically imported
 * module" etc.). The server is healthy — the client just has stale code.
 * For those errors we auto-reload ONCE (a reload fetches the new build
 * manifest) and tell the user how to fully clear the stale state.
 *
 * `error` is intentionally not rendered to users (may contain internals);
 * it is logged to the console for diagnostics.
 */
export default function Error({ error, reset }) {
  const [autoReloaded, setAutoReloaded] = useState(false);

  useEffect(() => {
    // Log for diagnostics (no sensitive data — just the error class)
    if (error) console.error('[OjaBridge] Page error:', error?.message || error);
    if (!error) return;

    const msg = String(error?.message || error?.digest || error);
    const isStaleChunk =
      /ChunkLoadError/i.test(msg) ||
      /dynamically imported module/i.test(msg) ||
      /Loading chunk \S+ failed/i.test(msg) ||
      /Failed to fetch dynamically imported module/i.test(msg) ||
      /error-undefined|_\S+\.js/i.test(msg) && /load/i.test(msg);

    // Auto-reload once per session for stale-chunk crashes
    if (isStaleChunk && !sessionStorage.getItem('ob_chunk_reloaded')) {
      sessionStorage.setItem('ob_chunk_reloaded', '1');
      setAutoReloaded(true);
      window.location.reload();
      return;
    }

    // Report to the server so failures are visible in Vercel logs
    fetch('/api/client-errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: String(error?.message || '').slice(0, 500),
        digest: error?.digest || null,
        path: window.location.pathname,
      }),
    }).catch(() => {});
  }, [error]);

  return (
    <div className="min-h-[70vh] bg-ob-light flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-8xl font-bold text-red-300/30">500</p>
        <h1 className="text-3xl font-bold text-ob-navy mt-4 mb-3">Something Went Wrong</h1>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          We encountered an unexpected error. Our team has been notified.
        </p>
        {autoReloaded && (
          <p className="text-ob-purple text-sm font-medium mb-4">Refreshing to the latest version…</p>
        )}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <button onClick={() => window.location.reload()} className="btn-primary">Try Again</button>
          <Link href="/" className="border-2 border-ob-purple text-ob-purple font-semibold px-6 py-3 rounded-lg hover:bg-ob-purple hover:text-white transition-all">
            Go to Homepage
          </Link>
        </div>
        <details className="max-w-md mx-auto text-left bg-white border border-gray-100 rounded-xl p-4">
          <summary className="text-sm font-medium text-gray-600 cursor-pointer">Page still broken? Try this</summary>
          <ol className="text-xs text-gray-500 mt-3 space-y-2 list-decimal list-inside">
            <li>Hard refresh this page: <strong>Ctrl + Shift + R</strong> (Windows) or <strong>Cmd + Shift + R</strong> (Mac)</li>
            <li>If it persists, clear site data: browser Settings → Privacy → Clear browsing data → Cached images and files</li>
            <li>Or open the site in a private/incognito window to confirm</li>
          </ol>
        </details>
      </div>
    </div>
  );
}

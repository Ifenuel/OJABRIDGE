'use client';

import { useEffect, useState } from 'react';

/**
 * KycDocumentViewer — Securely displays an uploaded KYC identity document.
 *
 * Why this exists: browsers BLOCK top-level navigation to data: URLs
 * (Chrome/Firefox/Safari), so <a href="data:..." target="_blank"> silently
 * fails. This component renders the document inline instead:
 *   - Images (JPEG/PNG/WebP/GIF) → <img> with zoom/fullscreen toggle
 *   - PDFs → converted to a blob: URL (same-origin, allowed to open) in an iframe
 *
 * Security notes:
 * - Documents are NEVER rendered until an authenticated admin/staff session
 *   fetches them through /api/secure-document (server-side auth check).
 * - If the URL is a plain data: URL already trusted from a gated admin API,
 *   it is converted to a blob locally; nothing is exposed to public pages.
 * - The blob URL is revoked on unmount so the binary doesn't linger in memory.
 */
export default function KycDocumentViewer({ url, label = 'Uploaded ID Document' }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [kind, setKind] = useState(null); // 'image' | 'pdf'
  const [zoomed, setZoomed] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let objectUrl = null;
    let cancelled = false;

    async function load() {
      if (!url) { setLoading(false); return; }
      try {
        let blob;
        let mime;
        if (url.startsWith('data:')) {
          // data:[mime];base64,payload
          const match = url.match(/^data:([^;,]+)(;base64)?,(.*)$/s);
          if (!match) throw new Error('Malformed data URL');
          mime = match[1];
          if (match[2]) {
            const bin = atob(match[3]);
            const bytes = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
            blob = new Blob([bytes], { type: mime });
          } else {
            blob = new Blob([decodeURIComponent(match[3])], { type: mime });
          }
        } else {
          // Remote URL — fetch through the secure document proxy (auth-gated)
          const res = await fetch(`/api/secure-document?url=${encodeURIComponent(url)}`, {
            credentials: 'include',
          });
          if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
          blob = await res.blob();
          mime = blob.type;
        }

        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
        setKind(mime === 'application/pdf' ? 'pdf' : 'image');
      } catch (e) {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  if (!url) return null;

  const download = () => {
    if (!blobUrl) return;
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `kyc-document-${kind === 'pdf' ? 'file.pdf' : 'image'}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</p>
        <div className="flex items-center gap-2">
          {blobUrl && kind === 'image' && (
            <button onClick={() => setZoomed(!zoomed)} className="text-[11px] text-ob-purple hover:underline">
              {zoomed ? 'Shrink' : 'View Full Size'}
            </button>
          )}
          {blobUrl && (
            <button onClick={download} className="text-[11px] text-gray-500 hover:text-ob-navy">Download</button>
          )}
        </div>
      </div>

      {loading && (
        <div className="h-40 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-ob-purple border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="h-20 bg-red-50 rounded-lg border border-red-100 flex items-center justify-center">
          <p className="text-xs text-red-500">Document could not be loaded</p>
        </div>
      )}

      {blobUrl && kind === 'image' && (
        <div className={`bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center overflow-hidden ${zoomed ? 'fixed inset-4 z-[70] bg-black/80 p-4' : 'h-40'}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={blobUrl}
            alt="KYC identity document"
            className={`rounded-lg ${zoomed ? 'max-h-full max-w-full object-contain cursor-zoom-out' : 'max-h-40 object-contain cursor-zoom-in'}`}
            onClick={() => setZoomed(!zoomed)}
          />
          {zoomed && (
            <button onClick={() => setZoomed(false)} className="absolute top-3 right-3 text-white/80 hover:text-white text-2xl leading-none" aria-label="Close">×</button>
          )}
        </div>
      )}

      {blobUrl && kind === 'pdf' && (
        <iframe
          src={blobUrl}
          title="KYC identity document"
          className="w-full h-64 rounded-lg border border-gray-100 bg-gray-50"
        />
      )}
    </div>
  );
}

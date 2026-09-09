/**
 * Shared image utilities for products and post images.
 *
 * WHY THIS EXISTS — the image-shredding bug:
 * Product forms used to join image URLs into a comma-separated string and
 * `split(',')` them back on submit. A data URL contains a comma inside it
 * (`data:image/jpeg;base64,AAAA...`), so every uploaded image was split in
 * half and stored as two broken entries. On top of that, node-postgres
 * serializes a plain JS array for a text[] column as a Postgres array
 * literal `{a,b}` — commas inside elements are NOT escaped, so even a
 * correct data URL would be shredded at the database layer.
 *
 * The fix:
 *  1. All API write paths normalize image input with normalizeImages() and
 *     pass `toPgTextArray(images)` to the DB so every element is written as
 *     a single parameter — commas inside data URLs survive intact.
 *  2. Uploads now go to /api/upload which stores REAL files and returns a
 *     short `/uploads/...` URL (no more multi-megabyte base64 in rows,
 *     which made the shop API response exceed Vercel's serverless limit).
 */

const MAX_IMAGES = 8;
const MAX_IMAGE_URL_LENGTH = 400_000; // ~400KB — legacy base64 URLs allowed up to here; new uploads are short file paths

/** Detect a data URL (may legitimately contain commas inside the payload). */
export function isDataUrl(value) {
  return typeof value === 'string' && /^data:[\w.+-]+\/[\w.+-]+;base64,/.test(value);
}

/** Detect an absolute http(s) URL or a site-relative /uploads/... path. */
export function isHttpOrRelativeUrl(value) {
  if (typeof value !== 'string') return false;
  if (value.startsWith('/')) return true; // site-relative, e.g. /uploads/products/x.jpg
  return /^https?:\/\//i.test(value);
}

/**
 * Normalize any image input (array, comma-joined string, mixed garbage)
 * into a clean array of at most MAX_IMAGES valid URLs.
 * - Splits plain strings on commas ONLY when they are not data URLs
 * - Re-joins data URLs that were previously shredded by the old bug:
 *   ["data:image/jpeg;base64", "/9j/4AA..."] -> ["data:image/jpeg;base64,/9j/4AA..."]
 * - Drops empty entries, trims whitespace, enforces length + count limits
 */
export function normalizeImages(input) {
  const rawItems = [];

  const push = (value) => {
    if (typeof value !== 'string') return;
    const trimmed = value.trim();
    if (!trimmed) return;
    rawItems.push(trimmed);
  };

  if (Array.isArray(input)) {
    for (const item of input) push(item);
  } else if (typeof input === 'string' && input.trim()) {
    // Legacy comma-joined string. Split on commas but never inside a data URL.
    const parts = input.split(',');
    let buffer = '';
    for (const part of parts) {
      const candidate = buffer ? `${buffer},${part}` : part;
      if (isDataUrl(candidate)) {
        // A data URL can contain commas — keep accumulating until the
        // base64 payload looks like it has real length.
        buffer = candidate;
      } else if (buffer && isDataUrlStart(buffer)) {
        // Still inside a data URL payload — keep accumulating.
        buffer = candidate;
      } else {
        if (buffer) { rawItems.push(buffer.trim()); buffer = ''; }
        rawItems.push(part.trim());
      }
    }
    if (buffer) rawItems.push(buffer.trim());
  }

  // Re-join shredded data URLs: "data:<mime>;base64" followed by the payload.
  const healed = [];
  for (let i = 0; i < rawItems.length; i++) {
    const current = rawItems[i];
    if (isDataUrlStart(current) && i + 1 < rawItems.length && !isDataUrl(current)) {
      healed.push(`${current},${rawItems[i + 1]}`);
      i++; // consume the payload fragment
    } else {
      healed.push(current);
    }
  }

  const valid = [];
  const seen = new Set();
  for (const url of healed) {
    const trimmed = url.trim();
    if (!trimmed) continue;
    if (!isDataUrl(trimmed) && !isHttpOrRelativeUrl(trimmed)) continue; // reject garbage
    if (trimmed.length > MAX_IMAGE_URL_LENGTH) continue; // reject oversized (corrupted) entries
    if (seen.has(trimmed)) continue;
    seen.add(trimmed);
    valid.push(trimmed);
    if (valid.length >= MAX_IMAGES) break;
  }
  return valid;
}

/** Matches the mime+encoding prefix of a data URL (without the payload). */
function isDataUrlStart(value) {
  return typeof value === 'string' && /^data:[\w.+-]+\/[\w.+-]+;base64$/.test(value);
}

/**
 * Serialize an array of image URLs into a Postgres text[] literal that is
 * passed to the driver as a SINGLE parameter. node-postgres does not escape
 * commas in plain JS arrays bound to text[] columns, which shredded data
 * URLs. Double-quoted E-strings keep every comma intact.
 * Callers must pass the result as $1 (a parameter), never inline it.
 */
export function toPgTextArray(urls) {
  if (!Array.isArray(urls) || urls.length === 0) return '{}';
  const escaped = urls.map(
    (u) => `"${String(u).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
  );
  return `{${escaped.join(',')}}`;
}

/**
 * Pick the first presentable image for cards/thumbnails.
 * Prefers real file/remote URLs over legacy data URLs (smaller responses,
 * cacheable), falls back to any available image.
 */
export function firstImage(images) {
  if (!Array.isArray(images) || images.length === 0) return null;
  const nonData = images.find((u) => typeof u === 'string' && !u.startsWith('data:'));
  return nonData || images[0] || null;
}

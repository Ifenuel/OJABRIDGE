import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getUserFromRequest, requireAuth } from '@/lib/auth';
import { dbInsert } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/upload — Store a file and return a short, cacheable URL.
 *
 * WHY: uploads used to be returned as base64 data URLs and saved directly
 * into database rows. Multi-megabyte base64 strings in product rows made
 * the shop API response exceed Vercel serverless function response limits
 * (HTTP 500 in production) and bloated every listing query.
 *
 * Storage: file bytes are stored in the `uploads` table (works on Vercel —
 * no filesystem) and served through GET /api/files/<token>.
 *   - Product / retailer / avatar images: is_public = true
 *   - KYC identity documents: is_public = false (default) — only the owner
 *     and admins can view them via /api/secure-document
 *
 * Accepts: multipart/form-data with:
 *   file   — the file (required)
 *   folder — logical folder name: products|sourcing|avatars|kyc|content|misc
 *   public — "true" to make the file publicly readable via its URL
 * Returns: { success: true, url: '/api/files/<token>' }
 */
export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    const auth = requireAuth(user);
    if (!auth.authorized) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    const formData = await request.formData();
    const file = formData.get('file');
    const folderRaw = formData.get('folder') || 'misc';
    const isPublic = String(formData.get('public') || '').toLowerCase() === 'true';

    if (!file || typeof file === 'string') {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    // Validate declared type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ success: false, error: 'Only JPG, PNG, WebP, GIF, and PDF files are allowed' }, { status: 400 });
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'File size must be under 5MB' }, { status: 400 });
    }

    // Content-sniff the real type from magic bytes (a lying extension must not pass)
    const bytes = Buffer.from(await file.arrayBuffer());
    const sniffed = sniffFileType(bytes);
    if (!sniffed) {
      return NextResponse.json({ success: false, error: 'Unrecognized or unsupported file content' }, { status: 400 });
    }

    // Whitelist folder to keep URLs predictable
    const allowedFolders = ['products', 'sourcing', 'avatars', 'kyc', 'content', 'misc'];
    const folder = allowedFolders.includes(String(folderRaw)) ? String(folderRaw) : 'misc';

    // Random unguessable token — URLs cannot be enumerated
    const token = crypto.randomBytes(24).toString('hex');

    const { error } = await dbInsert('uploads', {
      token,
      folder,
      filename: String(file.name || 'file').slice(0, 255),
      mime_type: sniffed.mime,
      size_bytes: file.size,
      data: bytes,
      uploaded_by: user.id,
      is_public: isPublic,
    });

    if (error) {
      console.error('Upload store error:', error);
      return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      url: `/api/files/${token}`,
      filename: file.name,
      size: file.size,
      type: sniffed.mime,
      isPublic,
    }, { status: 200 });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
  }
}

/** Identify a file by magic bytes. Returns { mime, ext } or null. */
function sniffFileType(buf) {
  if (!buf || buf.length < 12) return null;
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { mime: 'image/jpeg', ext: 'jpg' };
  // PNG: 89 50 4E 47
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return { mime: 'image/png', ext: 'png' };
  // GIF: GIF8
  if (buf.toString('ascii', 0, 3) === 'GIF') return { mime: 'image/gif', ext: 'gif' };
  // WebP: RIFF....WEBP
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return { mime: 'image/webp', ext: 'webp' };
  // PDF: %PDF
  if (buf.toString('ascii', 0, 4) === '%PDF') return { mime: 'application/pdf', ext: 'pdf' };
  return null;
}

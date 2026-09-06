import { NextResponse } from 'next/server';
import { getUserFromRequest, requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/upload — Upload image as base64 data URL
 * Works on Vercel (no filesystem needed)
 * 
 * Accepts: multipart/form-data with 'file' field
 * Returns: { success: true, url: 'data:image/...;base64,...' }
 * 
 * For production: replace with Supabase Storage or Cloudinary
 */
export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    const auth = requireAuth(user);
    if (!auth.authorized) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ success: false, error: 'Only JPG, PNG, WebP, GIF, and PDF files are allowed' }, { status: 400 });
    }

    // Validate file size (4MB max — base64 adds ~33% overhead, so keep under ~5.3MB in DB)
    if (file.size > 4 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'File size must be under 4MB' }, { status: 400 });
    }

    // Convert to base64 data URL (works on Vercel — no filesystem needed)
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    return NextResponse.json({
      success: true,
      url: dataUrl,
      filename: file.name,
      size: file.size,
      type: file.type,
    }, { status: 200 });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
  }
}

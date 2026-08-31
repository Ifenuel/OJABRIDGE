import { NextResponse } from 'next/server';
import { getUserFromRequest, requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/upload — Upload a file to Cloudinary
 * Body: FormData with 'file' field and optional 'type' (product, kyc, avatar, banner)
 */
export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    const auth = requireAuth(user);
    if (!auth.authorized) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    const formData = await request.formData();
    const file = formData.get('file');
    const type = formData.get('type') || 'general'; // product, kyc, avatar, banner

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ success: false, error: 'Invalid file type. Allowed: JPG, PNG, WebP, PDF' }, { status: 400 });
    }

    // Validate file size
    const maxSize = type === 'kyc' ? 10 * 1024 * 1024 : 5 * 1024 * 1024; // 10MB for KYC, 5MB for images
    if (file.size > maxSize) {
      return NextResponse.json({ success: false, error: `File too large. Max: ${maxSize / (1024 * 1024)}MB` }, { status: 400 });
    }

    // Dynamic import of upload utility (server-side only)
    const { uploadImage, uploadProductImage, uploadKycDocument, uploadAvatar, uploadStoreBanner } = await import('@/lib/upload');

    let result;
    switch (type) {
      case 'product':
        result = await uploadProductImage(file, user.id);
        break;
      case 'kyc':
        result = await uploadKycDocument(file, user.id);
        break;
      case 'avatar':
        result = await uploadAvatar(file, user.id);
        break;
      case 'banner':
        result = await uploadStoreBanner(file, user.id);
        break;
      default:
        result = await uploadImage(file, 'ojabridge/general');
    }

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
  }
}

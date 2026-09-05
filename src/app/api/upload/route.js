import { NextResponse } from 'next/server';
import { getUserFromRequest, requireAuth } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

/**
 * POST /api/upload — Upload KYC document image
 * Accepts multipart/form-data with file field
 */
export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    const auth = requireAuth(user);
    if (!auth.authorized) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    if (user.role !== 'vendor' && user.role !== 'retailer') {
      return NextResponse.json({ success: false, error: 'Only vendors and retailers can upload KYC documents' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ success: false, error: 'Only JPG, PNG, WebP, and PDF files are allowed' }, { status: 400 });
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'File size must be under 5MB' }, { status: 400 });
    }

    // Create upload directory
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'kyc');
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `${user.id}-kyc-${Date.now()}.${ext}`;
    const filepath = path.join(uploadDir, filename);

    // Write file
    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    const url = `/uploads/kyc/${filename}`;

    return NextResponse.json({ success: true, url, filename }, { status: 200 });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
  }
}

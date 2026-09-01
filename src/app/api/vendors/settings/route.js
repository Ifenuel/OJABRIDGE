import { NextResponse } from 'next/server';
import { dbQuery, dbUpdate, isDatabaseConnected } from '@/lib/db';
import { getUserFromRequest, requireAuth, sanitizeInput } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PATCH(request) {
  try {
    const user = await getUserFromRequest(request);
    const auth = requireAuth(user);
    if (!auth.authorized) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    if (!isDatabaseConnected()) return NextResponse.json({ success: false, error: 'Database not connected' }, { status: 503 });

    const vendorProfile = await dbQuery('vendors', { filter: { user_id: user.id } });
    if (!vendorProfile.data?.[0]) return NextResponse.json({ success: false, error: 'Vendor profile not found' }, { status: 404 });

    const body = await request.json();
    const { store_name, store_description, store_logo_url, store_banner_url, business_phone, business_email, product_categories } = body;

    const updates = {};
    if (store_name !== undefined) updates.store_name = sanitizeInput(store_name);
    if (store_description !== undefined) updates.store_description = sanitizeInput(store_description);
    if (store_logo_url !== undefined) updates.store_logo_url = store_logo_url;
    if (store_banner_url !== undefined) updates.store_banner_url = store_banner_url;
    if (business_phone !== undefined) updates.business_phone = business_phone;
    if (business_email !== undefined) updates.business_email = business_email;
    if (product_categories !== undefined) updates.product_categories = product_categories;

    if (Object.keys(updates).length === 0) return NextResponse.json({ success: false, error: 'No updates provided' }, { status: 400 });

    const { data: updated, error } = await dbUpdate('vendors', { id: vendorProfile.data[0].id }, updates);
    if (error) return NextResponse.json({ success: false, error }, { status: 500 });

    return NextResponse.json({ success: true, vendor: updated });
  } catch (error) {
    console.error('Vendor settings error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

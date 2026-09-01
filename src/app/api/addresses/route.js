import { NextResponse } from 'next/server';
import { dbQuery, dbInsert, dbUpdate, dbDelete, dbRaw, isDatabaseConnected } from '@/lib/db';
import { getUserFromRequest, requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    const auth = requireAuth(user);
    if (!auth.authorized) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    if (!isDatabaseConnected()) return NextResponse.json({ success: true, addresses: [], dbConnected: false });

    const { data, error } = await dbQuery('addresses', { filter: { user_id: user.id }, order: { column: 'is_default', ascending: false } });
    if (error) return NextResponse.json({ success: false, error }, { status: 500 });
    return NextResponse.json({ success: true, addresses: data || [] });
  } catch (e) { return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }); }
}

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    const auth = requireAuth(user);
    if (!auth.authorized) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    if (!isDatabaseConnected()) return NextResponse.json({ success: false, error: 'Database not connected' }, { status: 503 });

    const body = await request.json();
    const { label, full_name, phone, address_line1, address_line2, city, state, postal_code, country, is_default } = body;
    if (!address_line1 || !country) return NextResponse.json({ success: false, errors: ['Address and country are required'] }, { status: 400 });

    if (is_default) {
      await dbRaw('UPDATE addresses SET is_default = false WHERE user_id = $1', [user.id]);
    }

    const { data, error } = await dbInsert('addresses', {
      user_id: user.id, label: label || 'Home', full_name, phone,
      address_line1, address_line2: address_line2 || null,
      city: city || null, state: state || null, postal_code: postal_code || null,
      country, is_default: is_default || false,
    });
    if (error) return NextResponse.json({ success: false, error }, { status: 500 });
    return NextResponse.json({ success: true, address: data }, { status: 201 });
  } catch (e) { return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }); }
}

export async function DELETE(request) {
  try {
    const user = await getUserFromRequest(request);
    const auth = requireAuth(user);
    if (!auth.authorized) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Address ID required' }, { status: 400 });

    const { error } = await dbDelete('addresses', { id, user_id: user.id });
    if (error) return NextResponse.json({ success: false, error }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (e) { return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 }); }
}

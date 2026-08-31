import { NextResponse } from 'next/server';
import { dbQuery, dbInsert, dbDelete, dbRaw, isDatabaseConnected } from '@/lib/db';
import { getUserFromRequest, requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/favorites — Get user's favorite products
 * POST /api/favorites — Add product to favorites
 * DELETE /api/favorites — Remove product from favorites
 */

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    const auth = requireAuth(user);
    if (!auth.authorized) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    if (!isDatabaseConnected()) {
      return NextResponse.json({ success: true, favorites: [], dbConnected: false });
    }

    const { data: favorites, error } = await dbRaw(
      `SELECT f.id, f.product_id, f.created_at, 
              p.name, p.price, p.compare_price, p.images, p.slug, p.category, p.stock_quantity,
              v.store_name
       FROM favorites f
       JOIN products p ON f.product_id = p.id
       JOIN vendors v ON p.vendor_id = v.id
       WHERE f.user_id = $1 AND p.is_active = true
       ORDER BY f.created_at DESC`,
      [user.id]
    );

    if (error) return NextResponse.json({ success: false, error }, { status: 500 });

    return NextResponse.json({ success: true, favorites: favorites || [] });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    const auth = requireAuth(user);
    if (!auth.authorized) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    const body = await request.json();
    const { productId } = body;

    if (!productId) return NextResponse.json({ success: false, error: 'Product ID required' }, { status: 400 });

    if (!isDatabaseConnected()) {
      return NextResponse.json({ success: false, error: 'Database not connected' }, { status: 503 });
    }

    // Check if already favorited
    const existing = await dbQuery('favorites', { filter: { user_id: user.id, product_id: productId } });
    if (existing.data && existing.data.length > 0) {
      return NextResponse.json({ success: true, message: 'Already in favorites' });
    }

    const { data, error } = await dbInsert('favorites', {
      user_id: user.id,
      product_id: productId,
    });

    if (error) return NextResponse.json({ success: false, error }, { status: 500 });

    return NextResponse.json({ success: true, favorite: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const user = await getUserFromRequest(request);
    const auth = requireAuth(user);
    if (!auth.authorized) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) return NextResponse.json({ success: false, error: 'Product ID required' }, { status: 400 });

    if (!isDatabaseConnected()) {
      return NextResponse.json({ success: false, error: 'Database not connected' }, { status: 503 });
    }

    const { error } = await dbDelete('favorites', { user_id: user.id, product_id: productId });

    if (error) return NextResponse.json({ success: false, error }, { status: 500 });

    return NextResponse.json({ success: true, message: 'Removed from favorites' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}


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

    // Ensure favorites table exists
    try {
      await dbRaw(`CREATE TABLE IF NOT EXISTS favorites (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, product_id)
      )`);
    } catch {}

    // First, get just the favorite IDs for this user
    const { data: favRows, error: favErr } = await dbQuery('favorites', {
      filter: { user_id: user.id },
      order: { column: 'created_at', ascending: false },
    });

    if (favErr) return NextResponse.json({ success: false, error: favErr }, { status: 500 });

    if (!favRows || favRows.length === 0) {
      return NextResponse.json({ success: true, favorites: [] });
    }

    // Now get product details for each favorite (tolerant of missing products)
    const productIds = favRows.map(f => f.product_id);
    const placeholders = productIds.map((_, i) => `$${i + 1}`).join(', ');
    const { rows: products } = await dbRaw(
      `SELECT p.id as product_id, p.name, p.price, p.compare_price, p.images, p.slug, p.category, p.stock_quantity,
              v.store_name
       FROM products p
       LEFT JOIN vendors v ON p.vendor_id = v.id
       WHERE p.id IN (${placeholders})`,
      productIds
    );

    // Build product lookup
    const productMap = {};
    for (const p of (products || [])) {
      productMap[p.product_id] = p;
    }

    // Merge favorites with product data
    const favorites = favRows.map(f => ({
      id: f.id,
      product_id: f.product_id,
      created_at: f.created_at,
      ...(productMap[f.product_id] || {}),
    }));

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


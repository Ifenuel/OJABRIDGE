import { NextResponse } from 'next/server';
import { dbQuery, isDatabaseConnected } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/products/[id] — Fetch a single product by ID or slug
 */
export async function GET(request, { params }) {
  try {
    const { id } = params;

    if (!isDatabaseConnected()) {
      return NextResponse.json({ success: false, error: 'Database not connected' }, { status: 503 });
    }

    // Check if input looks like a UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    const filter = isUUID ? { id, is_active: true } : { slug: id, is_active: true };

    const { data: products, error } = await dbQuery('products', { filter });

    if (error) {
      console.error('Product query error:', error);
      return NextResponse.json({ success: false, error: 'Database error: ' + error }, { status: 500 });
    }

    if (!products || products.length === 0) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    const product = products[0];

    // Fetch vendor info
    let vendorName = null;
    let vendorSlug = null;
    let vendorId = null;
    let vendorRating = null;
    if (product.vendor_id) {
      try {
        const { data: vendor } = await dbQuery('vendors', { filter: { id: product.vendor_id } });
        if (vendor && vendor[0]) {
          vendorName = vendor[0].store_name;
          vendorSlug = vendor[0].store_slug;
          vendorId = vendor[0].id;
          vendorRating = vendor[0].average_rating;
        }
      } catch (e) {}
    }

    return NextResponse.json({
      success: true,
      product: {
        ...product,
        store_name: vendorName,
        store_slug: vendorSlug,
        vendor_id: vendorId,
        vendor_rating: vendorRating,
      },
    });
  } catch (error) {
    console.error('Product detail API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

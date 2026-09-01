import { NextResponse } from 'next/server';
import { dbRaw, isDatabaseConnected } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/stats — Public platform statistics for homepage counters
 * Returns: verified vendors, products listed, orders completed, customer satisfaction
 */
export async function GET() {
  if (!isDatabaseConnected()) {
    return NextResponse.json({
      success: true,
      vendors: 0,
      products: 0,
      orders: 0,
      satisfaction: 100,
    });
  }

  try {
    const result = await dbRaw(`
      SELECT
        (SELECT COUNT(*) FROM vendors WHERE kyc_status = 'VERIFIED') as verified_vendors,
        (SELECT COUNT(*) FROM products WHERE moderation_status = 'approved' AND is_active = true) as products_listed,
        (SELECT COUNT(*) FROM orders WHERE status IN ('delivered', 'completed')) as orders_completed
    `);

    const row = result.rows?.[0] || {};
    const vendors = parseInt(row.verified_vendors || 0);
    const products = parseInt(row.products_listed || 0);
    const orders = parseInt(row.orders_completed || 0);

    // Calculate satisfaction from reviews (average rating as percentage)
    const ratingResult = await dbRaw(`SELECT AVG(rating) as avg_rating FROM reviews`);
    const avgRating = parseFloat(ratingResult.rows?.[0]?.avg_rating || 5);
    const satisfaction = Math.round((avgRating / 5) * 100);

    return NextResponse.json({
      success: true,
      vendors,
      products,
      orders,
      satisfaction: satisfaction || 100,
    });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json({
      success: true,
      vendors: 0,
      products: 0,
      orders: 0,
      satisfaction: 100,
    });
  }
}

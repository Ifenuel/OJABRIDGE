import { NextResponse } from 'next/server';
import { dbRaw, isDatabaseConnected } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/search?q=term&category=&sort=&page=1&limit=20
 * Full-text product search with filters
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category');
    const minPrice = parseFloat(searchParams.get('minPrice'));
    const maxPrice = parseFloat(searchParams.get('maxPrice'));
    const sort = searchParams.get('sort') || 'relevance';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset = (page - 1) * limit;

    if (!isDatabaseConnected()) {
      return NextResponse.json({
        success: true, results: [], total: 0, page, pages: 0, dbConnected: false,
      });
    }

    // Build query
    let conditions = ['p.is_active = true', "p.moderation_status = 'approved'"];
    const params = [];
    let paramIndex = 1;

    // Search term
    if (query.trim()) {
      conditions.push(`(p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex} OR p.category ILIKE $${paramIndex})`);
      params.push(`%${query.trim()}%`);
      paramIndex++;
    }

    // Category filter
    if (category) {
      conditions.push(`p.category = $${paramIndex}`);
      params.push(category);
      paramIndex++;
    }

    // Price range
    if (!isNaN(minPrice)) {
      conditions.push(`p.price >= $${paramIndex}`);
      params.push(minPrice);
      paramIndex++;
    }
    if (!isNaN(maxPrice)) {
      conditions.push(`p.price <= $${paramIndex}`);
      params.push(maxPrice);
      paramIndex++;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // Sorting
    const sortMap = {
      'price-low': 'p.price ASC',
      'price-high': 'p.price DESC',
      'rating': 'p.average_rating DESC',
      'popular': 'p.total_sold DESC',
      'newest': 'p.created_at DESC',
      'relevance': query.trim() ? `CASE WHEN p.name ILIKE $1 THEN 0 ELSE 1 END, p.total_sold DESC` : 'p.created_at DESC',
    };
    const orderBy = sortMap[sort] || 'p.created_at DESC';

    // Count total
    const countResult = await dbRaw(
      `SELECT COUNT(*) as total FROM products p ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows?.[0]?.total || 0);

    // Fetch results with vendor info
    const { rows: results, error } = await dbRaw(
      `SELECT 
        p.id, p.name, p.slug, p.description, p.short_description, p.price, p.compare_price,
        p.currency, p.stock_quantity, p.images, p.category, p.average_rating, p.total_reviews,
        p.total_sold, p.is_featured, p.created_at,
        v.store_name, v.store_slug, v.average_rating as vendor_rating
      FROM products p
      LEFT JOIN vendors v ON p.vendor_id = v.id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    if (error) {
      console.error('Search error:', error);
      return NextResponse.json({ success: false, error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      results: results || [],
      data: results || [],
      total,
      page,
      pages: Math.ceil(total / limit),
      query,
      dbConnected: true,
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

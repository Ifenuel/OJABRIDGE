import { NextResponse } from 'next/server';
import { dbQuery, dbInsert, dbRaw, isDatabaseConnected } from '@/lib/db';
import { getUserFromRequest, requireRole, sanitizeInput } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/products — Public product listing with filters
 * POST /api/products — Create a product (vendor only)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const minPrice = parseFloat(searchParams.get('minPrice'));
    const maxPrice = parseFloat(searchParams.get('maxPrice'));
    const vendor = searchParams.get('vendor');
    const featured = searchParams.get('featured');
    const sort = searchParams.get('sort') || 'newest';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset = (page - 1) * limit;

    if (!isDatabaseConnected()) {
      return NextResponse.json({
        success: true, products: [], pagination: { page, limit, total: 0, pages: 0 }, dbConnected: false,
      });
    }

    // Build SQL query
    let conditions = ['p.is_active = true'];
    const params = [];
    let paramIndex = 1;

    if (category) {
      conditions.push(`p.category = $${paramIndex}`);
      params.push(category);
      paramIndex++;
    }
    if (vendor) {
      conditions.push(`p.vendor_id = $${paramIndex}`);
      params.push(vendor);
      paramIndex++;
    }
    if (featured === 'true') {
      conditions.push(`p.is_featured = true`);
    }
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
    if (search && search.trim()) {
      conditions.push(`p.name ILIKE $${paramIndex}`);
      params.push(`%${sanitizeInput(search)}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sortMap = {
      'newest': 'p.created_at DESC',
      'price-low': 'p.price ASC',
      'price-high': 'p.price DESC',
      'rating': 'p.average_rating DESC',
      'popular': 'p.total_sold DESC',
    };
    const orderBy = sortMap[sort] || 'p.created_at DESC';

    // Count total
    const countResult = await dbRaw(
      `SELECT COUNT(*) as total FROM products p ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows?.[0]?.total || 0);

    // Fetch products with vendor info
    const { rows: products, error } = await dbRaw(
      `SELECT 
        p.id, p.name, p.slug, p.description, p.short_description, p.price, p.compare_price, 
        p.currency, p.stock_quantity, p.images, p.tags, p.category, p.moderation_status,
        p.average_rating, p.total_reviews, p.total_sold, p.is_featured, p.created_at,
        v.store_name, v.store_slug, v.average_rating as vendor_rating
      FROM products p
      LEFT JOIN vendors v ON p.vendor_id = v.id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    if (error) {
      console.error('Products query error:', error);
      return NextResponse.json({ success: false, error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      products: products || [],
      data: products || [],
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      dbConnected: true,
    });
  } catch (error) {
    console.error('Products API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    const auth = requireRole(user, 'vendor');
    if (!auth.authorized) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    if (!isDatabaseConnected()) {
      return NextResponse.json({ success: false, error: 'Database not connected' }, { status: 503 });
    }

    const body = await request.json();
    const { name, description, shortDescription, price, comparePrice, category, stock, images, tags, sku, weight } = body;

    // Validation
    const errors = [];
    if (!name || name.trim().length < 3) errors.push('Product name must be at least 3 characters');
    if (!price || price <= 0) errors.push('Price must be greater than 0');
    if (stock !== undefined && stock < 0) errors.push('Stock cannot be negative');
    if (errors.length > 0) return NextResponse.json({ success: false, errors }, { status: 400 });

    // Get vendor profile
    const vendorResult = await dbQuery('vendors', { filter: { user_id: user.id } });
    if (!vendorResult.data?.[0]) return NextResponse.json({ success: false, error: 'Vendor profile not found' }, { status: 404 });

    const slug = sanitizeInput(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const product = await dbInsert('products', {
      vendor_id: vendorResult.data[0].id,
      name: sanitizeInput(name),
      slug: `${slug}-${Date.now().toString(36)}`,
      description: description || null,
      short_description: shortDescription || null,
      price,
      compare_price: comparePrice || null,
      stock_quantity: stock || 0,
      images: images || [],
      tags: tags || [],
      category: category || null,
      sku: sku || null,
      weight: weight || null,
      moderation_status: 'pending',
    });

    if (product.error) return NextResponse.json({ success: false, error: product.error }, { status: 500 });

    return NextResponse.json({ success: true, product: product.data, message: 'Product submitted for review' }, { status: 201 });
  } catch (error) {
    console.error('Product creation error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

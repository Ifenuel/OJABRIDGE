import { NextResponse } from 'next/server';
import { dbQuery, dbInsert, dbUpdate, dbRaw, isDatabaseConnected } from '@/lib/db';
import { getUserFromRequest, requireRole, sanitizeInput } from '@/lib/auth';
import { normalizeImages, toPgTextArray } from '@/lib/image-utils';

export const dynamic = 'force-dynamic';

/**
 * GET /api/products — Public product listing with filters
 * Supports ?admin=true for admin override (shows all moderation statuses)
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
    // High cap (not unlimited) protects the DB at millions of rows;
    // clients page through everything via the returned pagination metadata.
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 500);
    const offset = (page - 1) * limit;
    const isAdmin = searchParams.get('admin') === 'true';
    const moderationStatus = searchParams.get('moderation_status');

    if (!isDatabaseConnected()) {
      return NextResponse.json({
        success: true, products: [], pagination: { page, limit, total: 0, pages: 0 }, dbConnected: false,
      });
    }

    // Build SQL query
    // Public: only show approved active products
    // Admin: show all products (or filter by moderation_status if provided)
    let conditions = ['p.is_active = true'];
    if (!isAdmin) {
      conditions.push("p.moderation_status = 'approved'");
    } else if (moderationStatus) {
      conditions.push(`p.moderation_status = '${moderationStatus}'`);
    }
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
        p.vendor_id,
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

    // Keep listing responses small — cards only render the first image.
    // (Full-size legacy base64 rows previously blew past Vercel serverless
    // response limits and 500'd the shop page.)
    const trimmed = (products || []).map((p) => ({
      ...p,
      images: Array.isArray(p.images) && p.images.length > 0 ? [p.images[0]] : [],
      total_images: Array.isArray(p.images) ? p.images.length : 0,
    }));

    return NextResponse.json({
      success: true,
      products: trimmed,
      data: trimmed,
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
    const auth = requireRole(user, 'vendor', 'retailer');
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

    // Get vendor profile and enforce KYC
    const vendorResult = await dbQuery('vendors', { filter: { user_id: user.id } });
    if (!vendorResult.data?.[0]) return NextResponse.json({ success: false, error: 'Vendor profile not found' }, { status: 404 });

    const vendor = vendorResult.data[0];
    const kycStatus = vendor.kyc_status || 'not_started';
    if (kycStatus !== 'VERIFIED' && kycStatus !== 'verified') {
      return NextResponse.json({
        success: false,
        error: 'KYC verification required. Please complete your identity verification before listing products.',
        kycRequired: true,
        kycStatus: kycStatus,
      }, { status: 403 });
    }

    const cleanImages = normalizeImages(images); // validates, heals legacy shredded data URLs, enforces limits

    const slug = sanitizeInput(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // NOTE: images must be bound as a text[] literal string (single param),
    // NOT a plain JS array — node-postgres does not escape commas in JS
    // arrays for text[] columns, which shredded data URLs at every comma.
    const product = await dbInsert('products', {
      vendor_id: vendorResult.data[0].id,
      name: sanitizeInput(name),
      slug: `${slug}-${Date.now().toString(36)}`,
      description: description || null,
      short_description: shortDescription || null,
      price,
      compare_price: comparePrice || null,
      stock_quantity: stock || 0,
      images: toPgTextArray(cleanImages),
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

/**
 * PATCH /api/products — Moderate a product (admin only)
 * Body: { productId, moderation_status, moderation_notes }
 */
export async function PATCH(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });

    if (!isDatabaseConnected()) {
      return NextResponse.json({ success: false, error: 'Database not connected' }, { status: 503 });
    }

    const body = await request.json();
    const { productId, name, description, shortDescription, price, comparePrice, category, stock, images, tags, sku, weight, moderation_status, moderation_notes, is_active } = body;

    if (!productId) return NextResponse.json({ success: false, error: 'Product ID required' }, { status: 400 });

    // Load product to check ownership
    const { data: products } = await dbQuery('products', { filter: { id: productId }, limit: 1 });
    const product = products?.[0];
    if (!product) return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });

    // Admin: can moderate (status, notes, is_active)
    if (user.role === 'admin') {
      if (moderation_status && !['pending', 'approved', 'rejected', 'suspended'].includes(moderation_status)) {
        return NextResponse.json({ success: false, error: 'Invalid moderation_status' }, { status: 400 });
      }
      const updates = {};
      if (moderation_status) updates.moderation_status = moderation_status;
      if (moderation_notes !== undefined) updates.moderation_notes = moderation_notes;
      if (is_active !== undefined) updates.is_active = is_active;
      const { data: updated, error } = await dbUpdate('products', { id: productId }, updates);
      if (error) return NextResponse.json({ success: false, error }, { status: 500 });
      await dbInsert('audit_logs', { user_id: user.id, action: 'product.moderation', entity_type: 'product', entity_id: productId, new_data: { moderation_status, moderation_notes, is_active }, created_at: new Date().toISOString() }).catch(() => {});
      return NextResponse.json({ success: true, product: updated });
    }

    // Vendor/retailer: can only edit their own products
    if (user.role === 'vendor' || user.role === 'retailer') {
      const { data: vendorProfile } = await dbQuery('vendors', { filter: { user_id: user.id }, limit: 1 });
      if (!vendorProfile?.[0] || product.vendor_id !== vendorProfile[0].id) {
        return NextResponse.json({ success: false, error: 'You can only edit your own products' }, { status: 403 });
      }

      const updates = {};
      if (name !== undefined) updates.name = sanitizeInput(name);
      if (description !== undefined) updates.description = description;
      if (shortDescription !== undefined) updates.short_description = shortDescription;
      if (price !== undefined) updates.price = parseFloat(price);
      if (comparePrice !== undefined) updates.compare_price = comparePrice ? parseFloat(comparePrice) : null;
      if (category !== undefined) updates.category = category;
      if (stock !== undefined) updates.stock_quantity = parseInt(stock) || 0;
      if (sku !== undefined) updates.sku = sku;
      if (weight !== undefined) updates.weight = weight ? parseFloat(weight) : null;
      if (images !== undefined) {
        const cleanImages = normalizeImages(images);
        updates.images = toPgTextArray(cleanImages);
      }
      if (tags !== undefined) updates.tags = tags;

      const { data: updated, error } = await dbUpdate('products', { id: productId }, updates);
      if (error) return NextResponse.json({ success: false, error }, { status: 500 });
      return NextResponse.json({ success: true, product: updated });
    }

    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
  } catch (error) {
    console.error('Product PATCH error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });

    if (!isDatabaseConnected()) {
      return NextResponse.json({ success: false, error: 'Database not connected' }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('id');
    if (!productId) return NextResponse.json({ success: false, error: 'Product ID required' }, { status: 400 });

    // Load product
    const { data: products } = await dbQuery('products', { filter: { id: productId }, limit: 1 });
    const product = products?.[0];
    if (!product) return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });

    // Admin can delete any product
    if (user.role === 'admin') {
      const { error } = await dbDelete('products', { id: productId });
      if (error) return NextResponse.json({ success: false, error }, { status: 500 });
      return NextResponse.json({ success: true, message: 'Product deleted' });
    }

    // Vendor/retailer: only delete own products
    if (user.role === 'vendor' || user.role === 'retailer') {
      const { data: vendorProfile } = await dbQuery('vendors', { filter: { user_id: user.id }, limit: 1 });
      if (!vendorProfile?.[0] || product.vendor_id !== vendorProfile[0].id) {
        return NextResponse.json({ success: false, error: 'You can only delete your own products' }, { status: 403 });
      }
      const { error } = await dbDelete('products', { id: productId });
      if (error) return NextResponse.json({ success: false, error }, { status: 500 });
      return NextResponse.json({ success: true, message: 'Product deleted' });
    }

    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
  } catch (error) {
    console.error('Product DELETE error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

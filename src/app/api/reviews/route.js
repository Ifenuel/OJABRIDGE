import { NextResponse } from 'next/server';
import { dbQuery, dbInsert, dbUpdate, isDatabaseConnected } from '@/lib/db';
import { getUserFromRequest, requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/reviews — List reviews for a product or vendor
 * POST /api/reviews — Create a review (authenticated)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const vendorId = searchParams.get('vendorId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sort = searchParams.get('sort') || 'newest';

    if (!isDatabaseConnected()) {
      return NextResponse.json({ success: true, reviews: [], total: 0, dbConnected: false });
    }

    const filter = { is_public: true };
    if (productId) filter.product_id = productId;
    if (vendorId) filter.vendor_id = vendorId;

    const orderMap = {
      newest: { column: 'created_at', ascending: false },
      oldest: { column: 'created_at', ascending: true },
      highest: { column: 'rating', ascending: false },
      lowest: { column: 'rating', ascending: true },
    };

    const { data: reviews, error } = await dbQuery('reviews', {
      filter,
      order: orderMap[sort] || orderMap.newest,
      limit,
      offset: (page - 1) * limit,
    });

    if (error) {
      return NextResponse.json({ success: false, error }, { status: 500 });
    }

    return NextResponse.json({ success: true, reviews: reviews || [], total: reviews?.length || 0 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    const authCheck = requireAuth(user);
    if (!authCheck.authorized) {
      return NextResponse.json({ success: false, error: authCheck.error }, { status: authCheck.status });
    }

    const body = await request.json();
    const { orderId, productId, rating, title, comment } = body;

    // Validation
    const errors = [];
    if (!orderId) errors.push('Order ID is required');
    if (!productId) errors.push('Product ID is required');
    if (!rating || rating < 1 || rating > 5) errors.push('Rating must be 1-5');
    if (title && title.length > 255) errors.push('Title must be under 255 characters');
    if (errors.length > 0) {
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    if (!isDatabaseConnected()) {
      return NextResponse.json({ success: false, error: 'Database not connected' }, { status: 503 });
    }

    // Check if already reviewed this product for this order
    const existing = await dbQuery('reviews', {
      filter: { order_id: orderId, product_id: productId, user_id: user.id },
    });

    if (existing.data && existing.data.length > 0) {
      return NextResponse.json({ success: false, error: 'You have already reviewed this product' }, { status: 409 });
    }

    // Get product to find vendor_id
    const product = await dbQuery('products', { filter: { id: productId } });
    if (!product.data || product.data.length === 0) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    const vendorId = product.data[0].vendor_id;

    // Create review
    const { data: review, error } = await dbInsert('reviews', {
      order_id: orderId,
      product_id: productId,
      vendor_id: vendorId,
      user_id: user.id,
      rating,
      title: title || null,
      comment: comment || null,
      is_public: true,
    });

    if (error) {
      return NextResponse.json({ success: false, error }, { status: 500 });
    }

    // Update product average rating
    const allReviews = await dbQuery('reviews', { filter: { product_id: productId, is_public: true } });
    if (allReviews.data) {
      const avgRating = allReviews.data.reduce((sum, r) => sum + r.rating, 0) / allReviews.data.length;
      await dbUpdate('products', { id: productId }, {
        average_rating: Math.round(avgRating * 100) / 100,
        total_reviews: allReviews.data.length,
      });
    }

    // Update vendor average rating
    const vendorReviews = await dbQuery('reviews', { filter: { vendor_id: vendorId, is_public: true } });
    if (vendorReviews.data) {
      const avgRating = vendorReviews.data.reduce((sum, r) => sum + r.rating, 0) / vendorReviews.data.length;
      await dbUpdate('vendors', { id: vendorId }, {
        average_rating: Math.round(avgRating * 100) / 100,
        total_reviews: vendorReviews.data.length,
      });
    }

    return NextResponse.json({ success: true, review }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const user = await getUserFromRequest(request);
    const authCheck = requireAuth(user);
    if (!authCheck.authorized) return NextResponse.json({ success: false, error: authCheck.error }, { status: authCheck.status });
    if (!isDatabaseConnected()) return NextResponse.json({ success: false, error: 'Database not connected' }, { status: 503 });

    const body = await request.json();
    const { reviewId, vendor_reply } = body;
    if (!reviewId || !vendor_reply) return NextResponse.json({ success: false, error: 'reviewId and vendor_reply required' }, { status: 400 });

    const vendorProfile = await dbQuery('vendors', { filter: { user_id: user.id } });
    const vendorId = vendorProfile.data?.[0]?.id;
    if (!vendorId) return NextResponse.json({ success: false, error: 'Vendor profile not found' }, { status: 404 });

    const reviews = await dbQuery('reviews', { filter: { id: reviewId } });
    const review = reviews.data?.[0];
    if (!review) return NextResponse.json({ success: false, error: 'Review not found' }, { status: 404 });
    if (review.vendor_id !== vendorId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });

    const { data: updated, error } = await dbUpdate('reviews', { id: reviewId }, { vendor_reply, vendor_replied_at: new Date().toISOString() });
    if (error) return NextResponse.json({ success: false, error }, { status: 500 });
    return NextResponse.json({ success: true, review: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

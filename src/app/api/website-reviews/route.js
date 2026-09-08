import { NextResponse } from 'next/server';
import { dbQuery, dbInsert, dbRaw, isDatabaseConnected } from '@/lib/db';
import { getUserFromRequest, requireAuth, sanitizeInput } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/website-reviews — Public: approved reviews. Admin: all reviews.
 * POST /api/website-reviews — Authenticated user submits a review.
 * PATCH /api/website-reviews — Admin approves/rejects/deletes reviews.
 */

// Ensure table exists
async function ensureTable() {
  await dbRaw(`CREATE TABLE IF NOT EXISTS website_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    user_name VARCHAR(255),
    user_email VARCHAR(255),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    comment TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    admin_reply TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`);
}

export async function GET(request) {
  try {
    await ensureTable();
    const { searchParams } = new URL(request.url);
    const isAdmin = searchParams.get('admin') === 'true';

    let filter = {};
    if (!isAdmin) filter = { status: 'approved' };

    const { data: reviews, error } = await dbQuery('website_reviews', {
      filter,
      order: { column: 'created_at', ascending: false },
      limit: 50,
    });

    if (error) throw error;

    // Calculate average rating
    const approved = (reviews || []).filter(r => r.status === 'approved');
    const avgRating = approved.length > 0
      ? (approved.reduce((sum, r) => sum + r.rating, 0) / approved.length).toFixed(1)
      : '0.0';

    return NextResponse.json({ success: true, reviews: reviews || [], averageRating: avgRating, total: approved.length });
  } catch (error) {
    console.error('Website reviews GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to load reviews' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await ensureTable();
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ success: false, error: 'Please log in to leave a review' }, { status: 401 });

    const { rating, title, comment } = await request.json();
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ success: false, error: 'Rating must be 1-5' }, { status: 400 });
    }

    // Check if user already left a review
    const { data: existing } = await dbQuery('website_reviews', { filter: { user_id: user.id }, limit: 1 });
    if (existing?.length > 0) {
      return NextResponse.json({ success: false, error: 'You have already submitted a review' }, { status: 409 });
    }

    const { data: review, error } = await dbInsert('website_reviews', {
      user_id: user.id,
      user_name: user.name || 'Anonymous',
      user_email: user.email,
      rating: parseInt(rating),
      title: title ? sanitizeInput(title) : null,
      comment: comment ? sanitizeInput(comment) : null,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;

    return NextResponse.json({ success: true, review, message: 'Review submitted! It will appear after admin approval.' }, { status: 201 });
  } catch (error) {
    console.error('Website reviews POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to submit review' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    await ensureTable();
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const { reviewId, status, admin_reply } = await request.json();
    if (!reviewId) return NextResponse.json({ success: false, error: 'Review ID required' }, { status: 400 });

    const updates = { updated_at: new Date().toISOString() };
    if (status) updates.status = status;
    if (admin_reply !== undefined) updates.admin_reply = admin_reply;

    await dbRaw(
      `UPDATE website_reviews SET ${Object.keys(updates).map((k, i) => `${k} = $${i + 1}`).join(', ')} WHERE id = $${Object.keys(updates).length + 1}`,
      [...Object.values(updates), reviewId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Website reviews PATCH error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update review' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('id');
    if (!reviewId) return NextResponse.json({ success: false, error: 'Review ID required' }, { status: 400 });

    await dbRaw('DELETE FROM website_reviews WHERE id = $1', [reviewId]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete review' }, { status: 500 });
  }
}

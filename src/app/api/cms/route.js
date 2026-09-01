import { NextResponse } from 'next/server';
import { dbQuery, dbInsert, dbUpdate, dbRaw, isDatabaseConnected } from '@/lib/db';
import { getUserFromRequest, requireRole, sanitizeInput } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cms?type=blog|career|press|announcement — List content
 * POST /api/cms — Create content (admin only)
 * PATCH /api/cms — Update content (admin only)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'blog';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    // Note: Schema has press_posts (career-like cols) and career_posts (press-like cols)
    const tableMap = {
      blog: 'blog_posts',
      career: 'press_posts',       // press_posts table has department, location, employment_type
      press: 'career_posts',       // career_posts table has summary, featured_image, content
      announcement: 'announcements',
    };

    const table = tableMap[type];
    if (!table) return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 });

    if (!isDatabaseConnected()) {
      return NextResponse.json({ success: true, items: [], dbConnected: false });
    }

    // Admin can see all items, public sees only published
    const showAll = searchParams.get('all') === 'true';
    const queryFilter = showAll ? {} : { status: 'published' };

    const { data: items, error } = await dbQuery(table, {
      filter: queryFilter,
      order: { column: 'created_at', ascending: false },
      limit,
    });

    if (error) return NextResponse.json({ success: false, error }, { status: 500 });
    return NextResponse.json({ success: true, items: items || [] });
  } catch (error) {
    console.error('CMS GET error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    const auth = requireRole(user, 'admin');
    if (!auth.authorized) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    if (!isDatabaseConnected()) return NextResponse.json({ success: false, error: 'Database not connected' }, { status: 503 });

    const body = await request.json();
    const { type, title, slug, content, excerpt, category, department, location, employment_type, status, summary, audience, priority, featured_image, video_url, youtube_url, images } = body;

    const tableMap = {
      blog: 'blog_posts',
      career: 'press_posts',       // press_posts has department, location, employment_type
      press: 'career_posts',       // career_posts has summary, featured_image, content
      announcement: 'announcements',
    };
    const table = tableMap[type];
    if (!table) return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 });

    const generatedSlug = slug || sanitizeInput(title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    let data;
    if (type === 'blog' || type === 'press') {
      data = {
        title: sanitizeInput(title),
        slug: `${generatedSlug}-${Date.now().toString(36)}`,
        content: content || null,
        excerpt: excerpt || summary || null,
        featured_image: featured_image || null,
        images: images || [],
        video_url: video_url || null,
        youtube_url: youtube_url || null,
        author: user.name || 'Admin',
        category: category || null,
        status: status || 'draft',
        published_at: status === 'published' ? new Date().toISOString() : null,
        created_by: user.id,
      };
    } else if (type === 'career') {
      data = {
        title: sanitizeInput(title),
        department: department || null,
        location: location || null,
        employment_type: employment_type || null,
        description: content || null,
        featured_image: featured_image || null,
        video_url: video_url || null,
        youtube_url: youtube_url || null,
        status: status || 'draft',
        published_at: status === 'published' ? new Date().toISOString() : null,
        created_by: user.id,
      };
    } else if (type === 'announcement') {
      data = {
        title: sanitizeInput(title),
        content: content || null,
        audience: audience || 'all',
        priority: priority || 'normal',
        status: status || 'draft',
        published_at: status === 'published' ? new Date().toISOString() : null,
        created_by: user.id,
      };
    }

    const { data: created, error } = await dbInsert(table, data);
    if (error) return NextResponse.json({ success: false, error }, { status: 500 });

    return NextResponse.json({ success: true, item: created }, { status: 201 });
  } catch (error) {
    console.error('CMS POST error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const user = await getUserFromRequest(request);
    const auth = requireRole(user, 'admin');
    if (!auth.authorized) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    if (!isDatabaseConnected()) return NextResponse.json({ success: false, error: 'Database not connected' }, { status: 503 });

    const body = await request.json();
    const { type, id, status, title, content, featured_image, video_url, youtube_url, images, excerpt, category } = body;

    const tableMap = {
      blog: 'blog_posts',
      career: 'press_posts',       // press_posts has department, location, employment_type
      press: 'career_posts',       // career_posts has summary, featured_image, content
      announcement: 'announcements',
    };
    const table = tableMap[type];
    if (!table) return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 });

    const updates = {};
    if (status) {
      updates.status = status;
      if (status === 'published') updates.published_at = new Date().toISOString();
    }
    if (title) updates.title = sanitizeInput(title);
    if (content) updates.content = content;
    if (featured_image !== undefined) updates.featured_image = featured_image;
    if (images !== undefined) updates.images = images;
    if (video_url !== undefined) updates.video_url = video_url;
    if (youtube_url !== undefined) updates.youtube_url = youtube_url;
    if (excerpt !== undefined) updates.excerpt = excerpt;
    if (category !== undefined) updates.category = category;

    const { data: updated, error } = await dbUpdate(table, { id }, updates);
    if (error) return NextResponse.json({ success: false, error }, { status: 500 });

    return NextResponse.json({ success: true, item: updated });
  } catch (error) {
    console.error('CMS PATCH error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const user = await getUserFromRequest(request);
    const auth = requireRole(user, 'admin');
    if (!auth.authorized) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });

    if (!isDatabaseConnected()) return NextResponse.json({ success: false, error: 'Database not connected' }, { status: 503 });

    const body = await request.json();
    const { type, id } = body;

    const tableMap = {
      blog: 'blog_posts',
      career: 'press_posts',       // press_posts has department, location, employment_type
      press: 'career_posts',       // career_posts has summary, featured_image, content
      announcement: 'announcements',
    };
    const table = tableMap[type];
    if (!table) return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 });
    if (!id) return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });

    const { error } = await dbRaw(`DELETE FROM ${table} WHERE id = $1`, [id]);
    if (error) return NextResponse.json({ success: false, error }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('CMS DELETE error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

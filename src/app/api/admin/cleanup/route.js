import { NextResponse } from 'next/server';
import { dbRaw, isDatabaseConnected } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

const REAL_EMAILS = [
  'admin@ojabridge.dev',
  'awoyoemmanuel12@gmail.com',
  'treed8200@gmail.com',
  'oladejiayobamiadeola@gmail.com',
];

const FAKE_PATTERNS = ['@example.com', 'finaltest', 'audit-', 'flowtest', 'test@', 'demo@', 'sample@'];

function isFakeUser(u) {
  const email = (u.email || '').toLowerCase();
  if (REAL_EMAILS.includes(email)) return false;
  for (const pattern of FAKE_PATTERNS) {
    if (email.includes(pattern)) return true;
  }
  if (email.endsWith('.dev') && email !== 'admin@ojabridge.dev') return true;
  if (/^(test|demo|sample|audit|flow|final)/i.test(u.name || '')) return true;
  return false;
}

// POST — Actually delete all fake data
export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Super admin access required' }, { status: 403 });
    }

    if (!isDatabaseConnected()) {
      return NextResponse.json({ success: false, error: 'Database not connected' }, { status: 503 });
    }

    const { rows: allUsers, error: userErr } = await dbRaw('SELECT id, email, name, role FROM users ORDER BY created_at');
    if (userErr) return NextResponse.json({ success: false, error: `Query failed: ${userErr}` }, { status: 500 });

    const fakeUsers = (allUsers || []).filter(isFakeUser);

    if (fakeUsers.length === 0) {
      return NextResponse.json({ success: true, message: 'No fake data found. Database is already clean.', deletedCount: 0, deletedUsers: [], remainingUsers: (allUsers || []).map(u => `${u.name} (${u.email}) [${u.role}]`) });
    }

    let totalDeleted = 0;
    const deletedUsers = [];

    for (const fu of fakeUsers) {
      const uid = fu.id;
      const safeExec = async (sql, params) => {
        const { rowCount, error } = await dbRaw(sql, params);
        if (error) return 0;
        return rowCount || 0;
      };

      // 1. Orders + all children (FK-safe order)
      const { rows: ordIds } = await dbRaw('SELECT id FROM orders WHERE user_id = $1', [uid]);
      for (const oid of (ordIds || [])) {
        for (const t of ['order_items', 'transactions', 'settlements', 'commissions', 'vendor_wallets', 'reviews', 'disputes', 'payments']) {
          await safeExec(`DELETE FROM ${t} WHERE order_id = $1`, [oid.id]);
        }
      }
      totalDeleted += await safeExec('DELETE FROM orders WHERE user_id = $1', [uid]);

      // 2. Tables with user_id column
      for (const t of ['audit_logs', 'transactions', 'reviews', 'favorites', 'notifications', 'website_reviews', 'sub_admins', 'addresses', 'wishlists', 'payment_methods', 'kyc_submissions']) {
        totalDeleted += await safeExec(`DELETE FROM ${t} WHERE user_id = $1`, [uid]);
      }

      // 3. Nullable FK references — set NULL before user delete
      await safeExec('UPDATE disputes SET raised_by = NULL WHERE raised_by = $1', [uid]);
      await safeExec('UPDATE disputes SET resolved_by = NULL WHERE resolved_by = $1', [uid]);
      for (const t of ['blog_posts', 'press_posts', 'career_posts', 'announcements']) {
        await safeExec(`UPDATE ${t} SET created_by = NULL WHERE created_by = $1`, [uid]);
      }
      await safeExec('UPDATE newsletter_campaigns SET sent_by = NULL WHERE sent_by = $1', [uid]);

      // 4. Vendor-side data
      totalDeleted += await safeExec('DELETE FROM order_items WHERE vendor_id IN (SELECT id FROM vendors WHERE user_id = $1)', [uid]);
      totalDeleted += await safeExec('DELETE FROM settlements WHERE vendor_id IN (SELECT id FROM vendors WHERE user_id = $1)', [uid]);
      totalDeleted += await safeExec('DELETE FROM commissions WHERE vendor_id IN (SELECT id FROM vendors WHERE user_id = $1)', [uid]);
      totalDeleted += await safeExec('DELETE FROM vendor_wallets WHERE vendor_id IN (SELECT id FROM vendors WHERE user_id = $1)', [uid]);
      totalDeleted += await safeExec('DELETE FROM products WHERE vendor_id IN (SELECT id FROM vendors WHERE user_id = $1)', [uid]);
      totalDeleted += await safeExec('DELETE FROM vendors WHERE user_id = $1', [uid]);

      // 5. Chat history
      const { rows: convs } = await dbRaw('SELECT id FROM chat_conversations WHERE user_id = $1', [uid]);
      for (const c of (convs || [])) {
        await safeExec('DELETE FROM chat_messages WHERE conversation_id = $1', [c.id]);
      }
      totalDeleted += await safeExec('DELETE FROM chat_conversations WHERE user_id = $1', [uid]);

      // 6. Delete the user
      totalDeleted += await safeExec('DELETE FROM users WHERE id = $1', [uid]);
      deletedUsers.push(`${fu.name} (${fu.email})`);
    }

    // 7. Clean orphans
    await safeExec('DELETE FROM payments WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM users)');
    await safeExec('DELETE FROM orders WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM users)');

    const { rows: remaining } = await dbRaw('SELECT email, name, role FROM users ORDER BY created_at');

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${fakeUsers.length} fake users and ${totalDeleted} total records`,
      deletedCount: fakeUsers.length,
      totalRecordsDeleted: totalDeleted,
      deletedUsers,
      remainingUsers: (remaining || []).map(u => `${u.name} (${u.email}) [${u.role}]`),
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json({ success: false, error: `Cleanup failed: ${error.message}` }, { status: 500 });
  }
}

// GET — Preview what would be deleted
export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Super admin access required' }, { status: 403 });
    }

    if (!isDatabaseConnected()) {
      return NextResponse.json({ success: false, error: 'Database not connected' }, { status: 503 });
    }

    const { rows: allUsers } = await dbRaw('SELECT id, email, name, role FROM users ORDER BY created_at');

    const fakeUsers = (allUsers || []).filter(isFakeUser);
    const realUsers = (allUsers || []).filter(u => !isFakeUser(u));

    return NextResponse.json({
      success: true,
      fakeCount: fakeUsers.length,
      realCount: realUsers.length,
      fakeUsers: fakeUsers.map(u => ({ email: u.email, name: u.name, role: u.role })),
      realUsers: realUsers.map(u => ({ email: u.email, name: u.name, role: u.role })),
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to preview' }, { status: 500 });
  }
}

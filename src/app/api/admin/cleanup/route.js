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

    // Get all users
    const { rows: allUsers, error: userErr } = await dbRaw('SELECT id, email, name, role FROM users ORDER BY created_at');
    if (userErr) return NextResponse.json({ success: false, error: `Query failed: ${userErr}` }, { status: 500 });

    const fakeUsers = (allUsers || []).filter(isFakeUser);

    if (fakeUsers.length === 0) {
      return NextResponse.json({ success: true, message: 'No fake data found. Database is already clean.', deleted: 0, fakeUsers: [], realUsers: (allUsers || []).map(u => u.email) });
    }

    let totalDeleted = 0;
    const deletedEmails = [];
    const deletedNames = [];

    // Delete each fake user one by one (safer with foreign keys)
    for (const fu of fakeUsers) {
      try {
        // Delete related records using individual queries (no array casting issues)
        const relatedTables = [
          { table: 'chat_messages', column: 'conversation_id', subQuery: `SELECT id FROM chat_conversations WHERE user_id = '${fu.id}'` },
          { table: 'chat_conversations', column: 'user_id' },
          { table: 'disputes', column: 'user_id' },
          { table: 'orders', column: 'customer_id' },
          { table: 'payments', column: 'user_id' },
          { table: 'favorites', column: 'user_id' },
          { table: 'notifications', column: 'user_id' },
          { table: 'sub_admins', column: 'user_id' },
          { table: 'reviews', column: 'user_id' },
          { table: 'website_reviews', column: 'user_id' },
        ];

        for (const rel of relatedTables) {
          try {
            if (rel.subQuery) {
              const { rows: subRows } = await dbRaw(rel.subQuery);
              if (subRows?.length) {
                for (const row of subRows) {
                  await dbRaw(`DELETE FROM ${rel.table} WHERE ${rel.column} = $1`, [row.id]);
                }
              }
            } else {
              await dbRaw(`DELETE FROM ${rel.table} WHERE ${rel.column} = $1`, [fu.id]);
            }
          } catch (e) { /* table may not exist */ }
        }

        // Delete vendor products
        if (fu.role === 'vendor') {
          try {
            await dbRaw('DELETE FROM products WHERE vendor_id = $1', [fu.id]);
          } catch (e) {}
          try {
            await dbRaw('DELETE FROM vendors WHERE user_id = $1', [fu.id]);
          } catch (e) {}
        }

        // Delete the user
        const { rowCount } = await dbRaw('DELETE FROM users WHERE id = $1', [fu.id]);
        totalDeleted += rowCount || 1;
        deletedEmails.push(fu.email);
        deletedNames.push(fu.name);
      } catch (e) {
        console.error(`Failed to delete user ${fu.email}:`, e.message);
      }
    }

    // Also clean up orphan records (payments/orders for non-existent users)
    try { await dbRaw("DELETE FROM payments WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM users)"); } catch (e) {}
    try { await dbRaw("DELETE FROM orders WHERE customer_id IS NOT NULL AND customer_id NOT IN (SELECT id FROM users)"); } catch (e) {}
    try { await dbRaw("DELETE FROM reviews WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM users)"); } catch (e) {}
    try { await dbRaw("DELETE FROM website_reviews WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM users)"); } catch (e) {}

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${fakeUsers.length} fake users and ${totalDeleted} total records`,
      deletedCount: fakeUsers.length,
      totalRecordsDeleted: totalDeleted,
      deletedUsers: deletedNames.map((n, i) => `${n} (${deletedEmails[i]})`),
      remainingUsers: (allUsers || []).filter(u => !fakeUsers.find(f => f.id === u.id)).map(u => `${u.name} (${u.email}) [${u.role}]`),
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

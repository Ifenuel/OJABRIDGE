import { NextResponse } from 'next/server';
import { dbQuery, dbRaw } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

const REAL_EMAILS = [
  'admin@ojabridge.dev',
  'awoyoemmanuel12@gmail.com',
  'treed8200@gmail.com',
  'oladejiayobamiadeola@gmail.com',
];

const FAKE_PATTERNS = ['@example.com', 'finaltest', 'audit-', 'flowtest', 'test@', 'demo@', 'sample@'];

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Super admin access required' }, { status: 403 });
    }

    // Get all users
    const { data: allUsers } = await dbQuery('users', { order: { column: 'created_at', ascending: true }, limit: 500 });
    if (!allUsers?.length) return NextResponse.json({ success: true, message: 'No users found' });

    // Identify fake users
    const fakeUsers = allUsers.filter(u => {
      if (REAL_EMAILS.includes(u.email?.toLowerCase())) return false;
      for (const pattern of FAKE_PATTERNS) {
        if (u.email?.toLowerCase().includes(pattern)) return true;
      }
      if (u.email?.endsWith('.dev') && u.email !== 'admin@ojabridge.dev') return true;
      if (/^(test|demo|sample|audit|flow|final)/i.test(u.name || '')) return true;
      return false;
    });

    if (fakeUsers.length === 0) {
      return NextResponse.json({ success: true, message: 'No fake data found', deleted: 0 });
    }

    const fakeIds = fakeUsers.map(u => u.id);
    const fakeEmails = fakeUsers.map(u => u.email);
    let totalDeleted = 0;

    // Delete related data
    const tables = [
      { name: 'chat_messages', column: 'conversation_id', subQuery: 'SELECT id FROM chat_conversations WHERE user_id' },
      { name: 'chat_conversations', column: 'user_id' },
      { name: 'disputes', column: 'user_id' },
      { name: 'orders', column: 'customer_id' },
      { name: 'payments', column: 'user_id' },
      { name: 'favorites', column: 'user_id' },
      { name: 'notifications', column: 'user_id' },
      { name: 'vendors', column: 'user_id' },
      { name: 'sub_admins', column: 'user_id' },
    ];

    for (const table of tables) {
      try {
        let result;
        if (table.subQuery) {
          // For chat_messages, first delete messages in conversations owned by fake users
          const { data: convs } = await dbRaw(`${table.subQuery} = ANY($1)`, [fakeIds]);
          if (convs?.length) {
            const convIds = convs.map(c => c.id);
            await dbRaw(`DELETE FROM ${table.name} WHERE conversation_id = ANY($1)`, [convIds]);
          }
          result = { rowCount: convs?.length || 0 };
        } else {
          result = await dbRaw(`DELETE FROM ${table.name} WHERE ${table.column} = ANY($1)`, [fakeIds]);
        }
        totalDeleted += result?.rowCount || 0;
      } catch (e) { /* table may not exist */ }
    }

    // Delete products from fake vendors
    try {
      const fakeVendorIds = fakeUsers.filter(u => u.role === 'vendor').map(u => u.id);
      if (fakeVendorIds.length > 0) {
        const r = await dbRaw('DELETE FROM products WHERE vendor_id = ANY($1)', [fakeVendorIds]);
        totalDeleted += r?.rowCount || 0;
      }
    } catch (e) {}

    // Delete audit logs for fake emails
    try {
      await dbRaw('DELETE FROM audit_logs WHERE user_email = ANY($1)', [fakeEmails]);
    } catch (e) {}

    // Delete the fake users
    const r = await dbRaw('DELETE FROM users WHERE id = ANY($1)', [fakeIds]);
    totalDeleted += r?.rowCount || 0;

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${fakeUsers.length} fake users and ${totalDeleted} related records`,
      deletedUsers: fakeUsers.map(u => u.email),
      totalDeleted,
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json({ success: false, error: 'Cleanup failed' }, { status: 500 });
  }
}

// GET — Preview what would be deleted (dry run)
export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Super admin access required' }, { status: 403 });
    }

    const { data: allUsers } = await dbQuery('users', { order: { column: 'created_at', ascending: true }, limit: 500 });

    const fakeUsers = (allUsers || []).filter(u => {
      if (REAL_EMAILS.includes(u.email?.toLowerCase())) return false;
      for (const pattern of FAKE_PATTERNS) {
        if (u.email?.toLowerCase().includes(pattern)) return true;
      }
      if (u.email?.endsWith('.dev') && u.email !== 'admin@ojabridge.dev') return true;
      if (/^(test|demo|sample|audit|flow|final)/i.test(u.name || '')) return true;
      return false;
    });

    const realUsers = (allUsers || []).filter(u => !fakeUsers.includes(u));

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

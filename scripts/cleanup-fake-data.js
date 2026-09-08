require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Real users to KEEP — anyone with a real email address
const REAL_USERS = [
  'admin@ojabridge.dev',
  'awoyoemmanuel12@gmail.com',
  'treed8200@gmail.com',
  'oladejiayobamiadeola@gmail.com',
];

// Fake/test emails to DELETE
const FAKE_PATTERNS = [
  '@example.com',
  'finaltest-',
  'audit-',
  'flowtest',
  'test@',
  'demo@',
  'sample@',
];

async function cleanup() {
  const client = await pool.connect();
  try {
    console.log('🧹 Starting fake data cleanup...\n');

    // 1. Find all users
    const { rows: allUsers } = await client.query('SELECT id, email, name, role FROM users ORDER BY created_at');
    console.log(`📊 Total users found: ${allUsers.length}`);

    // 2. Identify fake users
    const fakeUsers = allUsers.filter(u => {
      // Keep real users
      if (REAL_USERS.includes(u.email.toLowerCase())) return false;
      // Delete fake patterns
      for (const pattern of FAKE_PATTERNS) {
        if (u.email.toLowerCase().includes(pattern)) return true;
      }
      // Delete users with .dev emails (except admin)
      if (u.email.endsWith('.dev') && u.email !== 'admin@ojabridge.dev') return true;
      // Delete users with suspicious test-like names
      if (/^(test|demo|sample|audit|flow|final)/i.test(u.name || '')) return true;
      return false;
    });

    console.log(`\n❌ Fake users to DELETE (${fakeUsers.length}):`);
    fakeUsers.forEach(u => console.log(`   - ${u.email} (${u.name}) [${u.role}]`));

    console.log(`\n✅ Real users to KEEP (${allUsers.length - fakeUsers.length}):`);
    allUsers.filter(u => !fakeUsers.includes(u)).forEach(u => console.log(`   - ${u.email} (${u.name}) [${u.role}]`));

    if (fakeUsers.length === 0) {
      console.log('\n✨ No fake data to clean!');
      return;
    }

    const fakeIds = fakeUsers.map(u => u.id);
    const fakeEmails = fakeUsers.map(u => u.email);

    // 3. Delete related data for fake users
    console.log('\n🗑️  Cleaning related data...');

    // Delete chat conversations/messages for fake users
    try {
      const { rows: fakeConvs } = await client.query(
        `SELECT id FROM chat_conversations WHERE user_id = ANY($1)`,
        [fakeIds]
      );
      if (fakeConvs.length > 0) {
        const convIds = fakeConvs.map(c => c.id);
        await client.query('DELETE FROM chat_messages WHERE conversation_id = ANY($1)', [convIds]);
        await client.query('DELETE FROM chat_conversations WHERE id = ANY($1)', [convIds]);
        console.log(`   ✅ Deleted ${convIds.length} chat conversations`);
      }
    } catch (e) { console.log('   ⚠️  Chat tables may not exist yet'); }

    // Delete disputes for fake users
    try {
      const { rowCount } = await client.query('DELETE FROM disputes WHERE user_id = ANY($1)', [fakeIds]);
      console.log(`   ✅ Deleted ${rowCount} disputes`);
    } catch (e) { console.log('   ⚠️  Disputes table may not exist'); }

    // Delete orders for fake users
    try {
      const { rowCount } = await client.query('DELETE FROM orders WHERE customer_id = ANY($1)', [fakeIds]);
      console.log(`   ✅ Deleted ${rowCount} orders`);
    } catch (e) { console.log('   ⚠️  Orders table may not exist'); }

    // Delete payments for fake users
    try {
      const { rowCount } = await client.query('DELETE FROM payments WHERE user_id = ANY($1)', [fakeIds]);
      console.log(`   ✅ Deleted ${rowCount} payments`);
    } catch (e) { console.log('   ⚠️  Payments table may not exist'); }

    // Delete favorites for fake users
    try {
      const { rowCount } = await client.query('DELETE FROM favorites WHERE user_id = ANY($1)', [fakeIds]);
      console.log(`   ✅ Deleted ${rowCount} favorites`);
    } catch (e) {}

    // Delete notifications for fake users
    try {
      const { rowCount } = await client.query('DELETE FROM notifications WHERE user_id = ANY($1)', [fakeIds]);
      console.log(`   ✅ Deleted ${rowCount} notifications`);
    } catch (e) {}

    // Delete vendor records for fake users
    try {
      const { rowCount } = await client.query('DELETE FROM vendors WHERE user_id = ANY($1)', [fakeIds]);
      console.log(`   ✅ Deleted ${rowCount} vendor records`);
    } catch (e) {}

    // Delete products by fake vendors
    try {
      const fakeVendorIds = fakeUsers.filter(u => u.role === 'vendor').map(u => u.id);
      if (fakeVendorIds.length > 0) {
        const { rowCount } = await client.query('DELETE FROM products WHERE vendor_id = ANY($1)', [fakeVendorIds]);
        console.log(`   ✅ Deleted ${rowCount} products from fake vendors`);
      }
    } catch (e) {}

    // Delete sub_admin records for fake users
    try {
      await client.query('DELETE FROM sub_admins WHERE user_id = ANY($1)', [fakeIds]);
    } catch (e) {}

    // Delete audit logs for fake users
    try {
      await client.query("DELETE FROM audit_logs WHERE user_email = ANY($1)", [fakeEmails]);
    } catch (e) {}

    // 4. Delete the fake users themselves
    const { rowCount } = await client.query('DELETE FROM users WHERE id = ANY($1)', [fakeIds]);
    console.log(`\n🗑️  Deleted ${rowCount} fake users`);

    // 5. Clean up any products with fake vendor data
    try {
      const { rowCount: orphanProducts } = await client.query(`
        DELETE FROM products WHERE vendor_id NOT IN (SELECT id FROM users WHERE role = 'vendor')
      `);
      if (orphanProducts > 0) console.log(`   ✅ Deleted ${orphanProducts} orphan products`);
    } catch (e) {}

    // 6. Clean up payments with fake order data
    try {
      const { rowCount: orphanPayments } = await client.query(`
        DELETE FROM payments WHERE order_id IS NOT NULL AND order_id NOT IN (SELECT id FROM orders)
      `);
      if (orphanPayments > 0) console.log(`   ✅ Deleted ${orphanPayments} orphan payments`);
    } catch (e) {}

    console.log('\n✨ Cleanup complete! Only real users remain.');
  } catch (error) {
    console.error('❌ Cleanup error:', error.message);
  } finally {
    client.release();
    pool.end();
  }
}

cleanup();

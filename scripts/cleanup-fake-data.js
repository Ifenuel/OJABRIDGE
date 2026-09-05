/**
 * CLEANUP SCRIPT — Remove fake/test users and audit logs
 * 
 * Keeps ONLY these real accounts:
 * - admin@ojabridge.dev (admin)
 * - awoyoemmanuel12@gmail.com (vendor)
 * - treed8200@gmail.com (customer)
 * - oladejiayobamiadeola@gmail.com (customer)
 * 
 * Run: node scripts/cleanup-fake-data.js
 */

require('dotenv').config();
const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment');
  console.log('Add DATABASE_URL to your .env file');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

// Real emails to KEEP
const KEEP_EMAILS = [
  'admin@ojabridge.dev',
  'awoyoemmanuel12@gmail.com',
  'treed8200@gmail.com',
  'oladejiayobamiadeola@gmail.com',
];

async function cleanup() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Get IDs of real users to keep
    const keepResult = await client.query(
      'SELECT id, email, role FROM users WHERE email = ANY($1)',
      [KEEP_EMAILS]
    );
    const keepIds = keepResult.rows.map(r => r.id);
    console.log(`\n✅ Keeping ${keepIds.length} real accounts:`);
    keepResult.rows.forEach(r => console.log(`   - ${r.email} (${r.role})`));

    // 2. Find fake users to delete
    const fakeResult = await client.query(
      'SELECT id, email, role FROM users WHERE email != ALL($1)',
      [KEEP_EMAILS]
    );
    console.log(`\n🗑️  Deleting ${fakeResult.rows.length} fake/test accounts:`);
    fakeResult.rows.forEach(r => console.log(`   - ${r.email} (${r.role})`));

    if (fakeResult.rows.length === 0) {
      console.log('\n✅ No fake users to delete');
    } else {
      const fakeIds = fakeResult.rows.map(r => r.id);

      // Delete related data first (foreign keys)
      // Delete audit logs for fake users
      try {
        const auditResult = await client.query(
          'DELETE FROM audit_logs WHERE user_id = ANY($1) RETURNING id',
          [fakeIds]
        );
        console.log(`   📝 Deleted ${auditResult.rowCount} audit log entries`);
      } catch (e) {
        console.log(`   ⚠️  Audit logs cleanup: ${e.message}`);
      }

      // Delete vendor profiles for fake users
      try {
        const vendorResult = await client.query(
          'DELETE FROM vendors WHERE user_id = ANY($1) RETURNING id',
          [fakeIds]
        );
        console.log(`   🏪 Deleted ${vendorResult.rowCount} vendor profiles`);
      } catch (e) {
        console.log(`   ⚠️  Vendor cleanup: ${e.message}`);
      }

      // Delete orders for fake users
      try {
        const orderResult = await client.query(
          'DELETE FROM orders WHERE user_id = ANY($1) RETURNING id',
          [fakeIds]
        );
        console.log(`   📦 Deleted ${orderResult.rowCount} orders`);
      } catch (e) {}

      // Delete transactions for fake users
      try {
        const txResult = await client.query(
          'DELETE FROM transactions WHERE user_id = ANY($1) RETURNING id',
          [fakeIds]
        );
        console.log(`   💳 Deleted ${txResult.rowCount} transactions`);
      } catch (e) {}

      // Delete the fake users
      const deleteResult = await client.query(
        'DELETE FROM users WHERE email != ALL($1) RETURNING email',
        [KEEP_EMAILS]
      );
      console.log(`   👤 Deleted ${deleteResult.rowCount} user accounts`);
    }

    // 3. Also clean any remaining test audit logs by user_id pattern
    try {
      const testAuditResult = await client.query(
        `DELETE FROM audit_logs WHERE user_id NOT IN (
          SELECT id FROM users WHERE email = ANY($1)
        ) AND user_id != 'a0000000-0000-0000-0000-000000000001'
        RETURNING id`,
        [KEEP_EMAILS]
      );
      if (testAuditResult.rowCount > 0) {
        console.log(`   📝 Cleaned ${testAuditResult.rowCount} additional orphaned audit entries`);
      }
    } catch (e) {
      console.log(`   ⚠️  Orphaned audit cleanup: ${e.message}`);
    }

    // 4. Summary
    const remainingUsers = await client.query('SELECT email, role FROM users ORDER BY created_at');
    console.log(`\n📊 Remaining users (${remainingUsers.rows.length}):`);
    remainingUsers.rows.forEach(r => console.log(`   - ${r.email} (${r.role})`));

    const remainingAudit = await client.query('SELECT COUNT(*) as count FROM audit_logs');
    console.log(`   📝 Audit logs: ${remainingAudit.rows[0].count} entries remaining`);

    await client.query('COMMIT');
    console.log('\n✅ Cleanup complete!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Cleanup failed:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

cleanup();

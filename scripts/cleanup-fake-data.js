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
      const auditResult = await client.query(
        'DELETE FROM audit_logs WHERE user_id = ANY($1) OR user_email = ANY($2) RETURNING id',
        [fakeIds, fakeResult.rows.map(r => r.email)]
      );
      console.log(`   📝 Deleted ${auditResult.rowCount} audit log entries`);

      // Delete vendor profiles for fake users
      const vendorResult = await client.query(
        'DELETE FROM vendors WHERE user_id = ANY($1) RETURNING id',
        [fakeIds]
      );
      console.log(`   🏪 Deleted ${vendorResult.rowCount} vendor profiles`);

      // Delete OTP codes for fake emails
      // (These are in Redis, not DB — will expire automatically)

      // Delete the fake users
      const deleteResult = await client.query(
        'DELETE FROM users WHERE email != ALL($1) RETURNING email',
        [KEEP_EMAILS]
      );
      console.log(`   👤 Deleted ${deleteResult.rowCount} user accounts`);
    }

    // 3. Also clean audit logs by email pattern (test accounts)
    const testAuditResult = await client.query(
      `DELETE FROM audit_logs WHERE user_email LIKE '%@example.com' 
       OR user_email LIKE '%@test.com' 
       OR user_email LIKE '%test%@%'
       OR user_email LIKE '%audit-%'
       OR user_email LIKE '%flowtest%'
       OR user_email LIKE '%finaltest%'
       RETURNING id`
    );
    if (testAuditResult.rowCount > 0) {
      console.log(`   📝 Cleaned ${testAuditResult.rowCount} additional test audit entries`);
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

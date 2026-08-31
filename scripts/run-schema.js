/**
 * OJABRIDGE — Database Schema Migration
 * Run: node scripts/run-schema.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
  connectionTimeoutMillis: 10000,
});

async function run() {
  const client = await pool.connect();
  try {
    const schemaPath = path.join(__dirname, '..', 'supabase', 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('🚀 Running schema from:', schemaPath);
    console.log('📏 SQL size:', (sql.length / 1024).toFixed(1), 'KB');
    
    // Run the entire SQL as one transaction
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query('COMMIT');
      console.log('✅ Schema executed successfully!');
    } catch (e) {
      await client.query('ROLLBACK');
      console.error('❌ Schema failed, rolled back:', e.message);
      process.exit(1);
    }
    
    // Verify tables
    const res = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    );
    console.log(`\n📊 Tables in database (${res.rows.length}):`);
    res.rows.forEach((r, i) => console.log(`   ${i + 1}. ${r.table_name}`));
    
    // Verify indexes
    const idx = await client.query(
      "SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE 'idx_%' ORDER BY indexname"
    );
    console.log(`\n🔑 Custom indexes (${idx.rows.length}):`);
    idx.rows.forEach(r => console.log(`   ✓ ${r.indexname}`));
    
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(e => {
  console.error('Fatal error:', e.message);
  process.exit(1);
});

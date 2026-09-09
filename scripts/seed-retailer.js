/**
 * Seeds a REAL retailer account for live-testing the retailer dashboard.
 *
 * Matches exactly what /api/auth/register creates for role='retailer':
 *   - users row (retailer role, email verified, active)
 *   - vendors row (retailer records also live in the vendors table,
 *     with kyc_status='NOT_STARTED' so it appears as unverified)
 *
 * Password: Retailer@123!  (same scheme as seed-data.js)
 * Email:    retailer2@ojabridge.dev (retailer@ojabridge.dev already exists
 *           in seed-data.js but its vendors row was never created)
 *
 * Run: node scripts/seed-retailer.js
 * Safe to re-run: deletes-and-recreates only its own rows.
 */
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { Client } = require('pg');

// Load DATABASE_URL directly from .env (bypasses dotenvx interpolation issues)
function getDatabaseUrl() {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const line = fs.readFileSync(envPath, 'utf8')
      .split(/\r?\n/)
      .find(l => l.startsWith('DATABASE_URL='));
    if (line) {
      let url = line.split('=').slice(1).join('=').trim();
      if ((url.startsWith('"') && url.endsWith('"')) || (url.startsWith("'") && url.endsWith("'"))) {
        url = url.slice(1, -1);
      }
      return url;
    }
  }
  return process.env.DATABASE_URL;
}

async function main() {
  const url = getDatabaseUrl();
  if (!url) { console.error('No DATABASE_URL found'); process.exit(1); }

  const u = new URL(url);
  const client = new Client({
    host: u.hostname,
    port: u.port || 5432,
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.slice(1),
    ssl: false,
  });

  await client.connect();

  const EMAIL = 'retailer2@ojabridge.dev';
  const PASSWORD = 'Retailer@123!';
  const NAME = 'Fatima Bello';
  const STORE = 'Fatima Retail Co';

  const hash = await bcrypt.hash(PASSWORD, 12);

  // Clean previous run of THIS seed only
  await client.query(
    `DELETE FROM vendors WHERE user_id IN (SELECT id FROM users WHERE email = $1)`,
    [EMAIL]
  );
  await client.query(`DELETE FROM users WHERE email = $1`, [EMAIL]);

  const userId = require('crypto').randomUUID();

  await client.query(
    `INSERT INTO users (id, email, password_hash, name, role, country, currency, email_verified, status)
     VALUES ($1, $2, $3, $4, 'retailer', 'NG', 'NGN', true, 'active')`,
    [userId, EMAIL, hash, NAME]
  );

  const slug = STORE.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  await client.query(
    `INSERT INTO vendors (user_id, store_name, store_slug, business_name, business_type, business_country, kyc_status)
     VALUES ($1, $2, $3, $2, 'retail', 'NG', 'NOT_STARTED')`,
    [userId, STORE, `${slug}-${userId.slice(0, 6)}`]
  );

  console.log('✅ Retailer seeded:');
  console.log('   Email:    ' + EMAIL);
  console.log('   Password: ' + PASSWORD);
  console.log('   Name:     ' + NAME);
  console.log('   Store:    ' + STORE);
  console.log('   KYC:      NOT_STARTED (appears as unverified in admin)');

  await client.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });

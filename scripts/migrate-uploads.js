/**
 * Creates the `uploads` table used by /api/upload and /api/files/[token],
 * and migrates legacy base64 data-URL images stored in products.images,
 * reviews.images, CMS posts and avatars into real stored files.
 *
 * WHY: base64 data URLs inside product rows shattered the Postgres text[]
 * array at every comma (the bug that broke product images) and made the
 * shop API response exceed Vercel serverless response limits (HTTP 500).
 *
 * Idempotent — safe to run repeatedly. Run with:  node scripts/migrate-uploads.js
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Load env (.env, then .env.local as fallback) — matches other project scripts
function loadEnv() {
  const env = {};
  for (const file of ['.env', '.env.local']) {
    const p = path.join(__dirname, '..', file);
    if (fs.existsSync(p)) {
      for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Z_0-9]+)\s*=\s*(.*)\s*$/);
        if (m && env[m[1]] === undefined) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
      }
    }
  }
  return env;
}

const env = loadEnv();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: env.DATABASE_URL });

function sniffMime(buf) {
  if (!buf || buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
  if (buf.toString('ascii', 0, 3) === 'GIF') return 'image/gif';
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  if (buf.toString('ascii', 0, 4) === '%PDF') return 'application/pdf';
  return null;
}

function parseDataUrl(url) {
  const match = /^data:([^;,]+);base64,(.*)$/s.exec(url);
  if (!match) return null;
  try {
    return { mime: match[1], bytes: Buffer.from(match[2], 'base64') };
  } catch {
    return null;
  }
}

async function storeFile(bytes, mime, folder, uploadedBy, isPublic) {
  const token = crypto.randomBytes(24).toString('hex');
  const extMap = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp', 'application/pdf': 'pdf' };
  await pool.query(
    `INSERT INTO uploads (token, folder, filename, mime_type, size_bytes, data, uploaded_by, is_public)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [token, folder, `${token}.${extMap[mime] || 'bin'}`, mime, bytes.length, bytes, uploadedBy || null, isPublic]
  );
  return `/api/files/${token}`;
}

/** Heal a shredded data URL: "data:<mime>;base64" + payload stored as two array entries. */
function healShredded(arr) {
  const out = [];
  for (let i = 0; i < arr.length; i++) {
    const cur = (arr[i] || '').trim();
    if (/^data:[\w.+-]+\/[\w.+-]+;base64$/.test(cur) && i + 1 < arr.length) {
      out.push(`${cur},${(arr[i + 1] || '').trim()}`);
      i++;
    } else {
      out.push(cur);
    }
  }
  return out;
}

async function migrateTextArrayTable(tableName, folder, isPublic, uploadedBy) {
  const { rows } = await pool.query(`SELECT id, images FROM ${tableName} WHERE images IS NOT NULL`);
  let migrated = 0;
  for (const row of rows) {
    let images = row.images;
    if (typeof images === 'string') {
      try { images = JSON.parse(images); } catch { images = images.split(',').map((s) => s.trim()).filter(Boolean); }
    }
    if (!Array.isArray(images) || images.length === 0) continue;

    const healed = healShredded(images);
    const newArr = [];
    for (const img of healed) {
      if (typeof img === 'string' && img.startsWith('data:')) {
        const parsed = parseDataUrl(img);
        const mime = parsed ? (sniffMime(parsed.bytes) || parsed.mime) : null;
        if (parsed && mime) {
          newArr.push(await storeFile(parsed.bytes, mime, folder, uploadedBy, isPublic));
          migrated++;
        }
        // Unparseable data URLs are dropped
      } else if (typeof img === 'string' && img.trim()) {
        newArr.push(img.trim());
      }
    }
    // Write back as a properly escaped text[] literal (single parameter)
    const literal = `{${newArr.map((u) => `"${u.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`).join(',')}}`;
    await pool.query(`UPDATE ${tableName} SET images = $1::text[] WHERE id = $2`, [literal, row.id]);
  }
  console.log(`  ${tableName}: ${rows.length} rows scanned, ${migrated} images migrated`);
}

async function migrateJsonbColumn(table, column, folder) {
  const { rows } = await pool.query(`SELECT id, ${column} FROM ${table} WHERE ${column} IS NOT NULL`);
  let migrated = 0;
  for (const row of rows) {
    const val = row[column];
    const images = Array.isArray(val) ? val : typeof val === 'string' ? [val] : [];
    if (images.length === 0) continue;
    const newArr = [];
    for (const img of images) {
      if (typeof img === 'string' && img.startsWith('data:')) {
        const parsed = parseDataUrl(img);
        const mime = parsed ? (sniffMime(parsed.bytes) || parsed.mime) : null;
        if (parsed && mime) {
          newArr.push(await storeFile(parsed.bytes, mime, folder, null, true));
          migrated++;
        }
      } else if (typeof img === 'string' && img.trim()) {
        newArr.push(img.trim());
      }
    }
    await pool.query(`UPDATE ${table} SET ${column} = $1::jsonb WHERE id = $2`, [JSON.stringify(newArr), row.id]);
  }
  console.log(`  ${table}.${column}: ${rows.length} rows scanned, ${migrated} images migrated`);
}

async function migrateAvatars() {
  const { rows } = await pool.query(`SELECT id, avatar_url FROM users WHERE avatar_url LIKE 'data:%'`);
  let migrated = 0;
  for (const row of rows) {
    const parsed = parseDataUrl(row.avatar_url);
    const mime = parsed ? (sniffMime(parsed.bytes) || parsed.mime) : null;
    if (parsed && mime) {
      const url = await storeFile(parsed.bytes, mime, 'avatars', row.id, true);
      await pool.query(`UPDATE users SET avatar_url = $1 WHERE id = $2`, [url, row.id]);
      migrated++;
    }
  }
  console.log(`  users.avatar_url: ${rows.length} rows scanned, ${migrated} avatars migrated`);
}

async function migrateKycDocs() {
  const { rows } = await pool.query(`SELECT id, id_document_url FROM vendors WHERE id_document_url LIKE 'data:%'`);
  let migrated = 0;
  for (const row of rows) {
    const parsed = parseDataUrl(row.id_document_url);
    const mime = parsed ? (sniffMime(parsed.bytes) || parsed.mime) : null;
    if (parsed && mime) {
      // PRIVATE — KYC documents must only be reachable via /api/secure-document
      await storeFile(parsed.bytes, mime, 'kyc', null, false);
      migrated++;
    }
  }
  console.log(`  vendors.id_document_url: ${rows.length} rows scanned, ${migrated} docs migrated (kept private, original data URL preserved for the secure viewer)`);
}

(async () => {
  console.log('=== Ensuring uploads table ===');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS uploads (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      token TEXT UNIQUE NOT NULL,
      folder TEXT NOT NULL DEFAULT 'misc',
      filename TEXT,
      mime_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      data BYTEA NOT NULL,
      uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
      is_public BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_uploads_token ON uploads(token);`);

  console.log('=== Migrating legacy data-URL images ===');
  await migrateTextArrayTable('products', 'products', true);
  await migrateTextArrayTable('reviews', 'reviews', true);
  await migrateJsonbColumn('blog_posts', 'images', 'content');
  await migrateJsonbColumn('career_posts', 'images', 'content');
  await migrateJsonbColumn('press_posts', 'images', 'content');
  await migrateAvatars();
  await migrateKycDocs();

  console.log('=== Done ===');
  await pool.end();
})().catch((e) => {
  console.error('Migration failed:', e.message);
  process.exit(1);
});

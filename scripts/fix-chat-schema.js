/**
 * OjaBridge — chat schema alignment (programmatic version).
 * Idempotent; safe to run repeatedly against production.
 *
 * Fixes the three structural problems that broke admin live chat:
 *  1. chat_messages role CHECK constraint only allowed
 *     ('user','assistant','system') — rejected every staff reply
 *     written with role='support' / 'admin'.
 *  2. chat_conversations was missing the columns the admin inbox
 *     queries: user_name, user_email, user_role, assigned_to,
 *     assigned_to_name, status.
 *  3. chat_messages was missing sender_id / sender_name.
 *
 * Usage:  node scripts/fix-chat-schema.js
 * Requires DATABASE_URL in the environment (.env.local is loaded).
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config();
const { getPool, dbRaw } = require('../src/lib/db');

async function fixChatSchema() {
  const pool = getPool();
  if (!pool) {
    console.error('❌ DATABASE_URL not configured — nothing to do.');
    process.exit(1);
  }

  console.log('Aligning chat schema with the live-chat system…\n');

  // 1) Conversations columns
  const convColumns = [
    ['user_name', 'VARCHAR(255)'],
    ['user_email', 'VARCHAR(255)'],
    ['user_role', "VARCHAR(50) DEFAULT 'customer'"],
    ['assigned_to', 'UUID'],
    ['assigned_to_name', 'VARCHAR(255)'],
    ['status', "VARCHAR(50) DEFAULT 'open'"],
  ];
  for (const [col, def] of convColumns) {
    await dbRaw(`ALTER TABLE chat_conversations ADD COLUMN IF NOT EXISTS ${col} ${def}`);
  }
  console.log('✅ chat_conversations columns ensured');

  // 2) Messages columns
  await dbRaw(`ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS sender_id UUID`);
  await dbRaw(`ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS sender_name VARCHAR(255)`);
  console.log('✅ chat_messages columns ensured');

  // 3) Drop the role CHECK constraint (dynamic name lookup)
  const { rows } = await dbRaw(
    `SELECT conname FROM pg_constraint
     WHERE conrelid = 'chat_messages'::regclass AND contype = 'c'
       AND pg_get_constraintdef(oid) ILIKE '%role%'`
  );
  for (const r of rows || []) {
    await dbRaw(`ALTER TABLE chat_messages DROP CONSTRAINT "${r.conname}"`);
    console.log(`✅ dropped restrictive role CHECK: ${r.conname}`);
  }
  if (!rows || rows.length === 0) {
    console.log('ℹ️  no restrictive role CHECK found — already clean');
  }

  // 4) Backfill conversation display fields from users
  await dbRaw(`
    UPDATE chat_conversations c
    SET user_name  = COALESCE(c.user_name, u.name),
        user_email = COALESCE(c.user_email, u.email),
        user_role  = COALESCE(c.user_role, u.role, 'customer')
    FROM users u
    WHERE c.user_id = u.id
      AND (c.user_name IS NULL OR c.user_email IS NULL OR c.user_role IS NULL)
  `);
  console.log('✅ conversation display fields backfilled');

  // 5) Indexes
  await dbRaw(`CREATE INDEX IF NOT EXISTS idx_chat_messages_conv ON chat_messages(conversation_id, created_at)`);
  await dbRaw(`CREATE INDEX IF NOT EXISTS idx_chat_conv_updated ON chat_conversations(updated_at DESC)`);
  await dbRaw(`CREATE INDEX IF NOT EXISTS idx_chat_conv_status ON chat_conversations(status)`);
  await dbRaw(`CREATE INDEX IF NOT EXISTS idx_chat_conv_assigned ON chat_conversations(assigned_to)`);
  console.log('✅ indexes ensured');

  console.log('\n🎉 Chat schema aligned — admin live chat is fully operational.');
  process.exit(0);
}

fixChatSchema().catch(err => {
  console.error('❌ Migration failed:', err.message || err);
  process.exit(1);
});

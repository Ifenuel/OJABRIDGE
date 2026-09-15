-- ============================================================
-- OjaBridge — chat schema alignment migration
-- Run once against the production database (Railway PostgreSQL).
-- Safe to re-run (idempotent).
--
-- WHY THIS EXISTS
-- The original add-chat-tables migration created chat_messages with a
-- CHECK constraint allowing only ('user','assistant','system'). The live
-- chat system inserts staff replies with role='support' (and some code
-- paths use 'admin'), so on databases created from that migration every
-- admin/sub-admin reply failed at the database level. The conversations
-- table also lacked the columns the admin inbox queries
-- (status, assigned_to, user_name, user_email, user_role, assigned_to_name).
-- ============================================================

-- 1) Conversations: columns the inbox + assignment flow depend on.
ALTER TABLE chat_conversations ADD COLUMN IF NOT EXISTS user_name VARCHAR(255);
ALTER TABLE chat_conversations ADD COLUMN IF NOT EXISTS user_email VARCHAR(255);
ALTER TABLE chat_conversations ADD COLUMN IF NOT EXISTS user_role VARCHAR(50) DEFAULT 'customer';
ALTER TABLE chat_conversations ADD COLUMN IF NOT EXISTS assigned_to UUID;
ALTER TABLE chat_conversations ADD COLUMN IF NOT EXISTS assigned_to_name VARCHAR(255);
ALTER TABLE chat_conversations ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'open';

-- 2) Messages: staff reply columns.
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS sender_id UUID;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS sender_name VARCHAR(255);

-- 3) THE CRITICAL FIX: remove the role CHECK constraint that rejects
--    role='support' / role='admin' staff replies. Find the actual constraint
--    name dynamically (Postgres generated one from the table definition).
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'chat_messages'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%role%';
  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE chat_messages DROP CONSTRAINT %I', constraint_name);
    RAISE NOTICE 'Dropped role CHECK constraint: %', constraint_name;
  ELSE
    RAISE NOTICE 'No role CHECK constraint found — nothing to drop';
  END IF;
END $$;

-- 4) Backfill display fields for conversations created before the columns
--    existed (from user_id via the users table where possible).
UPDATE chat_conversations c
SET user_name  = COALESCE(c.user_name, u.name),
    user_email = COALESCE(c.user_email, u.email),
    user_role  = COALESCE(c.user_role, u.role, 'customer')
FROM users u
WHERE c.user_id = u.id
  AND (c.user_name IS NULL OR c.user_email IS NULL OR c.user_role IS NULL);

-- 5) Indexes the inbox query actually uses.
CREATE INDEX IF NOT EXISTS idx_chat_messages_conv ON chat_messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_conv_updated ON chat_conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_conv_status ON chat_conversations(status);
CREATE INDEX IF NOT EXISTS idx_chat_conv_assigned ON chat_conversations(assigned_to);

-- 6) Keep updated_at fresh automatically.
CREATE OR REPLACE FUNCTION chat_conversations_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_chat_conversations_touch ON chat_conversations;
CREATE TRIGGER trg_chat_conversations_touch
  BEFORE UPDATE ON chat_conversations
  FOR EACH ROW EXECUTE FUNCTION chat_conversations_touch_updated_at();

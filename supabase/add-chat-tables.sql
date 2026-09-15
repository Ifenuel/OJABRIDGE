-- Chat tables for AI Customer Care
-- Run this on your Railway database
-- NOTE: roles include 'support' and 'admin' — staff replies use them.
-- (The original version constrained roles to ('user','assistant','system'),
-- which made every staff reply fail at the database level.)

CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_name VARCHAR(255),
  user_email VARCHAR(255),
  user_role VARCHAR(50) DEFAULT 'customer',
  assigned_to UUID,
  assigned_to_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender_id UUID,
  sender_name VARCHAR(255),
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'support', 'admin', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conv ON chat_messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_conv_user ON chat_conversations(user_id, created_at DESC);

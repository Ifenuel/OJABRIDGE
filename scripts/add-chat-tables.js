const { dbRaw } = require('../src/lib/db');

async function addChatTables() {
  console.log('Creating chat tables...\n');

  try {
    // chat_conversations
    await dbRaw(`
      CREATE TABLE IF NOT EXISTS chat_conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('✅ chat_conversations table created');

    // chat_messages
    await dbRaw(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
        role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('✅ chat_messages table created');

    // Index for fast message lookups
    await dbRaw(`CREATE INDEX IF NOT EXISTS idx_chat_messages_conv ON chat_messages(conversation_id, created_at)`);
    console.log('✅ chat_messages index created');

    // Index for conversation lookups
    await dbRaw(`CREATE INDEX IF NOT EXISTS idx_chat_conv_user ON chat_conversations(user_id, created_at DESC)`);
    console.log('✅ chat_conversations index created');

    console.log('\n🎉 Chat tables ready!');
  } catch (error) {
    console.error('❌ Error:', error.message || error);
  }
}

addChatTables();

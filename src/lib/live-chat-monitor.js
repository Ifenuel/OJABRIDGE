/**
 * Live chat background monitor helper.
 *
 * This does not replace the vendor widget, the admin inbox, or the support reply flow.
 * It only writes a monitored background activity row and logs what it sees.
 */

import { dbQuery, dbInsert, dbRaw, isDatabaseConnected } from '@/lib/db';

/**
 * Run one monitoring pass for live chat.
 *
 * This is intended to be called from a scheduled background job or an on-deploy
 * probe so we can observe whether open chat conversations exist and whether
 * messages are landing in the system.
 */
export async function runLiveChatMonitorPass() {
  if (!isDatabaseConnected()) {
    console.log('[LIVE_CHAT_MONITOR] Database not connected. Skipping pass.');
    return { ok: false, reason: 'Database not connected' };
  }

  try {
    // Sanitize for logs: never dump full message bodies or PII.
    const conversations = await dbQuery('chat_conversations', {
      filter: {},
      order: { column: 'updated_at', ascending: false },
      limit: 50,
    });

    const rows = Array.isArray(conversations?.data) ? conversations.data : [];
    const openCount = rows.filter(r => (r.status || 'open') === 'open').length;

    console.log('[LIVE_CHAT_MONITOR] pass', {
      totalSeen: rows.length,
      openCount,
      statuses: rows.reduce((acc, r) => {
        const s = r.status || 'open';
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      }, {}),
    });

    // If a monitor table exists, write a monitored background activity row so this
    // run is visible/auditable. If it does not exist yet, skip writing and keep the
    // pass non-fatal.
    try {
      await dbRaw(`CREATE TABLE IF NOT EXISTS chat_monitor_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        started_at TIMESTAMPTZ DEFAULT NOW(),
        total_seen INT DEFAULT 0,
        open_count INT DEFAULT 0,
        log JSONB
      )`);
      await dbInsert('chat_monitor_logs', {
        started_at: new Date().toISOString(),
        total_seen: rows.length,
        open_count: openCount,
        log: JSON.stringify({
          totalSeen: rows.length,
          openCount,
        }),
      });
    } catch (logErr) {
      console.error('[LIVE_CHAT_MONITOR] failed to write monitor log:', logErr.message);
    }

    return { ok: true, totalSeen: rows.length, openCount };
  } catch (error) {
    console.error('[LIVE_CHAT_MONITOR] pass failed:', error);
    return { ok: false, reason: error.message };
  }
}

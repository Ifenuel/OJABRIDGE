'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';

/** Lightweight branded fallback preview used when the real email HTML builder
 * fails or is unavailable. It uses the same brand identity as the production
 * email wrapper so the admin still sees an honest preview.
 */
function buildFallbackPreviewHtml({ subject, content }) {
  const safeSubject = subject && subject.trim()
    ? subject.replace(/</g, '&lt;').replace(/>/g, '&gt;')
    : 'OjaBridge Newsletter';
  const safeContent = content
    ? content.replace(/</g, '&lt;').replace(/>/g, '&gt;')
    : 'Your newsletter content will appear here...';

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      body { margin: 0; padding: 0; background: #f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
      table { border-collapse: collapse; }
      .email-body { background: #ffffff; }
    </style>
  </head>
  <body style="margin:0;padding:24px 16px;background:#f4f5f7;">
    <table role="presentation" width="100%" style="max-width:600px;margin:0 auto;">
      <tr>
        <td style="padding:24px 28px;background:#ffffff;border-bottom:1px solid #e5e7eb;">
          <table role="presentation" width="100%">
            <tr>
              <td style="color:#0f172a;font-size:20px;font-weight:800;letter-spacing:-0.3px;">
                <span style="color:#6b21a8;">Oja</span><span style="color:#0f172a;">Bridge</span>
              </td>
              <td align="right" style="color:#6b7280;font-size:10px;letter-spacing:1.4px;text-transform:uppercase;font-weight:600;">Shop &bull; Connect &bull; Grow</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:26px 28px;background:#fafbfc;border-bottom:1px solid #e5e7eb;">
          <div style="border-bottom:2px solid #6b21a8;padding-bottom:10px;margin-bottom:14px;">
            <h1 style="color:#0f172a;font-size:19px;font-weight:700;margin:0;line-height:1.3;">${safeSubject}</h1>
          </div>
          <div style="color:#374151;line-height:1.8;font-size:14px;white-space:pre-wrap;">
            ${safeContent}
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding:14px 28px;text-align:center;background:#0f172a;">
          <p style="color:rgba(255,255,255,0.7);font-size:11px;margin:0;">OjaBridge &mdash; Shop &bull; Connect &bull; Grow</p>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();
}


export default function AdminNewsletterPage() {
  const { user } = useAuth();
  const [subscribers, setSubscribers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState(null);

  // Compose form
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!showPreview) {
      setPreviewHtml('');
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const mod = await import('@/lib/email');
        const buildNewsletterEmail = mod.buildNewsletterEmail;
        if (!cancelled && typeof buildNewsletterEmail === 'function') {
          setPreviewHtml(buildNewsletterEmail({ subject, content, preheader: null }));
        } else if (!cancelled) {
          setPreviewHtml(buildFallbackPreviewHtml({ subject, content }));
        }
      } catch (e) {
        console.error('Failed to build newsletter preview:', e);
        if (!cancelled) {
          setPreviewHtml(buildFallbackPreviewHtml({ subject, content }));
        }
      }
    })();
    return () => { cancelled = true; };
  }, [showPreview, subject, content]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/newsletter', { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setSubscribers(data.subscribers || []);
        setCount(data.count || 0);
        setCampaigns(data.campaigns || []);
      }
    } catch (err) {
      console.error('Failed to load newsletter data:', err);
    }
    setLoading(false);
  };

  const handleSend = async () => {
    if (!subject.trim() || !content.trim()) {
      setMessage({ type: 'error', text: 'Subject and content are required' });
      return;
    }

    if (!window.confirm(`Send this newsletter to ${count} active subscribers?`)) return;

    setSending(true);
    setMessage(null);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ subject, content }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        setSubject('');
        setContent('');
        loadData();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to send' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    }
    setSending(false);
  };

  return (
    <DashboardLayout role="admin" requiredPermission="newsletter">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ob-navy">Newsletter</h1>
        <p className="text-gray-500 text-sm mt-1">Compose and send newsletters to all subscribers via Brevo.</p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg mb-6 ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl border border-gray-100">
          <p className="text-xs text-gray-500">Active Subscribers</p>
          <p className="text-2xl font-bold text-ob-purple mt-1">{count}</p>
          <p className="text-[10px] text-gray-400 mt-1">Receiving newsletters</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100">
          <p className="text-xs text-gray-500">Campaigns Sent</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{campaigns.length}</p>
          <p className="text-[10px] text-gray-400 mt-1">Total newsletters sent</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100">
          <p className="text-xs text-gray-500">Email Provider</p>
          <p className="text-2xl font-bold text-green-600 mt-1">Brevo</p>
          <p className="text-[10px] text-gray-400 mt-1">Transactional email</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Compose */}
        <div className="bg-white p-6 rounded-xl border border-gray-100">
          <h2 className="font-bold text-ob-navy mb-4">Compose Newsletter</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple focus:ring-2 focus:ring-ob-purple/20 outline-none"
                placeholder="e.g. New Features on OjaBridge!"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
              <textarea
                rows={8}
                value={content}
                onChange={e => setContent(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple focus:ring-2 focus:ring-ob-purple/20 outline-none resize-none"
                placeholder="Write your newsletter content here. Use plain text — it will be formatted into a professional email template automatically."
              />
              <p className="text-[10px] text-gray-400 mt-1">{content.length} characters</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:border-ob-purple transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                {showPreview ? 'Hide Preview' : 'Preview'}
              </button>
              <button
                onClick={handleSend}
                disabled={sending || !subject.trim() || !content.trim()}
                className="flex items-center gap-2 px-6 py-2.5 bg-ob-purple text-white rounded-lg text-sm font-semibold hover:bg-ob-purple-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    Send to {count} Subscribers
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Preview — renders the same email wrapper used when sending via Brevo. */}
          {showPreview && (
            <div className="mt-6 border-t border-gray-100 pt-6">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-3">Email Preview</p>
              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm" style={{ maxWidth: 600 }}>
                <iframe title="Newsletter email preview" srcDoc={previewHtml || '<html><body style="margin:0;padding:24px;background:#f4f5f7;color:#1a1a2e;">No preview</body></html>'} style={{ width: '100%', height: 520, border: 'none', display: 'block' }} />
              </div>
              <p className="text-[10px] text-gray-400 mt-2 text-center">This preview uses the same email template sent to subscribers via Brevo.</p>
            </div>
          )}
        </div>

        {/* Subscribers & Campaigns */}
        <div className="space-y-6">
          {/* Subscribers List */}
          <div className="bg-white p-6 rounded-xl border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-ob-navy">Subscribers ({count})</h2>
              <button onClick={loadData} className="text-ob-purple text-xs font-medium hover:underline">Refresh</button>
            </div>
            {loading ? (
              <div className="text-center py-8"><div className="animate-spin h-6 w-6 border-2 border-ob-purple border-t-transparent rounded-full mx-auto" /></div>
            ) : subscribers.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No subscribers yet. They will appear here when users subscribe via the popup or footer.</p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {subscribers.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-ob-purple/10 rounded-full flex items-center justify-center text-xs font-bold text-ob-purple">
                        {s.email[0].toUpperCase()}
                      </div>
                      <span className="text-sm text-ob-navy">{s.email}</span>
                    </div>
                    <span className="text-[10px] text-gray-400">
                      {s.subscribed_at ? new Date(s.subscribed_at).toLocaleDateString() : '—'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Campaign History */}
          <div className="bg-white p-6 rounded-xl border border-gray-100">
            <h2 className="font-bold text-ob-navy mb-4">Campaign History</h2>
            {campaigns.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No campaigns sent yet.</p>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {campaigns.map(c => (
                  <div key={c.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-ob-navy truncate">{c.subject}</p>
                      <span className="text-[10px] text-gray-400">
                        {c.sent_at ? new Date(c.sent_at).toLocaleString() : '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-gray-400">
                      <span>Sent to {c.recipient_count || 0} subscribers</span>
                      <span className={c.status === 'sent' ? 'text-green-600' : 'text-red-500'}>
                        {c.status === 'sent' ? 'Sent' : c.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

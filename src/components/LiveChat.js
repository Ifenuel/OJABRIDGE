'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export default function LiveChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [unread, setUnread] = useState(0);
  const [connected, setConnected] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileHeight, setMobileHeight] = useState(null); // px string when measured
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const pollRef = useRef(null);

  // Detect device + keyboard. Desktop and mobile get SEPARATE styling paths.
  useEffect(() => {
    if (!open) return;

    const update = () => {
      const mobile = window.innerWidth < 640;
      setIsMobile(mobile);
      if (!mobile) { setMobileHeight(null); return; }

      const vv = window.visualViewport;
      if (!vv) { setMobileHeight(null); return; }

      // When keyboard opens, vv.height shrinks to the visible area above it.
      // Chat takes 60% of the visible area (capped) so the page stays visible behind.
      const h = Math.min(Math.max(Math.floor(vv.height * 0.6), 200), 380);
      setMobileHeight(`${h}px`);
    };

    update();
    window.visualViewport?.addEventListener('resize', update);
    window.visualViewport?.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    return () => {
      window.visualViewport?.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [open]);

  const getUserInfo = useCallback(() => {
    try {
      const userData = localStorage.getItem('ojabridge_session');
      if (userData) {
        const user = JSON.parse(userData);
        let name = user?.name?.split(' ')[0] || null;
        if (name && /^(ojabridge|admin|user|test|vendor|retailer|customer)$/i.test(name)) {
          name = user?.email?.split('@')[0] || null;
        }
        return { id: user?.id, name: name || user?.email?.split('@')[0], role: user?.role, email: user?.email };
      }
    } catch {}
    return null;
  }, []);

  // Load or create conversation
  useEffect(() => {
    if (!open) return;
    const info = getUserInfo();

    const loadOrCreate = async () => {
      try {
        if (!info?.id) {
          setMessages([{ id: 'welcome', role: 'support', content: "Hello! 👋 Welcome to OjaBridge Live Support.\n\nTo chat with our support team, please log in or create an account first.\n\nOur team can help you with orders, payments, vendor issues, account questions, and anything else on the platform." }]);
          return;
        }
        const res = await fetch(`/api/live-chat?clientUserId=${info.id}`, { credentials: 'include' });
        const data = await res.json();
        if (data.success && data.conversationId) {
          setConversationId(data.conversationId);
          const msgs = data.messages?.length > 0 ? data.messages : [{
            id: 'welcome', role: 'support',
            content: `Hello${info.name ? ' ' + info.name : ''}! 👋 Welcome to OjaBridge Live Support.\n\nHow can we help you today?`
          }];
          setMessages(msgs);
          setConnected(true);
        } else {
          setMessages([{ id: 'welcome', role: 'support', content: "Hello! 👋 Welcome to OjaBridge Live Support.\n\nHow can we help you today?" }]);
        }
      } catch {
        setMessages([{ id: 'welcome', role: 'support', content: "Hello! 👋 Welcome to OjaBridge Live Support.\n\nHow can we help you today?" }]);
      }
    };
    loadOrCreate();
  }, [open, getUserInfo]);

  // Poll for new messages from support
  useEffect(() => {
    if (!open || !conversationId) return;
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/live-chat/poll?conversationId=${conversationId}`, { credentials: 'include' });
        const data = await res.json();
        if (data.success && data.messages?.length > 0) {
          setMessages(prev => {
            const existingIds = new Set(prev.map(m => m.id));
            const newMsgs = data.messages.filter(m => !existingIds.has(m.id));
            if (newMsgs.length > 0) return [...prev, ...newMsgs];
            return prev;
          });
        }
      } catch {}
    }, 3000);
    return () => clearInterval(pollRef.current);
  }, [open, conversationId]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 300); }, [open]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { id: Date.now().toString(), role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    const messageText = input.trim();
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/live-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: messageText, conversationId }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.conversationId && !conversationId) setConversationId(data.conversationId);
        setConnected(true);
      } else {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(), role: 'support',
          content: data.error || "We're sorry, something went wrong. Please try again or email us at awoyoemmanuel12@gmail.com"
        }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(), role: 'support',
        content: "Connection issue. Please try again. If the problem persists, email us at awoyoemmanuel12@gmail.com"
      }]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  // ============================================================
  // POSITIONING — two clean paths, no class/inline conflicts
  // ============================================================
  // DESKTOP: floating card, bottom-right (all via inline styles for reliability)
  const desktopStyle = {
    bottom: '1.5rem',
    right: '1.5rem',
    width: '380px',
    height: 'min(65vh, 520px)',
    maxHeight: 'min(65vh, 520px)',
    borderRadius: '1rem',
  };

  // MOBILE: bottom sheet, full width — height adapts to keyboard when typing
  const mobileStyle = {
    bottom: 0,
    left: 0,
    right: 0,
    height: mobileHeight || 'min(65vh, 480px)',
    maxHeight: mobileHeight || 'min(65vh, 480px)',
    borderTopLeftRadius: '1rem',
    borderTopRightRadius: '1rem',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
  };

  return (
    <>
      {/* Chat Bubble */}
      {!open && (
        <button onClick={() => { setOpen(true); setUnread(0); }}
          className="fixed z-[9999] w-14 h-14 bg-ob-purple hover:bg-ob-purple-dark text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
          title="Chat with OjaBridge Support"
          style={{ bottom: 'max(1.25rem, env(safe-area-inset-bottom, 1.25rem))', right: 'max(1.25rem, env(safe-area-inset-right, 1.25rem))' }}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{unread}</span>
          )}
        </button>
      )}

      {/* Chat Window */}
      {open && (
        <>
          {/* Backdrop — mobile only */}
          {isMobile && <div className="fixed inset-0 z-[9998] bg-black/30" onClick={() => setOpen(false)} />}

          <div
            className="fixed z-[9999] bg-white shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
            style={isMobile ? mobileStyle : desktopStyle}
          >
            {/* Header */}
            <div className="bg-ob-navy px-3 py-2 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-ob-purple rounded-full flex items-center justify-center relative">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full border border-ob-navy" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-xs leading-tight">OjaBridge Support</h3>
                  <p className="text-green-400 text-[9px] leading-tight">
                    {connected ? '🟢 Support team online' : 'Connecting...'}
                  </p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white transition-colors p-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 bg-gray-50 min-h-0">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-ob-purple text-white rounded-br-md'
                      : 'bg-white text-gray-700 border border-gray-100 shadow-sm rounded-bl-md'
                  }`}>
                    {msg.role === 'support' && (
                      <div className="text-[10px] text-ob-purple font-semibold mb-0.5">Support Team</div>
                    )}
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-bl-md px-3 py-2">
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-ob-purple rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-ob-purple rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-ob-purple rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="px-3 py-2 border-t border-gray-100 bg-white flex-shrink-0" style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom, 8px))' }}>
              <div className="flex items-end gap-2">
                <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  rows={1}
                  className="flex-1 resize-none border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-ob-purple focus:ring-1 focus:ring-ob-purple/20 outline-none max-h-16"
                  style={{ minHeight: '36px' }}
                />
                <button onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  className="w-8 h-8 bg-ob-purple hover:bg-ob-purple-dark text-white rounded-xl flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
              <p className="text-[9px] text-gray-400 mt-1 text-center">Our support team typically responds within minutes</p>
            </div>
          </div>
        </>
      )}
    </>
  );
}

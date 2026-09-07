'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

function renderMessage(text) {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, i) => {
    let processed = line
      .replace(/(https?:\/\/[^\s<&]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-ob-purple underline hover:text-ob-purple-dark">$1</a>');
    if (/^\s*[•\-*]\s/.test(line)) {
      processed = processed.replace(/^(\s*)[•\-*]\s/, '$1');
      return <div key={i} className="flex items-start gap-2 ml-1"><span className="text-ob-purple mt-0.5 flex-shrink-0 text-xs">●</span><span dangerouslySetInnerHTML={{ __html: processed }} className="flex-1" /></div>;
    }
    if (/^\s*\d+[.)]\s/.test(line)) {
      return <div key={i} className="ml-1" dangerouslySetInnerHTML={{ __html: processed }} />;
    }
    if (line.trim() === '') return <div key={i} className="h-1.5" />;
    return <div key={i} dangerouslySetInnerHTML={{ __html: processed }} />;
  });
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [unread, setUnread] = useState(1);
  const [userName, setUserName] = useState(null);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Detect iOS keyboard via visualViewport
  useEffect(() => {
    if (!open) return;
    const vv = window.visualViewport;
    if (!vv) return;

    const checkKeyboard = () => {
      // If visual viewport height is significantly less than screen, keyboard is open
      const screenH = window.screen?.height || window.innerHeight;
      const ratio = vv.height / screenH;
      setKeyboardOpen(ratio < 0.7);
    };

    checkKeyboard();
    vv.addEventListener('resize', checkKeyboard);
    vv.addEventListener('scroll', checkKeyboard);
    window.addEventListener('resize', checkKeyboard);

    return () => {
      vv.removeEventListener('resize', checkKeyboard);
      vv.removeEventListener('scroll', checkKeyboard);
      window.removeEventListener('resize', checkKeyboard);
    };
  }, [open]);

  // Get user info from localStorage
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

  useEffect(() => {
    if (open) {
      const info = getUserInfo();
      if (info?.name) setUserName(info.name);
    }
  }, [open, getUserInfo]);

  // Load conversation history
  useEffect(() => {
    if (open && messages.length === 0) {
      const loadHistory = async () => {
        try {
          const info = getUserInfo();
          if (!info?.id) {
            setMessages([{ id: 'welcome', role: 'assistant', content: "Hello! 👋 Welcome to OjaBridge!\n\nI am your AI support assistant. I can help you with shopping, orders, payments, vendor setup, KYC, disputes, and anything else on the platform.\n\nHow can I help you today? 😊" }]);
            setUnread(0);
            return;
          }
          const res = await fetch(`/api/chat?clientUserId=${info.id}`, { credentials: 'include' });
          const data = await res.json();
          if (data.success && data.messages?.length > 0) {
            setMessages(data.messages.map(m => ({ id: m.id, role: m.role, content: m.content })));
            setConversationId(data.conversationId);
          } else {
            const greeting = info.name ? `Hello ${info.name}! 👋` : "Hello! 👋";
            setMessages([{ id: 'welcome', role: 'assistant', content: `${greeting} Welcome to OjaBridge!\n\nI am your AI support assistant. How can I help you today? 😊` }]);
          }
          setUnread(0);
        } catch {
          setMessages([{ id: 'welcome', role: 'assistant', content: "Hello! 👋 Welcome to OjaBridge!\n\nI am your AI support assistant. How can I help you today? 😊" }]);
          setUnread(0);
        }
      };
      loadHistory();
    }
  }, [open, messages.length, getUserInfo]);

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
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message: messageText,
          conversationId,
          clientUser: getUserInfo(),
          conversationContext: messages.slice(-5).map(m => ({ role: m.role, content: typeof m.content === 'string' ? m.content.substring(0, 200) : '' })),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: data.reply }]);
        if (data.conversationId) setConversationId(data.conversationId);
      } else {
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: data.error || "Oops! Something went wrong. Please try again." }]);
      }
    } catch {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: "Oops! Connection issue. Please try again." }]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  // Chat height: when keyboard is open on mobile, take nearly full visible area
  // When keyboard is closed, take ~65% of screen on mobile, fixed size on desktop
  const chatStyle = keyboardOpen ? {
    // Keyboard open: take full visible viewport, anchored to bottom
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100dvh',
    maxHeight: '100dvh',
    borderRadius: 0,
    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
  } : {};

  const chatClass = keyboardOpen
    ? 'fixed z-[9999] bg-white shadow-2xl border border-gray-200 flex flex-col overflow-hidden'
    : 'fixed z-[9999] bg-white shadow-2xl border border-gray-200 flex flex-col overflow-hidden max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:rounded-t-2xl sm:bottom-6 sm:right-6 sm:w-[380px] sm:rounded-2xl';

  return (
    <>
      {/* Chat Bubble */}
      {!open && (
        <button onClick={() => setOpen(true)}
          className="fixed z-[9999] w-14 h-14 bg-ob-purple hover:bg-ob-purple-dark text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
          title="Chat with OjaBridge AI"
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
          {/* Backdrop — mobile only, hidden when keyboard is open */}
          {!keyboardOpen && <div className="fixed inset-0 z-[9998] bg-black/30 sm:hidden" onClick={() => setOpen(false)} />}

          {/* Chat container */}
          <div

            className={chatClass}
            style={keyboardOpen ? chatStyle : {
              height: 'min(65vh, 520px)',
              maxHeight: 'min(65vh, 520px)',
            }}
          >
            {/* Header */}
            <div className="bg-ob-navy px-3 py-2 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-ob-purple rounded-full flex items-center justify-center relative">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full border border-ob-navy" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-xs leading-tight">OjaBridge Support</h3>
                  <p className="text-green-400 text-[9px] leading-tight">Online · AI Assistant</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white transition-colors p-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Messages — scrollable, takes remaining space */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 bg-gray-50 min-h-0">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3 py-1.5 text-sm leading-relaxed ${msg.role === 'user' ? 'bg-ob-purple text-white rounded-br-md' : 'bg-white text-gray-700 border border-gray-100 shadow-sm rounded-bl-md'}`}>
                    {msg.role === 'assistant'
                      ? <div className="space-y-0.5">{renderMessage(msg.content)}</div>
                      : <p className="whitespace-pre-wrap">{msg.content}</p>
                    }
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

            {/* Input Area — stays at bottom, never covered by keyboard */}
            <div className="px-3 py-2 border-t border-gray-100 bg-white flex-shrink-0" style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom, 8px))' }}>
              <div className="flex items-end gap-2">
                <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                  placeholder="Type your question..."
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
            </div>
          </div>
        </>
      )}
    </>
  );
}

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

function renderMessage(text) {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, i) => {
    let processed = line
      // Convert URLs to clickable links
      .replace(/(https?:\/\/[^\s<&]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-ob-purple underline hover:text-ob-purple-dark">$1</a>');
    // Bullet points
    if (/^\s*[•\-*]\s/.test(line)) {
      processed = processed.replace(/^(\s*)[•\-*]\s/, '$1');
      return <div key={i} className="flex items-start gap-2 ml-1"><span className="text-ob-purple mt-0.5 flex-shrink-0 text-xs">●</span><span dangerouslySetInnerHTML={{ __html: processed }} className="flex-1" /></div>;
    }
    // Numbered steps
    if (/^\s*\d+[.)]\s/.test(line)) {
      return <div key={i} className="ml-1" dangerouslySetInnerHTML={{ __html: processed }} />;
    }
    // Empty lines
    if (line.trim() === '') return <div key={i} className="h-1.5" />;
    // Regular text
    return <div key={i} dangerouslySetInnerHTML={{ __html: processed }} />;
  });
}

const EMOJI_CATEGORIES = {
  'Smileys': ['😊','😃','😄','😁','😆','😅','🤣','😂','🙂','😉','😍','🥰','😘','😋','😛','🤗','🤭','🤔','😏','😬','😢','😭','😤','😠','😡','🤯','😱','😰','🥺','😳','😴','🤤','😜','🤪','😝','🤑','🤗'],
  'Hearts': ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','💕','💖','💗','💘','💝','💟','❣️','💔','❤️‍🔥','🫶'],
  'Hands': ['👋','🤚','✋','👌','🤌','✌️','🤞','🤟','🤘','🤙','👍','👎','✊','👊','👏','🙌','👐','🙏','💪','🤝','🫰','🤲'],
  'Objects': ['⭐','🌟','✨','🎉','🎊','🏆','🥇','🎁','🔔','🛍️','🛒','📦','💳','💰','🏪','🔒','🔑','📋','📝','📊','📈','🎯','🚀','✈️','🚚','📸','📱','💻','🌍','📍','🇳🇬','✅','❌','⚠️','💯','🔥'],
};

function EmojiPicker({ onSelect, onClose }) {
  const [activeTab, setActiveTab] = useState('Smileys');
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div ref={ref} className="border-t border-gray-100 bg-white">
      <div className="flex border-b border-gray-100 px-1 pt-1 gap-0">
        {Object.keys(EMOJI_CATEGORIES).map(cat => (
          <button key={cat} onClick={() => setActiveTab(cat)}
            className={`flex-1 text-[10px] py-1.5 font-medium transition-colors border-b-2 ${activeTab === cat ? 'border-ob-purple text-ob-purple bg-ob-purple/5' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            {cat}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-8 gap-0 p-1.5 overflow-y-auto" style={{ maxHeight: '160px' }}>
        {EMOJI_CATEGORIES[activeTab]?.map((emoji, i) => (
          <button key={i} type="button"
            onMouseDown={(e) => { e.preventDefault(); onSelect(emoji); }}
            className="aspect-square flex items-center justify-center text-xl hover:bg-ob-purple/10 rounded-md cursor-pointer select-none active:scale-110 transition-transform"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [unread, setUnread] = useState(1);
  const [showEmoji, setShowEmoji] = useState(false);
  const [attachedImage, setAttachedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [userName, setUserName] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiInputRef = useRef(null);
  const chatRef = useRef(null);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Get user info from localStorage
  const getUserInfo = useCallback(() => {
    try {
      const userData = localStorage.getItem('ojabridge_session');
      if (userData) {
        const user = JSON.parse(userData);
        let name = user?.name?.split(' ')[0] || null;
        if (name && /^(ojabridge|admin|user|test|vendor|retailer|customer)$/i.test(name)) {
          name = null; // Will be fetched from DB by API
        }
        return { id: user?.id, name: name || user?.email?.split('@')[0], role: user?.role, email: user?.email };
      }
    } catch {}
    return null;
  }, []);

  // Set username on mount
  useEffect(() => {
    if (open) {
      const info = getUserInfo();
      if (info?.name) setUserName(info.name);
    }
  }, [open, getUserInfo]);

  // Load conversation history when opening
  useEffect(() => {
    if (open && messages.length === 0) {
      const loadHistory = async () => {
        try {
          const info = getUserInfo();
          if (!info?.id) {
            // No user — show welcome
            setMessages([{
              id: 'welcome',
              role: 'assistant',
              content: "Hello! 👋 Welcome to OjaBridge!\n\nI am your AI support assistant. I can help you with shopping, orders, payments, vendor setup, KYC verification, disputes, and anything else on the platform.\n\nHow can I help you today? 😊",
            }]);
            setUnread(0);
            return;
          }

          const res = await fetch(`/api/chat?clientUserId=${info.id}`, { credentials: 'include' });
          const data = await res.json();

          if (data.success && data.messages?.length > 0) {
            // Show existing conversation
            const formatted = data.messages.map(m => ({
              id: m.id,
              role: m.role,
              content: m.content,
            }));
            setMessages(formatted);
            setConversationId(data.conversationId);
          } else {
            // New conversation — show welcome
            const greeting = info.name ? `Hello ${info.name}! 👋` : "Hello! 👋";
            setMessages([{
              id: 'welcome',
              role: 'assistant',
              content: `${greeting} Welcome to OjaBridge!\n\nI am your AI support assistant. I can help you with shopping, orders, payments, vendor setup, KYC verification, disputes, and anything else on the platform.\n\nHow can I help you today? 😊`,
            }]);
          }
          setUnread(0);
        } catch {
          setMessages([{
            id: 'welcome',
            role: 'assistant',
            content: "Hello! 👋 Welcome to OjaBridge!\n\nI am your AI support assistant. How can I help you today? 😊",
          }]);
          setUnread(0);
        }
      };
      loadHistory();
    }
  }, [open, messages.length, getUserInfo]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 300); }, [open]);

  const handleEmojiSelect = useCallback((emoji) => {
    setInput(prev => prev + emoji);
    setShowEmoji(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert('Image must be under 10MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => { setAttachedImage(ev.target.result); setImagePreview(ev.target.result); };
    reader.readAsDataURL(file);
  };

  const removeImage = () => { setAttachedImage(null); setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; };

  const sendMessage = async () => {
    if ((!input.trim() && !attachedImage) || loading) return;
    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim() || (attachedImage ? 'Please look at this screenshot' : ''),
      image: attachedImage || null,
    };
    setMessages(prev => [...prev, userMsg]);
    const messageText = input.trim() || 'Please analyze this image';
    const imageToSend = attachedImage;
    setInput(''); setAttachedImage(null); setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message: messageText,
          conversationId,
          image: imageToSend,
          clientUser: getUserInfo(),
          conversationContext: messages.slice(-5).map(m => ({
            role: m.role,
            content: typeof m.content === 'string' ? m.content.substring(0, 200) : '',
          })),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.reply,
        }]);
        if (data.conversationId) setConversationId(data.conversationId);
      } else {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.error || "Oops! I am having a tiny hiccup right now. 😅 Try again in a moment!",
        }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Oops! Looks like your connection dropped for a second. 😅 Try sending your message again — I am right here!",
      }]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  return (
    <>
      {/* Chat Bubble */}
      {!open && (
        <button onClick={() => setOpen(true)}
          className="fixed z-[9999] w-14 h-14 bg-ob-purple hover:bg-ob-purple-dark text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
          title="Chat with OjaBridge AI"
          style={{
            bottom: 'max(1.25rem, env(safe-area-inset-bottom, 1.25rem))',
            right: 'max(1.25rem, env(safe-area-inset-right, 1.25rem))',
          }}
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
          {/* Mobile backdrop */}
          {isMobile && <div className="fixed inset-0 z-[9998] bg-black/40" onClick={() => setOpen(false)} />}

          <div ref={chatRef}
            className="fixed z-[9999] bg-white shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
            style={isMobile ? {
              bottom: 0, left: 0, right: 0,
              height: '60vh',
              maxHeight: '60vh',
              borderRadius: '1rem 1rem 0 0',
            } : {
              bottom: 'max(1.5rem, env(safe-area-inset-bottom, 1.5rem))',
              right: 'max(1.5rem, env(safe-area-inset-right, 1.5rem))',
              width: '380px',
              height: '520px',
              maxHeight: '600px',
              borderRadius: '1rem',
            }}
          >
            {/* Header — compact */}
            <div className="bg-ob-navy px-4 py-2.5 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-ob-purple rounded-full flex items-center justify-center relative">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full border-1.5 border-ob-navy" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-xs">OjaBridge Support</h3>
                  <p className="text-green-400 text-[9px]">Online · AI Assistant</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white transition-colors p-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Messages — scrollable */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2.5 bg-gray-50">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${msg.role === 'user' ? 'bg-ob-purple text-white rounded-br-md' : 'bg-white text-gray-700 border border-gray-100 shadow-sm rounded-bl-md'}`}>
                    {msg.image && (
                      <div className="mb-2">
                        <img src={msg.image} alt="Attached" className="rounded-lg max-h-28 w-auto object-cover" />
                      </div>
                    )}
                    {msg.role === 'assistant'
                      ? <div className="space-y-0.5">{renderMessage(msg.content)}</div>
                      : <p className="whitespace-pre-wrap">{msg.content}</p>
                    }
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-bl-md px-4 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-ob-purple rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-ob-purple rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-ob-purple rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Image Preview */}
            {imagePreview && (
              <div className="px-3 py-2 border-t border-gray-100 bg-white">
                <div className="relative inline-block">
                  <img src={imagePreview} alt="Preview" className="h-14 rounded-lg object-cover border border-gray-200" />
                  <button onClick={removeImage} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 shadow">×</button>
                </div>
              </div>
            )}

            {/* Emoji Picker */}
            {showEmoji && (
              <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmoji(false)} />
            )}

            {/* Input Area — compact, keyboard-friendly */}
            <div className="px-2.5 py-2 border-t border-gray-100 bg-white flex-shrink-0" style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0.5rem))' }}>
              <input ref={emojiInputRef} type="text" inputMode="emoji" readOnly
                className="absolute opacity-0 w-0 h-0 pointer-events-none"
                onFocus={() => {}}
                onBlur={(e) => {
                  if (e.target.value) {
                    setInput(prev => prev + e.target.value);
                    e.target.value = '';
                  }
                }}
              />
              <div className="flex items-end gap-1.5 relative">
                <button onClick={() => {
                  if (isMobile) {
                    emojiInputRef.current?.focus();
                  } else {
                    setShowEmoji(!showEmoji);
                  }
                }}
                  className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors flex-shrink-0 ${showEmoji ? 'bg-ob-purple/10 text-ob-purple' : 'text-gray-400 hover:text-ob-purple hover:bg-gray-100'}`}
                  title="Emoji"
                >
                  <span className="text-base">😊</span>
                </button>
                <button onClick={() => fileInputRef.current?.click()}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-ob-purple hover:bg-gray-100 transition-colors flex-shrink-0"
                  title="Attach image"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                  placeholder="Type your question..."
                  rows={1}
                  className="flex-1 resize-none border border-gray-200 rounded-xl px-2.5 py-1.5 text-sm focus:border-ob-purple focus:ring-1 focus:ring-ob-purple/20 outline-none max-h-12"
                  style={{ minHeight: '34px' }}
                />
                <button onClick={sendMessage}
                  disabled={(!input.trim() && !attachedImage) || loading}
                  className="w-8 h-8 bg-ob-purple hover:bg-ob-purple-dark text-white rounded-xl flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

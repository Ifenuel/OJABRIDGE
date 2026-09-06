'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

function renderMessage(text) {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, i) => {
    let processed = line
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-ob-navy">$1</strong>')
      // Convert URLs to clickable links
      .replace(/(https?:\/\/[^\s<&]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-ob-purple underline hover:text-ob-purple-dark">$1</a>');
    if (/^\s*[•\-*]\s/.test(line) && !line.trim().startsWith('**')) {
      processed = processed.replace(/^(\s*)[•\-*]\s/, '$1');
      return <div key={i} className="flex items-start gap-2 ml-1"><span className="text-ob-purple mt-0.5 flex-shrink-0 text-xs">●</span><span dangerouslySetInnerHTML={{ __html: processed }} className="flex-1" /></div>;
    }
    if (/^\s*\d+[️⃣.)]\s/.test(line)) {
      return <div key={i} className="ml-1" dangerouslySetInnerHTML={{ __html: processed }} />;
    }
    if (line.trim() === '') return <div key={i} className="h-1.5" />;
    return <div key={i} dangerouslySetInnerHTML={{ __html: processed }} />;
  });
}

const EMOJI_CATEGORIES = {
  'Smileys': ['😊','😃','😄','😁','😆','😅','🤣','😂','🙂','😉','😍','🥰','😘','😋','😛','🤗','🤭','🤔','😏','😬','😢','😭','😤','😠','😡','🤯','😱','😰','🥺','😳','😴','🤤','😜','🤪','😝','🤑','🤗'],
  'Hearts': ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','💕','💖','💗','💘','💝','💟','❣️','💔','❤️‍🔥','🫶','💑','💏'],
  'Hands': ['👋','🤚','✋','👌','🤌','✌️','🤞','🤟','🤘','🤙','👍','👎','✊','👊','👏','🙌','👐','🙏','💪','🤝','🫰','🤲','🤛','🤜'],
  'Objects': ['⭐','🌟','✨','🎉','🎊','🏆','🥇','🎁','🔔','🛍️','🛒','📦','💳','💰','🏪','🔒','🔑','📋','📝','📊','📈','🎯','🚀','✈️','🚚','📸','📱','💻','🌍','📍','🏠','🇳🇬','✅','❌','⚠️','💯','🔥'],
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
    <div ref={ref} className="border-t border-gray-100 bg-white" style={{ maxHeight: '180px' }}>
      <div className="flex border-b border-gray-100 px-2 pt-2 gap-1">
        {Object.keys(EMOJI_CATEGORIES).map(cat => (
          <button key={cat} onClick={() => setActiveTab(cat)}
            className={`text-[10px] sm:text-xs px-2 py-1 rounded-t-lg font-medium transition-colors ${activeTab === cat ? 'bg-ob-purple/10 text-ob-purple' : 'text-gray-400 hover:text-gray-600'}`}>
            {cat}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-8 gap-0 p-2 overflow-y-auto" style={{ maxHeight: '140px' }}>
        {EMOJI_CATEGORIES[activeTab]?.map((emoji, i) => (
          <button key={i} type="button"
            onMouseDown={(e) => { e.preventDefault(); onSelect(emoji); }}
            className="w-8 h-8 flex items-center justify-center text-lg hover:bg-ob-purple/10 rounded cursor-pointer select-none"
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

  // Detect mobile on mount and resize
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (open) {
      try {
        const userData = localStorage.getItem('ojabridge_session');
        if (userData) {
          const user = JSON.parse(userData);
          if (user?.name) setUserName(user.name.split(' ')[0]);
        }
      } catch {}
    }
  }, [open]);

  useEffect(() => {
    if (open && messages.length === 0) {
      const greeting = userName ? `Hello ${userName}! 👋 Welcome back to OjaBridge!` : "Hello! 👋 Welcome to OjaBridge!";
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `${greeting}\n\nI am your OjaBridge support assistant. I can help you with:\n\nShopping, orders, and payments\nVendor and retailer setup\nKYC verification\nShipping and delivery\nDisputes and refunds\n📸 You can also send screenshots of any issues!\n\nHow can I help you today? 😊`,
      }]);
      setUnread(0);
    }
  }, [open, userName]);

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
          // Send last 5 messages as context for follow-up detection
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
          content: data.error || "Oops! I am having a tiny hiccup right now. 😅 Try again in a moment — I am still here for you!",
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
          className="fixed z-50 w-14 h-14 bg-ob-purple hover:bg-ob-purple-dark text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
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

      {/* Chat Window — Mobile-first responsive */}
      {open && (
        <>
          {/* Mobile backdrop */}
          {isMobile && <div className="fixed inset-0 z-50 bg-black/30" onClick={() => setOpen(false)} />}

          <div
            className="fixed z-50 bg-white shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
            style={isMobile ? {
              bottom: 0, left: 0, right: 0,
              height: 'min(70vh, 520px)',
              maxHeight: '520px',
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
            {/* Header */}
            <div className="bg-ob-navy px-4 py-3 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-ob-purple rounded-full flex items-center justify-center relative">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-ob-navy" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">OjaBridge Support</h3>
                  <p className="text-green-400 text-[10px]">Online • AI Assistant</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white transition-colors p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-gray-50">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3 py-2.5 text-sm leading-relaxed ${msg.role === 'user' ? 'bg-ob-purple text-white rounded-br-md' : 'bg-white text-gray-700 border border-gray-100 shadow-sm rounded-bl-md'}`}>
                    {msg.image && (
                      <div className="mb-2">
                        <img src={msg.image} alt="Attached" className="rounded-lg max-h-32 w-auto object-cover" />
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
                  <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-ob-purple rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-ob-purple rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-ob-purple rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
                  <img src={imagePreview} alt="Preview" className="h-16 rounded-lg object-cover border border-gray-200" />
                  <button onClick={removeImage} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 shadow">×</button>
                </div>
              </div>
            )}

            {/* Emoji Picker */}
            {showEmoji && (
              <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmoji(false)} />
            )}

            {/* Input Area */}
            <div className="px-3 py-2.5 border-t border-gray-100 bg-white flex-shrink-0" style={{ paddingBottom: 'max(0.625rem, env(safe-area-inset-bottom, 0.625rem))' }}>
              <div className="flex items-end gap-1.5">
                <button onClick={() => setShowEmoji(!showEmoji)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors flex-shrink-0 ${showEmoji ? 'bg-ob-purple/10 text-ob-purple' : 'text-gray-400 hover:text-ob-purple hover:bg-gray-100'}`}
                  title="Emoji"
                >
                  <span className="text-lg">😊</span>
                </button>
                <button onClick={() => fileInputRef.current?.click()}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-ob-purple hover:bg-gray-100 transition-colors flex-shrink-0"
                  title="Attach image"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                  placeholder="Type your question..."
                  rows={1}
                  className="flex-1 resize-none border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-ob-purple focus:ring-1 focus:ring-ob-purple/20 outline-none max-h-16"
                  style={{ minHeight: '36px' }}
                />
                <button onClick={sendMessage}
                  disabled={(!input.trim() && !attachedImage) || loading}
                  className="w-9 h-9 bg-ob-purple hover:bg-ob-purple-dark text-white rounded-xl flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
              <p className="text-[9px] text-gray-300 mt-1.5 text-center">OjaBridge AI Support</p>
            </div>
          </div>
        </>
      )}
    </>
  );
}

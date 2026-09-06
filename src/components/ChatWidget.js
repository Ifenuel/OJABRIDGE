'use client';

import { useState, useEffect, useRef } from 'react';

// Common emojis organized by category
const EMOJI_CATEGORIES = [
  { label: 'Smileys', emojis: ['😊', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😉', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '😮', '😯', '😲', '😳', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😱', '😰', '😥', '😓', '🤔', '🤭', '👋', '🤚', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🙏', '💪', '🦾'] },
  { label: 'Hearts', emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝'] },
  { label: 'Objects', emojis: ['🛍️', '🛒', '📦', '💳', '💰', '🏪', '🏬', '🏭', '🔒', '🔑', '📋', '📝', '📊', '📈', '🎯', '⭐', '🌟', '✨', '🎉', '🎊', '🏆', '🥇', '🎁', '🔔', '📢', '📧', '📱', '💻', '🖥️', '🖨️', '📸', '🎥'] },
  { label: 'Flags', emojis: ['🇳🇬', '✅', '❌', '⚠️', '🔴', '🟡', '🟢', '🔵', '⚪', '⬛'] },
];

function EmojiPicker({ onSelect, onClose }) {
  const [activeCategory, setActiveCategory] = useState(0);
  const pickerRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div ref={pickerRef} className="absolute bottom-full left-0 mb-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
      {/* Category tabs */}
      <div className="flex border-b border-gray-100">
        {EMOJI_CATEGORIES.map((cat, i) => (
          <button key={i} onClick={() => setActiveCategory(i)}
            className={`flex-1 py-2 text-[10px] font-medium transition-colors ${activeCategory === i ? 'text-ob-purple border-b-2 border-ob-purple bg-ob-purple/5' : 'text-gray-400 hover:text-gray-600'}`}>
            {cat.label}
          </button>
        ))}
      </div>
      {/* Emoji grid */}
      <div className="p-2 h-48 overflow-y-auto">
        <div className="grid grid-cols-8 gap-0.5">
          {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji, i) => (
            <button key={i} onClick={() => { onSelect(emoji); onClose(); }}
              className="w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-100 rounded transition-colors">
              {emoji}
            </button>
          ))}
        </div>
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
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: "Hello there! 👋 Welcome to OjaBridge! I am your AI assistant and I am here to help you with anything on the platform.\n\nHere are some things I can help with:\n\n✨ How to register or log in\n🛍️ Placing orders & payments\n🏪 Vendor & retailer setup\n📋 KYC verification\n🚚 Shipping & delivery\n💰 Disputes & refunds\n📸 You can also send screenshots of any issues!\n\nFeel free to ask me anything — I am happy to help! 😊",
      }]);
      setUnread(0);
    }
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  // Handle image selection
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('Image must be under 10MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAttachedImage(ev.target.result);
      setImagePreview(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setAttachedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const sendMessage = async () => {
    if ((!input.trim() && !attachedImage) || loading) return;

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim() || (attachedImage ? 'Please look at this screenshot' : ''),
      image: attachedImage || null,
    };

    setMessages(prev => [...prev, userMsg]);
    const messageText = input.trim() || 'Please analyze this image and tell me what you see related to OjaBridge';
    const imageToSend = attachedImage;
    setInput('');
    setAttachedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          conversationId,
          image: imageToSend,
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
          content: data.error || "I am having a small technical hiccup! 😅 Please try again or email us at awoyoemmanuel12@gmail.com",
        }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Oops! Connection issue! 😅 Please check your internet and try again, or email us at awoyoemmanuel12@gmail.com",
      }]);
    }

    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Detect emotion from user messages for empathetic responses
  const detectMood = () => {
    const recentUserMsgs = messages.filter(m => m.role === 'user').slice(-3).map(m => m.content.toLowerCase()).join(' ');
    if (/frustrated|angry|annoyed|terrible|worst|hate|furious|disgusted|scammed|stolen|fraud/i.test(recentUserMsgs)) return 'frustrated';
    if (/confused|confusing|don.t understand|not sure|unclear|what do you mean/i.test(recentUserMsgs)) return 'confused';
    if (/worried|concerned|nervous|scared|afraid|anxious/i.test(recentUserMsgs)) return 'worried';
    if (/happy|great|awesome|love|amazing|perfect|excellent|fantastic/i.test(recentUserMsgs)) return 'happy';
    return null;
  };

  return (
    <>
      {/* Chat Bubble Button */}
      {!open && (
        <button onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-ob-purple hover:bg-ob-purple-dark text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center group"
          title="Chat with OjaBridge AI">
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
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-4rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-ob-navy px-5 py-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-ob-purple rounded-full flex items-center justify-center relative">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-ob-navy" />
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
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-ob-purple text-white rounded-br-md'
                    : 'bg-white text-gray-700 border border-gray-100 shadow-sm rounded-bl-md'
                }`}>
                  {/* Show image if attached */}
                  {msg.image && (
                    <div className="mb-2">
                      <img src={msg.image} alt="Attached" className="rounded-lg max-h-40 w-auto object-cover border border-white/20" />
                    </div>
                  )}
                  <p className="whitespace-pre-wrap">{msg.content}</p>
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
            <div className="px-4 py-2 border-t border-gray-100 bg-white">
              <div className="relative inline-block">
                <img src={imagePreview} alt="Preview" className="h-20 rounded-lg object-cover border border-gray-200" />
                <button onClick={removeImage}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 shadow">
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="px-4 py-3 border-t border-gray-100 bg-white flex-shrink-0">
            {/* Emoji Picker */}
            {showEmoji && (
              <EmojiPicker
                onSelect={(emoji) => setInput(prev => prev + emoji)}
                onClose={() => setShowEmoji(false)}
              />
            )}

            <div className="flex items-end gap-2">
              {/* Emoji button */}
              <button onClick={() => setShowEmoji(!showEmoji)}
                className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors flex-shrink-0 ${showEmoji ? 'bg-ob-purple/10 text-ob-purple' : 'text-gray-400 hover:text-ob-purple hover:bg-gray-100'}`}
                title="Add emoji">
                <span className="text-xl">😊</span>
              </button>

              {/* Image attach button */}
              <button onClick={() => fileInputRef.current?.click()}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-ob-purple hover:bg-gray-100 transition-colors flex-shrink-0"
                title="Attach image">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />

              {/* Text input */}
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your question..."
                rows={1}
                className="flex-1 resize-none border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-ob-purple outline-none max-h-20"
                style={{ minHeight: '42px' }}
              />

              {/* Send button */}
              <button onClick={sendMessage}
                disabled={(!input.trim() && !attachedImage) || loading}
                className="w-10 h-10 bg-ob-purple hover:bg-ob-purple-dark text-white rounded-xl flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <p className="text-[10px] text-gray-300 mt-2 text-center">OjaBridge AI • Send text or images • For help email awoyoemmanuel12@gmail.com</p>
          </div>
        </div>
      )}
    </>
  );
}

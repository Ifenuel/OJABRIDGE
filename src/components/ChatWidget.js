'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * ChatWidget — Floating AI customer care chat bubble
 * Opens a clean conversation interface, sends messages to /api/chat
 * Falls back gracefully when AI is unavailable
 */
export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [unread, setUnread] = useState(1);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Welcome message on first open
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: "Hello there! 👋 Welcome to OjaBridge! I am your AI assistant and I am here to help you with anything with the platform.\n\nHere are some things I can help with:\n\n✨ How to register or log in\n🛍️ Placing orders & payments\n🏪 Vendor & retailer setup\n📋 KYC verification\n🚚 Shipping & delivery\n💰 Disputes & refunds\n\nFeel free to ask me anything — I am happy to help! 😊",
      }]);
      setUnread(0);
    }
  }, [open]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.content,
          conversationId,
        }),
      });

      const data = await res.json();

      if (data.success) {
        const aiMsg = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.reply,
        };
        setMessages(prev => [...prev, aiMsg]);
        if (data.conversationId) setConversationId(data.conversationId);
      } else {
        const errorMsg = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.error || "I'm having trouble connecting. Please try again or email us at awoyoemmanuel12@gmail.com",
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    } catch (err) {
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Network error. Please check your connection and try again, or email us at awoyoemmanuel12@gmail.com",
      };
      setMessages(prev => [...prev, errorMsg]);
    }

    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Chat Bubble Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-ob-purple hover:bg-ob-purple-dark text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center group"
          title="Chat with OjaBridge AI"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unread}
            </span>
          )}
        </button>
      )}

      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[540px] max-h-[calc(100vh-4rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-ob-navy px-5 py-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-ob-purple rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">OjaBridge Support</h3>
                <p className="text-gray-400 text-[10px]">AI Customer Care • Usually replies instantly</p>
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
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-gray-100 bg-white flex-shrink-0">
            <div className="flex items-end gap-2">
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
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="w-10 h-10 bg-ob-purple hover:bg-ob-purple-dark text-white rounded-xl flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <p className="text-[10px] text-gray-300 mt-2 text-center">Powered by OjaBridge AI • For complex issues, email awoyoemmanuel12@gmail.com</p>
          </div>
        </div>
      )}
    </>
  );
}

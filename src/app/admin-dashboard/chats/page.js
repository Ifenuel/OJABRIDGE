'use client';

import { useState, useEffect, useRef } from 'react';

export default function AdminLiveChatsPage() {
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState('all');
  const [adminUser, setAdminUser] = useState(null);
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    try {
      const userData = localStorage.getItem('ojabridge_session');
      if (userData) setAdminUser(JSON.parse(userData));
    } catch {}
  }, []);

  const loadConversations = async () => {
    try {
      const res = await fetch(`/api/admin/live-chat?status=${filter}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) setConversations(data.conversations || []);
    } catch (e) {
      console.error('Failed to load conversations:', e);
    }
    setLoading(false);
  };

  useEffect(() => { loadConversations(); }, [filter]);

  const loadMessages = async (convId) => {
    try {
      const res = await fetch(`/api/admin/live-chat?conversationId=${convId}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) setMessages(data.messages || []);
    } catch (e) {
      console.error('Failed to load messages:', e);
    }
  };

  useEffect(() => {
    if (selectedConv) {
      loadMessages(selectedConv.id);
      // Poll for new messages every 3 seconds
      pollRef.current = setInterval(() => loadMessages(selectedConv.id), 3000);
    }
    return () => clearInterval(pollRef.current);
  }, [selectedConv]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendReply = async () => {
    if (!reply.trim() || sending || !selectedConv) return;
    setSending(true);
    try {
      const res = await fetch('/api/admin/live-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          conversationId: selectedConv.id,
          message: reply.trim(),
          adminUser: { id: adminUser?.id, name: adminUser?.name || 'Support Team' },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReply('');
        loadMessages(selectedConv.id);
        loadConversations();
      }
    } catch (e) {
      console.error('Failed to send reply:', e);
    }
    setSending(false);
  };

  const updateStatus = async (convId, status) => {
    try {
      await fetch('/api/admin/live-chat', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ conversationId: convId, status }),
      });
      loadConversations();
      if (selectedConv?.id === convId) setSelectedConv({ ...selectedConv, status });
    } catch (e) {
      console.error('Failed to update status:', e);
    }
  };

  const statusColors = {
    open: 'bg-green-100 text-green-700',
    active: 'bg-blue-100 text-blue-700',
    closed: 'bg-gray-100 text-gray-500',
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Live Chat Support</h1>
        <p className="text-sm text-gray-500 mt-1">Manage customer support conversations in real-time</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total', count: conversations.length, color: 'text-gray-900' },
          { label: 'Open', count: conversations.filter(c => c.status === 'open').length, color: 'text-green-600' },
          { label: 'Active', count: conversations.filter(c => c.status === 'active').length, color: 'text-blue-600' },
          { label: 'Closed', count: conversations.filter(c => c.status === 'closed').length, color: 'text-gray-500' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-3 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-4" style={{ height: 'calc(100vh - 260px)', minHeight: '400px' }}>
        {/* Conversations List */}
        <div className="w-full lg:w-96 bg-white rounded-xl border border-gray-100 flex flex-col overflow-hidden">
          {/* Filter tabs */}
          <div className="flex border-b border-gray-100 px-2 pt-2">
            {['all', 'open', 'active', 'closed'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-t-lg capitalize transition-colors ${
                  filter === f ? 'bg-ob-purple text-white' : 'text-gray-500 hover:text-gray-700'
                }`}>
                {f}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-400 text-sm">Loading conversations...</div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p>No conversations yet</p>
                <p className="text-xs mt-1">Customer messages will appear here</p>
              </div>
            ) : (
              conversations.map(conv => (
                <button key={conv.id} onClick={() => setSelectedConv(conv)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                    selectedConv?.id === conv.id ? 'bg-ob-purple/5 border-l-2 border-l-ob-purple' : ''
                  }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm text-gray-900 truncate">
                      {conv.user_name || conv.user_email || 'Guest User'}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusColors[conv.status] || statusColors.open}`}>
                      {conv.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{conv.last_message || 'No messages yet'}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-gray-400">{conv.user_role}</span>
                    {conv.unread_count > 0 && (
                      <span className="w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 bg-white rounded-xl border border-gray-100 flex flex-col overflow-hidden">
          {!selectedConv ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="font-medium">Select a conversation</p>
                <p className="text-sm mt-1">Choose a customer chat from the left to start responding</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm text-gray-900">{selectedConv.user_name || 'Guest User'}</h3>
                  <p className="text-xs text-gray-500">{selectedConv.user_email} · {selectedConv.user_role}</p>
                </div>
                <div className="flex items-center gap-2">
                  {selectedConv.status === 'open' && (
                    <button onClick={() => updateStatus(selectedConv.id, 'active')}
                      className="text-xs bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600">
                      Take Chat
                    </button>
                  )}
                  {selectedConv.status !== 'closed' && (
                    <button onClick={() => updateStatus(selectedConv.id, 'closed')}
                      className="text-xs bg-gray-200 text-gray-600 px-3 py-1 rounded-lg hover:bg-gray-300">
                      Close
                    </button>
                  )}
                  {selectedConv.status === 'closed' && (
                    <button onClick={() => updateStatus(selectedConv.id, 'open')}
                      className="text-xs bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600">
                      Reopen
                    </button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50 min-h-0">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.role === 'admin' || msg.role === 'support' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${
                      msg.role === 'admin' || msg.role === 'support'
                        ? 'bg-ob-purple text-white rounded-br-md'
                        : 'bg-white text-gray-700 border border-gray-100 shadow-sm rounded-bl-md'
                    }`}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      <p className={`text-[9px] mt-1 ${msg.role === 'admin' || msg.role === 'support' ? 'text-white/60' : 'text-gray-400'}`}>
                        {msg.senderName || (msg.role === 'user' ? selectedConv.user_name : 'Support')} · {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Input */}
              {selectedConv.status !== 'closed' && (
                <div className="px-4 py-3 border-t border-gray-100 bg-white">
                  <div className="flex items-end gap-2">
                    <textarea value={reply} onChange={e => setReply(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                      placeholder="Type your reply..."
                      rows={1}
                      className="flex-1 resize-none border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-ob-purple focus:ring-1 focus:ring-ob-purple/20 outline-none max-h-20"
                      style={{ minHeight: '38px' }}
                    />
                    <button onClick={sendReply} disabled={!reply.trim() || sending}
                      className="w-9 h-9 bg-ob-purple hover:bg-ob-purple-dark text-white rounded-xl flex items-center justify-center transition-colors disabled:opacity-40 flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
              {selectedConv.status === 'closed' && (
                <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 text-center text-sm text-gray-500">
                  This conversation is closed. <button onClick={() => updateStatus(selectedConv.id, 'open')} className="text-ob-purple underline">Reopen</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

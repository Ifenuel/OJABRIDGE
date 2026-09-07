'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

export default function AdminChatsPage() {
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [convUser, setConvUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => { loadConversations(); }, []);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/chats');
      const data = await res.json();
      if (data.success) setConversations(data.conversations || []);
    } catch (err) { console.error('Failed to load conversations:', err); }
    setLoading(false);
  };

  const loadMessages = async (convId) => {
    setSelectedConv(convId);
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/admin/chats?conversationId=${convId}`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages || []);
        setConvUser(data.user || null);
      }
    } catch (err) { console.error('Failed to load messages:', err); }
    setLoadingMessages(false);
  };

  const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const roleBadge = (role) => {
    const colors = {
      customer: 'bg-blue-100 text-blue-700',
      vendor: 'bg-purple-100 text-purple-700',
      retailer: 'bg-green-100 text-green-700',
      admin: 'bg-red-100 text-red-700',
    };
    return (
      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${colors[role] || 'bg-gray-100 text-gray-600'}`}>
        {role || 'unknown'}
      </span>
    );
  };

  return (
    <DashboardLayout role="admin">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ob-navy">AI Chat Conversations</h1>
        <p className="text-gray-500 text-sm mt-1">Monitor customer conversations with the AI assistant. Review complaints, issues, and support requests.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl border border-gray-100">
          <p className="text-xs text-gray-500">Total Conversations</p>
          <p className="text-xl font-bold text-ob-navy mt-1">{conversations.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100">
          <p className="text-xs text-gray-500">Today</p>
          <p className="text-xl font-bold text-green-600 mt-1">
            {conversations.filter(c => {
              const d = new Date(c.created_at);
              const today = new Date();
              return d.toDateString() === today.toDateString();
            }).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100">
          <p className="text-xs text-gray-500">This Week</p>
          <p className="text-xl font-bold text-blue-600 mt-1">
            {conversations.filter(c => {
              const d = new Date(c.created_at);
              const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
              return d >= weekAgo;
            }).length}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Conversation List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="font-bold text-ob-navy text-sm">Conversations ({conversations.length})</h3>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="p-6 text-center"><div className="w-6 h-6 border-2 border-ob-purple border-t-transparent rounded-full animate-spin mx-auto" /></div>
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">No conversations yet</div>
              ) : (
                conversations.map(conv => (
                  <button key={conv.id} onClick={() => loadMessages(conv.id)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${selectedConv === conv.id ? 'bg-ob-purple/5 border-l-2 border-l-ob-purple' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-ob-navy truncate">
                            {conv.user_name || conv.user_email || 'Anonymous'}
                          </p>
                          {roleBadge(conv.user_actual_role || conv.user_role)}
                        </div>
                        <p className="text-xs text-gray-400 truncate">
                          {conv.user_email || 'No email'}
                        </p>
                        <p className="text-[10px] text-gray-300 mt-1">
                          {conv.message_count || 0} messages · {timeAgo(conv.last_message_at || conv.created_at)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Message View */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {selectedConv ? (
              <>
                {/* Header with user info */}
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-ob-navy text-sm">
                        {convUser?.name || convUser?.email || 'Conversation'}
                      </h3>
                      <p className="text-xs text-gray-400">
                        {convUser?.email} · {convUser?.role || 'unknown role'}
                      </p>
                    </div>
                    <button onClick={() => { setSelectedConv(null); setMessages([]); setConvUser(null); }}
                      className="text-gray-400 hover:text-gray-600 text-sm">
                      Close
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="max-h-[500px] overflow-y-auto p-4 space-y-3">
                  {loadingMessages ? (
                    <div className="p-6 text-center"><div className="w-6 h-6 border-2 border-ob-purple border-t-transparent rounded-full animate-spin mx-auto" /></div>
                  ) : messages.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-sm">No messages in this conversation</div>
                  ) : (
                    messages.map(msg => (
                      <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${msg.role === 'user' ? 'bg-ob-purple text-white' : 'bg-gray-100 text-gray-700'}`}>
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                          <p className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-white/60' : 'text-gray-400'}`}>
                            {new Date(msg.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-sm">Select a conversation to view messages</p>
                <p className="text-xs text-gray-300 mt-1">Click any conversation from the list on the left</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

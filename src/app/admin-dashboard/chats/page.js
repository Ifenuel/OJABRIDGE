'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

export default function AdminChatsPage() {
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
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
      if (data.success) setMessages(data.messages || []);
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

  return (
    <DashboardLayout role="admin">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ob-navy">AI Chat Conversations</h1>
        <p className="text-gray-500 text-sm mt-1">Monitor customer conversations with the AI assistant.</p>
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
            <div className="max-h-[500px] overflow-y-auto">
              {loading ? (
                <div className="p-6 text-center"><div className="w-6 h-6 border-2 border-ob-purple border-t-transparent rounded-full animate-spin mx-auto" /></div>
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">No conversations yet</div>
              ) : (
                conversations.map(conv => (
                  <button key={conv.id} onClick={() => loadMessages(conv.id)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${selectedConv === conv.id ? 'bg-ob-purple/5 border-l-2 border-l-ob-purple' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-ob-navy truncate">Conversation</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(conv.created_at)}</p>
                      </div>
                      <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{conv.message_count || '?'} msgs</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Messages View */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden min-h-[500px]">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="font-bold text-ob-navy text-sm">
                {selectedConv ? 'Conversation Details' : 'Select a conversation'}
              </h3>
            </div>
            <div className="p-4 max-h-[500px] overflow-y-auto">
              {loadingMessages ? (
                <div className="text-center py-12"><div className="w-6 h-6 border-2 border-ob-purple border-t-transparent rounded-full animate-spin mx-auto" /></div>
              ) : !selectedConv ? (
                <div className="text-center py-12 text-gray-400 text-sm">Click a conversation on the left to view messages</div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">No messages in this conversation</div>
              ) : (
                <div className="space-y-4">
                  {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                        msg.role === 'user'
                          ? 'bg-ob-purple/10 text-ob-navy rounded-br-md'
                          : 'bg-gray-50 text-gray-700 border border-gray-100 rounded-bl-md'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-semibold ${msg.role === 'user' ? 'text-ob-purple' : 'text-green-600'}`}>
                            {msg.role === 'user' ? '👤 User' : '🤖 AI'}
                          </span>
                          <span className="text-[9px] text-gray-300">
                            {new Date(msg.created_at).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {msg.image_url && (
                          <div className="mb-2"><img src={msg.image_url} alt="User image" className="rounded-lg max-h-32 object-cover" /></div>
                        )}
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

function AdminLiveChatsPage() {
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [tab, setTab] = useState('all');
  const [adminUser, setAdminUser] = useState(null);
  const [hasAssignedChats, setHasAssignedChats] = useState(false);

  // Role flags computed from current adminUser so they are stable across renders.
  // Declared once near the top so statusForTab and the JSX can use them safely.
  const isSuperAdmin = adminUser?.role === 'admin';
  const isLiveSupportSubAdmin = adminUser?.role === 'sub_admin'
    && Array.isArray(adminUser?.permissions || [])
    && adminUser.permissions.includes('live-chats');

  // Role-aware tab model.
  // Super Admin: All / Open / Active / Closed
  // Live Support Sub Admin: My Chats / Unassigned / All
  const tabs = (() => {
    try {
      if (isSuperAdmin) {
        return [{ key: 'all', label: 'All' }, { key: 'open', label: 'Open' }, { key: 'active', label: 'Active' }, { key: 'closed', label: 'Closed' }];
      }
      if (isLiveSupportSubAdmin) {
        return [{ key: 'my', label: 'My Chats' }, { key: 'unassigned', label: 'Unassigned' }, { key: 'all', label: 'All' }];
      }
      return [{ key: 'all', label: 'All' }];
    } catch (e) {
      console.error('[AdminLiveChats] tab model error:', e);
      return [{ key: 'all', label: 'All' }];
    }
  })();

  // Map the visible tab to the status value the backend already understands.
  const statusForTab = (tabKey) => {
    try {
      if (isSuperAdmin) return tabKey === 'all' ? 'all' : tabKey;
      if (isLiveSupportSubAdmin) {
        if (tabKey === 'all') return 'all';
        if (tabKey === 'unassigned') return 'open'; // backend filters assigned_to IS NULL on open
        return 'all'; // 'my' relies on backend assigned_to filter
      }
      return 'all';
    } catch (e) {
      console.error('[AdminLiveChats] statusForTab error:', e);
      return 'all';
    }
  };
  const [availableAgents, setAvailableAgents] = useState([]);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [assignMenuOpen, setAssignMenuOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    try {
      const userData = localStorage.getItem('ojabridge_session');
      if (userData) setAdminUser(JSON.parse(userData));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      if (isLiveSupportSubAdmin) {
        setTab(hasAssignedChats ? 'my' : 'unassigned');
      } else {
        setTab('all');
      }
    } catch (e) {
      console.error('[AdminLiveChats] tab effect error:', e);
      setTab('all');
    }
  }, [adminUser, isLiveSupportSubAdmin, hasAssignedChats]);

  const loadAgents = async () => {
    if (!assignMenuOpen) return;
    setAgentsLoading(true);
    try {
      const res = await fetch('/api/admin/sub-admins/live-chat-support', { credentials: 'include' });
      const data = await res.json();
      if (data.success) setAvailableAgents(data.subAdmins || []);
    } catch (e) {
      console.error('Failed to load live chat support agents:', e);
    }
    setAgentsLoading(false);
  };

  let loadConversationsPrev = loadConversations;
  const loadConversations = async () => {
    try {
      const res = await fetch(`/api/admin/live-chat?status=${statusForTab(tab)}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) setConversations(data.conversations || []);
    } catch (e) {
      console.error('Failed to load conversations:', e);
    }
    setLoading(false);
  };
  loadConversationsPrev = loadConversations;

  useEffect(() => { loadConversations(); }, [tab]);

  useEffect(() => {
    try {
      if (!isLiveSupportSubAdmin) {
        setHasAssignedChats(false);
        return;
      }
      const yes = conversations.some(c => c.assigned_to && (c.assigned_to === adminUser?.id || c.assigned_to_name));
      setHasAssignedChats(!!yes);
    } catch (e) {
      console.error('[AdminLiveChats] hasAssignedChats error:', e);
      setHasAssignedChats(false);
    }
  }, [conversations, adminUser, isLiveSupportSubAdmin]);

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

  const assignToAgent = async (agentId) => {
    if (!selectedConv || assigning) return;
    setAssigning(true);
    try {
      await fetch('/api/admin/live-chat', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          conversationId: selectedConv.id,
          assignedTo: agentId,
        }),
      });
      setSelectedConv({ ...selectedConv, assigned_to: agentId });
      loadConversations();
    } catch (e) {
      console.error('Failed to assign conversation:', e);
    }
    setAssigning(false);
    setAssignMenuOpen(false);
  };

  const assignToMe = async (convId) => {
    if (assigning) return;
    setAssigning(true);
    try {
      // Only active live-chats sub-admins can claim a chat.
      const me = adminUser;
      if (!me) throw new Error('Not authenticated');
      await fetch('/api/admin/live-chat', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          conversationId: convId,
          assignedTo: me.id,
        }),
      });
      setConversations(prev => prev.map(c => (c.id === convId ? { ...c, assigned_to: me.id } : c)));
      if (selectedConv?.id === convId) setSelectedConv({ ...selectedConv, assigned_to: me.id });
    } catch (e) {
      console.error('Failed to assign conversation to me:', e);
    }
    setAssigning(false);
  };

  const unassignConversation = async () => {
    if (!selectedConv || assigning) return;
    setAssigning(true);
    try {
      await fetch('/api/admin/live-chat', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          conversationId: selectedConv.id,
          assignedTo: null,
        }),
      });
      setSelectedConv({ ...selectedConv, assigned_to: null });
      loadConversations();
    } catch (e) {
      console.error('Failed to unassign conversation:', e);
    }
    setAssigning(false);
    setAssignMenuOpen(false);
  };

  const statusColors = {
    open: 'bg-green-100 text-green-700',
    active: 'bg-blue-100 text-blue-700',
    closed: 'bg-gray-100 text-gray-500',
  };

  const assignedAgent = selectedConv?.assigned_to
    ? availableAgents.find(a => a.id === selectedConv.assigned_to || a.userId === selectedConv.assigned_to)
    : null;

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

      <div className="flex flex-col lg:flex-row gap-4 lg:h-[calc(100dvh-220px)] lg:min-h-[400px]">
        {/* Conversations List */}
        <div className="w-full lg:w-96 lg:flex-none bg-white rounded-xl border border-gray-100 flex flex-col overflow-hidden max-h-[60dvh] lg:max-h-none">
          {/* Filter tabs */}
              <div className="flex border-b border-gray-100 px-2 pt-2 overflow-x-auto">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-t-lg capitalize transition-colors whitespace-nowrap ${
                  tab === t.key ? 'bg-ob-purple text-white' : 'text-gray-500 hover:text-gray-700'
                }`}>
                {t.label}
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
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400">{conv.user_role}</span>
                      {conv.assigned_to && (
                        <span className="text-[10px] text-ob-purple bg-ob-purple/10 px-1.5 py-0.5 rounded-full truncate max-w-[120px]" title={conv.assigned_to_name || 'Assigned'}>
                          {conv.assigned_to_name || 'Assigned'}
                        </span>
                      )}
                      {!conv.assigned_to && (
                        <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">Unassigned</span>
                      )}
                    </div>
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
        <div className="flex-1 min-h-[50dvh] lg:min-h-0 bg-white rounded-xl border border-gray-100 flex flex-col overflow-hidden">
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
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <h3 className="font-semibold text-sm text-gray-900">{selectedConv.user_name || 'Guest User'}</h3>
                  <p className="text-xs text-gray-500">{selectedConv.user_email} · {selectedConv.user_role}</p>
                </div>
                <div className="flex items-center gap-2">
                  {/* Assign-to control — only shown to Super Admin */}
                  {isSuperAdmin && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => { setAssignMenuOpen(prev => !prev); if (!prev) loadAgents(); }}
                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-lg flex items-center gap-1.5 transition-colors"
                        title="Assign to a support agent"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Assign
                        {assignedAgent ? ` (${assignedAgent.name})` : ' to...'}
                      </button>
                      {assignMenuOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setAssignMenuOpen(false)} />
                          <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                            <div className="px-3 py-2 border-b border-gray-100">
                              <p className="text-xs font-medium text-gray-500">Assign to support agent</p>
                            </div>
                            {agentsLoading ? (
                              <div className="p-3 text-center text-xs text-gray-400">Loading agents...</div>
                            ) : availableAgents.length === 0 ? (
                              <div className="p-3 text-xs text-gray-500 text-center">No active live chat agents</div>
                            ) : (
                              <div className="max-h-52 overflow-y-auto">
                              {(() => {
                                try {
                                  return availableAgents.map(agent => {
                                    const isAssigned = agent.id === selectedConv.assigned_to || agent.userId === selectedConv.assigned_to;
                                    return (
                                      <button
                                        key={agent.id}
                                        type="button"
                                        onClick={() => assignToAgent(agent.id)}
                                        disabled={assigning || isAssigned}
                                        className={
                                          `w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors flex items-center justify-between ` +
                                          (isAssigned
                                            ? 'bg-ob-purple/10 text-ob-purple font-medium'
                                            : 'text-gray-700'
                                          ) +
                                          ' disabled:opacity-50 disabled:cursor-not-allowed'
                                        }
                                      >
                                        <span className="truncate">{agent?.name || 'Agent'}</span>
                                        {isAssigned
                                          ? <svg className="w-3.5 h-3.5 text-ob-purple flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                          : null}
                                      </button>
                                    );
                                  });
                                } catch (e) {
                                  console.error('[AdminLiveChats] agents render error:', e);
                                  return <div className="px-3 py-2 text-xs text-red-600">Agents unavailable</div>;
                                }
                              })()}
                              <button
                                type="button"
                                onClick={unassignConversation}
                                disabled={assigning || !selectedConv.assigned_to}
                                className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Remove assignment
                              </button>
                            </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                  {selectedConv.status === 'open' && !selectedConv.assigned_to && isLiveSupportSubAdmin && (
                    <button
                      onClick={() => assignToMe(selectedConv.id)}
                      disabled={assigning}
                      className="text-xs bg-ob-purple text-white px-3 py-1 rounded-lg hover:bg-ob-purple-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Assign to me
                    </button>
                  )}
                  {selectedConv.status === 'open' && isSuperAdmin && (
                    <button onClick={() => updateStatus(selectedConv.id, 'active')}
                      className="text-xs bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600"
                    >
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
                {(() => {
                  try {
                    return messages.map(msg => (
                      <div key={msg.id} className={`flex ${msg.role === 'admin' || msg.role === 'support' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${
                          msg.role === 'admin' || msg.role === 'support'
                            ? 'bg-ob-purple text-white rounded-br-md'
                            : 'bg-white text-gray-700 border border-gray-100 shadow-sm rounded-bl-md'
                        }`}>
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                          <p className={`text-[9px] mt-1 ${msg.role === 'admin' || msg.role === 'support' ? 'text-white/60' : 'text-gray-400'}`}>
                            {msg.senderName || (msg.role === 'user' ? selectedConv?.user_name : 'Support')} · {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </p>
                        </div>
                      </div>
                    ));
                  } catch (e) {
                    console.error('[AdminLiveChats] messages render error:', e);
                    return <div className="text-sm text-red-600">Messages unavailable</div>;
                  }
                })()}
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

function AdminLiveChatsWrapped() {
  return (
    <DashboardLayout role="admin" requiredPermission="live-chats">
      <AdminLiveChatsPage />
    </DashboardLayout>
  );
}

export default AdminLiveChatsWrapped;

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';

export default function CustomerDisputesPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [disputes, setDisputes] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Create form
  const [createForm, setCreateForm] = useState({
    order_id: '',
    reason: 'product_not_received',
    description: '',
    amount: '',
  });
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/login');
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (!user) return;
    async function load() {
      try {
        const [dispRes, ordersRes] = await Promise.allSettled([
          fetch('/api/disputes', { credentials: 'include' }).then(r => r.json()),
          fetch('/api/orders?limit=50', { credentials: 'include' }).then(r => r.json()),
        ]);
        if (dispRes.status === 'fulfilled' && dispRes.value.success) {
          setDisputes(dispRes.value.disputes || []);
        }
        if (ordersRes.status === 'fulfilled' && ordersRes.value.success) {
          setOrders(ordersRes.value.orders || []);
        }
      } catch (err) {
        console.error('Failed to load disputes:', err);
      }
      setLoadingData(false);
    }
    load();
  }, [user]);

  const handleCreateDispute = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(createForm),
      });
      const data = await res.json();
      if (data.success) {
        setDisputes(prev => [data.dispute, ...prev]);
        setShowCreate(false);
        setCreateForm({ order_id: '', reason: 'product_not_received', description: '', amount: '' });
      }
    } catch (err) {
      console.error('Failed to create dispute:', err);
    }
    setSubmitting(false);
  };

  const handleSendMessage = async (disputeId) => {
    if (!newMessage.trim()) return;
    try {
      const res = await fetch('/api/disputes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ dispute_id: disputeId, message: newMessage }),
      });
      const data = await res.json();
      if (data.success) {
        setDisputes(prev => prev.map(d => 
          d.id === disputeId ? { ...d, messages: [...(d.messages || []), { sender: 'customer', message: newMessage, created_at: new Date().toISOString() }] } : d
        ));
        setNewMessage('');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const statusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-yellow-100 text-yellow-700';
      case 'under_review': return 'bg-blue-100 text-blue-700';
      case 'resolved': return 'bg-green-100 text-green-700';
      case 'closed': return 'bg-gray-100 text-gray-600';
      case 'escalated': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const reasonLabel = (reason) => {
    const labels = {
      product_not_received: 'Product Not Received',
      product_damaged: 'Product Damaged',
      product_not_as_described: 'Not As Described',
      wrong_item: 'Wrong Item Received',
      quality_issue: 'Quality Issue',
      seller_unresponsive: 'Seller Unresponsive',
      other: 'Other',
    };
    return labels[reason] || reason;
  };

  if (loading) return (
    <div className="min-h-screen bg-ob-light flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-ob-purple border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!isAuthenticated || !user) return null;

  return (
    <DashboardLayout role="customer" showSidebar={false}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ob-navy">My Disputes</h1>
          <p className="text-gray-500 text-sm mt-1">Manage and track your dispute cases</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="bg-ob-purple text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-ob-purple-dark transition-colors inline-flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Open New Dispute
        </button>
      </div>

      {/* Create Dispute Form */}
      {showCreate && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 mb-6">
          <h2 className="text-lg font-bold text-ob-navy mb-4">Open a Dispute</h2>
          <form onSubmit={handleCreateDispute} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Related Order *</label>
                <select
                  required
                  value={createForm.order_id}
                  onChange={e => setCreateForm({ ...createForm, order_id: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none"
                >
                  <option value="">Select an order</option>
                  {orders.map(o => (
                    <option key={o.id} value={o.id}>{o.order_number} — ₦{Number(o.total || 0).toLocaleString()}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
                <select
                  required
                  value={createForm.reason}
                  onChange={e => setCreateForm({ ...createForm, reason: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none"
                >
                  <option value="product_not_received">Product Not Received</option>
                  <option value="product_damaged">Product Damaged</option>
                  <option value="product_not_as_described">Not As Described</option>
                  <option value="wrong_item">Wrong Item Received</option>
                  <option value="quality_issue">Quality Issue</option>
                  <option value="seller_unresponsive">Seller Unresponsive</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount Involved (₦)</label>
              <input
                type="number"
                value={createForm.amount}
                onChange={e => setCreateForm({ ...createForm, amount: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none"
                placeholder="e.g. 15000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea
                required
                rows={4}
                value={createForm.description}
                onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none resize-none"
                placeholder="Describe the issue in detail. Include what happened, when, and what resolution you're seeking..."
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={submitting} className="bg-ob-purple text-white px-6 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50">
                {submitting ? 'Submitting...' : 'Submit Dispute'}
              </button>
              <button type="button" onClick={() => setShowCreate(false)} className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Disputes List */}
      {loadingData ? (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-ob-purple border-t-transparent rounded-full mx-auto" />
        </div>
      ) : disputes.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="font-bold text-ob-navy mb-2">No disputes yet</h3>
          <p className="text-gray-400 text-sm mb-4">You haven&apos;t opened any dispute cases.</p>
          <Link href="/account/orders" className="text-ob-purple text-sm font-medium hover:underline">View your orders →</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {disputes.map(dispute => (
            <div key={dispute.id} className="bg-white p-6 rounded-2xl border border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-ob-navy">Dispute #{(dispute.id || '').slice(-8).toUpperCase()}</h3>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${statusColor(dispute.status)}`}>
                      {(dispute.status || 'open').replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm mt-1">
                    {reasonLabel(dispute.reason)} • Opened {new Date(dispute.created_at).toLocaleDateString()}
                  </p>
                </div>
                {dispute.amount && (
                  <span className="text-lg font-bold text-ob-navy">₦{Number(dispute.amount).toLocaleString()}</span>
                )}
              </div>

              <p className="text-gray-600 text-sm mb-4">{dispute.description}</p>

              {/* Messages */}
              {dispute.messages && dispute.messages.length > 0 && (
                <div className="border-t border-gray-100 pt-4 mt-4 space-y-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Messages</p>
                  {dispute.messages.map((msg, idx) => (
                    <div key={idx} className={`p-3 rounded-lg ${msg.sender === 'customer' ? 'bg-ob-purple/5 ml-8' : 'bg-gray-50 mr-8'}`}>
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        {msg.sender === 'customer' ? 'You' : msg.sender === 'admin' ? 'OjaBridge Support' : 'Vendor'}
                        {' • '}{new Date(msg.created_at).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-700">{msg.message}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply */}
              {dispute.status !== 'closed' && dispute.status !== 'resolved' && (
                <div className="border-t border-gray-100 pt-4 mt-4 flex gap-2">
                  <input
                    type="text"
                    value={selectedDispute === dispute.id ? newMessage : ''}
                    onFocus={() => setSelectedDispute(dispute.id)}
                    onChange={e => { setSelectedDispute(dispute.id); setNewMessage(e.target.value); }}
                    placeholder="Type a reply..."
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none"
                    onKeyDown={e => { if (e.key === 'Enter') handleSendMessage(dispute.id); }}
                  />
                  <button
                    onClick={() => handleSendMessage(dispute.id)}
                    disabled={!newMessage.trim() || selectedDispute !== dispute.id}
                    className="bg-ob-purple text-white px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    Send
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

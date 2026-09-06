'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';

export default function VendorDisputesPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [disputes, setDisputes] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/login');
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (!user) return;
    async function load() {
      try {
        const res = await fetch('/api/disputes', { credentials: 'include' }).then(r => r.json());
        if (res.success) setDisputes(res.disputes || []);
      } catch (err) { console.error('Failed to load disputes:', err); }
      setLoadingData(false);
    }
    load();
  }, [user]);

  const handleSendMessage = async (disputeId) => {
    if (!newMessage.trim()) return;
    try {
      const res = await fetch('/api/disputes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ dispute_id: disputeId, message: newMessage, sender: 'vendor' }),
      });
      const data = await res.json();
      if (data.success) {
        setDisputes(prev => prev.map(d =>
          d.id === disputeId ? { ...d, messages: [...(d.messages || []), { sender: 'vendor', message: newMessage, created_at: new Date().toISOString() }] } : d
        ));
        setNewMessage('');
      }
    } catch (err) { console.error('Failed to send message:', err); }
  };

  const statusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-yellow-100 text-yellow-700';
      case 'under_review': return 'bg-blue-100 text-blue-700';
      case 'vendor_response_required': return 'bg-orange-100 text-orange-700';
      case 'resolved': case 'resolved_favor_buyer': case 'resolved_favor_vendor': return 'bg-green-100 text-green-700';
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
    <DashboardLayout role="vendor">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ob-navy">Disputes Against My Products</h1>
        <p className="text-gray-500 text-sm mt-1">Review and respond to customer/retailer disputes</p>
      </div>

      {loadingData ? (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-ob-purple border-t-transparent rounded-full mx-auto" />
        </div>
      ) : disputes.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="font-bold text-ob-navy mb-2">No disputes</h3>
          <p className="text-gray-400 text-sm">No disputes have been filed against your products. Keep up the great work! 🎉</p>
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
                      {(dispute.status || 'open').replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm mt-1">
                    {reasonLabel(dispute.reason)} • Opened {new Date(dispute.created_at).toLocaleDateString()}
                  </p>
                </div>
                {dispute.status === 'vendor_response_required' && (
                  <span className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-medium">
                    ⚠️ Response Required
                  </span>
                )}
              </div>

              <p className="text-gray-600 text-sm mb-4">{dispute.description}</p>

              {dispute.messages && dispute.messages.length > 0 && (
                <div className="border-t border-gray-100 pt-4 mt-4 space-y-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Messages</p>
                  {dispute.messages.map((msg, idx) => (
                    <div key={idx} className={`p-3 rounded-lg ${msg.sender === 'vendor' ? 'bg-ob-purple/5 ml-8' : 'bg-gray-50 mr-8'}`}>
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        {msg.sender === 'vendor' ? 'You' : msg.sender === 'admin' ? 'OjaBridge Support' : 'Customer'}
                        {' • '}{new Date(msg.created_at).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-700">{msg.message}</p>
                    </div>
                  ))}
                </div>
              )}

              {dispute.status !== 'closed' && dispute.status !== 'resolved' && dispute.status !== 'resolved_favor_buyer' && dispute.status !== 'resolved_favor_vendor' && (
                <div className="border-t border-gray-100 pt-4 mt-4 flex gap-2">
                  <input type="text"
                    value={selectedDispute === dispute.id ? newMessage : ''}
                    onFocus={() => setSelectedDispute(dispute.id)}
                    onChange={e => { setSelectedDispute(dispute.id); setNewMessage(e.target.value); }}
                    placeholder="Respond to this dispute..."
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none"
                    onKeyDown={e => { if (e.key === 'Enter') handleSendMessage(dispute.id); }}
                  />
                  <button onClick={() => handleSendMessage(dispute.id)}
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

'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

export default function VendorAnalyticsPage() {
  const [period, setPeriod] = useState('30d');

  const monthlyData = [
    { month: 'Jan', revenue: 120000, orders: 15 },
    { month: 'Feb', revenue: 180000, orders: 22 },
    { month: 'Mar', revenue: 250000, orders: 31 },
    { month: 'Apr', revenue: 320000, orders: 40 },
    { month: 'May', revenue: 450000, orders: 56 },
    { month: 'Jun', revenue: 380000, orders: 48 },
    { month: 'Jul', revenue: 520000, orders: 65 },
    { month: 'Aug', revenue: 410000, orders: 52 },
  ];
  const maxRevenue = Math.max(...monthlyData.map(d => d.revenue));

  return (
    <DashboardLayout role="vendor">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ob-navy">Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">Insights into your store performance and sales trends.</p>
        </div>
        <div className="flex gap-2">
          {['7d', '30d', '90d', '12m'].map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${period === p ? 'bg-ob-purple text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
              {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : p === '90d' ? '90 Days' : '12 Months'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Revenue', value: '₦0', change: 'Start selling to see data', color: 'text-ob-purple' },
          { label: 'Orders', value: '0', change: 'No orders yet', color: 'text-blue-600' },
          { label: 'Conversion Rate', value: '0%', change: 'Based on product views', color: 'text-ob-lime-dark' },
          { label: 'Avg Order Value', value: '₦0', change: 'Average basket size', color: 'text-amber-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-gray-100">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.change}</p>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 mb-8">
        <h3 className="font-bold text-ob-navy mb-6">Revenue Trend</h3>
        <div className="flex items-end justify-between h-48 px-4">
          {monthlyData.map((d, i) => (
            <div key={i} className="flex flex-col items-center flex-1 max-w-16">
              <span className="text-[10px] text-gray-400 mb-1">₦{(d.revenue / 1000).toFixed(0)}k</span>
              <div className="w-full bg-ob-purple/10 rounded-t relative" style={{ height: `${(d.revenue / maxRevenue) * 140}px` }}>
                <div className="absolute bottom-0 w-full bg-ob-purple rounded-t transition-all duration-500" style={{ height: '100%' }} />
              </div>
              <span className="text-[10px] text-gray-400 mt-1">{d.month}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white p-6 rounded-xl border border-gray-100">
          <h3 className="font-bold text-ob-navy mb-4">Top Products</h3>
          <p className="text-gray-400 text-sm text-center py-8">Product performance data will appear here once you have sales.</p>
        </div>

        {/* Traffic Sources */}
        <div className="bg-white p-6 rounded-xl border border-gray-100">
          <h3 className="font-bold text-ob-navy mb-4">Traffic Sources</h3>
          <p className="text-gray-400 text-sm text-center py-8">Visitor analytics will appear here once your store receives traffic.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}

'use client';

import DashboardLayout from '@/components/DashboardLayout';

export default function RetailerAnalyticsPage() {
  return (
    <DashboardLayout role="retailer">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ob-navy">Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">Insights into your sourcing and purchase activity.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">📊</span>
        </div>
        <h2 className="text-lg font-bold text-ob-navy mb-2">Analytics Coming Soon</h2>
        <p className="text-gray-500 text-sm max-w-md mx-auto">
          Purchase trends, vendor performance, and sourcing insights will appear here once you start ordering.
        </p>
      </div>
    </DashboardLayout>
  );
}

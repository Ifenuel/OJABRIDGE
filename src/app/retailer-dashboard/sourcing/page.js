'use client';

import DashboardLayout from '@/components/DashboardLayout';

export default function RetailerSourcingPage() {
  return (
    <DashboardLayout role="retailer">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ob-navy">Product Sourcing</h1>
        <p className="text-gray-500 text-sm mt-1">Request specific products from verified vendors.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🔍</span>
        </div>
        <h2 className="text-lg font-bold text-ob-navy mb-2">Coming Soon</h2>
        <p className="text-gray-500 text-sm max-w-md mx-auto">
          Product sourcing requests will allow you to tell vendors exactly what you need, and they can offer competitive pricing.
        </p>
      </div>
    </DashboardLayout>
  );
}

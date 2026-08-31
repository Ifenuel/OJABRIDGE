'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';

// In production, this fetches from the API using the order ID
// Tracking flow
const sampleOrders = {
  'OBJ-20250828-A1B2C3': {
    id: 'OBJ-20250828-A1B2C3',
    status: 'delivered',
    customerName: 'Chioma Okafor',
    vendorName: 'Luxe Collection',
    items: [{ name: 'Luxury Handbag', quantity: 1, price: 28500 }],
    total: 30500,
    currency: '₦',
    timeline: [
      { status: 'Order Placed', date: 'May 24, 2025', time: '10:15 AM', completed: true },
      { status: 'Payment Confirmed', date: 'May 24, 2025', time: '10:17 AM', completed: true },
      { status: 'Packed', date: 'May 24, 2025', time: '2:45 PM', completed: true },
      { status: 'Shipped', date: 'May 25, 2025', time: '9:30 AM', completed: true },
      { status: 'Out for Delivery', date: 'May 26, 2025', time: '8:15 AM', completed: true },
      { status: 'Delivered', date: 'May 26, 2025', time: '12:35 PM', completed: true },
    ],
  },
};

export default function OrderTrackingPage() {
  const params = useParams();
  const orderId = params.id;

  // In production: fetch order from API
  const order = sampleOrders[orderId] || {
    id: orderId,
    status: 'processing',
    items: [{ name: 'Product', quantity: 1, price: 0 }],
    total: 0,
    currency: '₦',
    timeline: [
      { status: 'Order Placed', date: new Date().toLocaleDateString(), time: new Date().toLocaleTimeString(), completed: true },
      { status: 'Payment Confirmed', date: null, time: null, completed: false },
      { status: 'Packed', date: null, time: null, completed: false },
      { status: 'Shipped', date: null, time: null, completed: false },
      { status: 'Out for Delivery', date: null, time: null, completed: false },
      { status: 'Delivered', date: null, time: null, completed: false },
    ],
  };

  const currentStepIndex = order.timeline.findIndex(s => !s.completed);

  return (
    <>
      <section className="bg-ob-navy text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-gray-400 text-sm mb-2">
            <Link href="/" className="hover:text-ob-lime">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/shop" className="hover:text-ob-lime">Shop</Link>
            <span className="mx-2">/</span>
            <span className="text-white">Track Order</span>
          </p>
          <h1 className="text-3xl font-bold">Track Your Order</h1>
          <p className="text-gray-300 mt-2">Order ID: <span className="text-ob-lime font-mono">{orderId}</span></p>
        </div>
      </section>

      <section className="section-padding bg-ob-light">
        <div className="max-w-4xl mx-auto">
          {/* Order Status Banner */}
          <div className={`rounded-2xl p-6 mb-8 ${
            order.status === 'delivered' ? 'bg-green-50 border border-green-200' :
            order.status === 'shipped' ? 'bg-blue-50 border border-blue-200' :
            'bg-amber-50 border border-amber-200'
          }`}>
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                order.status === 'delivered' ? 'bg-green-100' :
                order.status === 'shipped' ? 'bg-blue-100' : 'bg-amber-100'
              }`}>
                {order.status === 'delivered' ? (
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                ) : order.status === 'shipped' ? (
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 17l4 4 4-4m-6-8l4 4-4-4" /></svg>
                ) : (
                  <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                )}
              </div>
              <div>
                <h2 className={`text-xl font-bold ${
                  order.status === 'delivered' ? 'text-green-800' :
                  order.status === 'shipped' ? 'text-blue-800' : 'text-amber-800'
                }`}>
                  {order.status === 'delivered' ? 'Order Delivered Successfully' :
                   order.status === 'shipped' ? 'Order Shipped — On Its Way!' :
                   order.status === 'processing' ? 'Order Is Being Prepared' :
                   'Order Confirmed'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {order.status === 'delivered' ? 'Your order has been delivered. Enjoy your purchase!' :
                   order.status === 'shipped' ? 'Estimated delivery: 2-5 business days' :
                   'Your order is being processed by the vendor'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Tracking Timeline */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <h3 className="font-bold text-ob-navy mb-6">Order Timeline</h3>
                <div className="space-y-0">
                  {order.timeline.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-4 relative">
                      {/* Vertical line */}
                      {idx < order.timeline.length - 1 && (
                        <div className={`absolute left-5 top-10 w-0.5 h-12 ${
                          step.completed ? 'bg-green-400' : 'bg-gray-200'
                        }`} />
                      )}
                      {/* Circle */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 relative z-10 ${
                        step.completed ? 'bg-green-100' : idx === currentStepIndex ? 'bg-ob-purple/10 border-2 border-ob-purple' : 'bg-gray-100'
                      }`}>
                        {step.completed ? (
                          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        ) : idx === currentStepIndex ? (
                          <div className="w-3 h-3 bg-ob-purple rounded-full animate-pulse" />
                        ) : (
                          <div className="w-3 h-3 bg-gray-300 rounded-full" />
                        )}
                      </div>
                      {/* Content */}
                      <div className={`pb-8 ${step.completed ? '' : 'opacity-50'}`}>
                        <p className={`font-semibold text-sm ${step.completed ? 'text-ob-navy' : 'text-gray-400'}`}>{step.status}</p>
                        {step.date ? (
                          <p className="text-xs text-gray-500 mt-0.5">{step.date} | {step.time}</p>
                        ) : (
                          <p className="text-xs text-gray-400 mt-0.5">Pending</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Details Sidebar */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <h3 className="font-bold text-ob-navy mb-4">Order Details</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Order ID</span><span className="font-mono font-medium text-ob-navy">{orderId}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Date</span><span className="text-ob-navy">{order.timeline[0]?.date || 'N/A'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Status</span><span className={`font-medium capitalize ${order.status === 'delivered' ? 'text-green-600' : 'text-ob-purple'}`}>{order.status}</span></div>
                  {order.vendorName && <div className="flex justify-between"><span className="text-gray-500">Vendor</span><span className="text-ob-navy">{order.vendorName}</span></div>}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <h3 className="font-bold text-ob-navy mb-4">Items</h3>
                <div className="space-y-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-50">
                      <div>
                        <p className="text-sm font-medium text-ob-navy">{item.name}</p>
                        <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                      </div>
                      <span className="text-sm font-semibold text-ob-navy">{order.currency}{item.price.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between pt-3 border-t border-gray-100">
                  <span className="font-bold text-ob-navy">Total</span>
                  <span className="font-bold text-ob-navy">{order.currency}{order.total.toLocaleString()}</span>
                </div>
              </div>

              <div className="bg-ob-light rounded-2xl p-6 border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-ob-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span className="font-semibold text-ob-navy text-sm">Need Help?</span>
                </div>
                <p className="text-xs text-gray-500 mb-3">Contact our support team about this order.</p>
                <Link href="/support" className="block text-center bg-white border border-gray-200 rounded-lg py-2 text-sm font-medium text-ob-purple hover:border-ob-purple transition-colors">
                  Contact Support
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

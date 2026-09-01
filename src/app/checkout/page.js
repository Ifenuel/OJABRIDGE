'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';

export default function CheckoutPage() {
  const { user, isAuthenticated } = useAuth();
  const { items: cartItems, clearCart, updateQuantity, removeItem } = useCart();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [currency, setCurrency] = useState('NGN');
  const [paymentMethod, setPaymentMethod] = useState('paystack');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  const [error, setError] = useState('');

  const [shipping, setShipping] = useState({
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'NG',
  });

  const currencies = {
    NGN: { symbol: '₦', rate: 1, active: true },
    USD: { symbol: '$', rate: 0.0012, comingSoon: true },
    EUR: { symbol: '€', rate: 0.0011, comingSoon: true },
    GBP: { symbol: '£', rate: 0.00095, comingSoon: true },
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping_fee = subtotal > 50000 ? 0 : 2500;
  const total = subtotal + shipping_fee;
  const cur = currencies[currency] || currencies.NGN;
  const displayTotal = (total * cur.rate).toFixed(2);

  const handleShippingSubmit = (e) => {
    e.preventDefault();
    if (!shipping.address || !shipping.city || !shipping.state) {
      setError('Please fill in all required shipping fields');
      return;
    }
    setError('');
    setStep(2);
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    setError('');

    try {
      // 1. Create order via API
      const orderPayload = {
        items: cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        shipping: {
          firstName: shipping.firstName,
          lastName: shipping.lastName,
          email: shipping.email,
          phone: shipping.phone,
          address: shipping.address,
          city: shipping.city,
          state: shipping.state,
          zip: shipping.zip,
          country: shipping.country,
        },
        currency,
        paymentMethod,
      };

      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });
      const orderData = await orderRes.json();

      if (!orderData.success) {
        setError(orderData.error || orderData.errors?.join(', ') || 'Failed to create order');
        setIsProcessing(false);
        return;
      }

      // 2. Initialize Paystack payment
      if (paymentMethod === 'paystack' && orderData.payment) {
        // Redirect to Paystack authorization URL
        if (orderData.payment.authorizationUrl) {
          window.location.href = orderData.payment.authorizationUrl;
          return;
        }
      }

      // 3. If no Paystack redirect (e.g. bank transfer), show confirmation
      setOrderResult({
        orderId: orderData.order.orderNumber,
        totalAmount: orderData.order.totalAmount,
        currency: orderData.order.currency,
        items: cartItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        status: 'confirmed',
        date: new Date().toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' }),
      });

      clearCart();
      setStep(3);
    } catch (err) {
      console.error('Checkout error:', err);
      setError('Network error. Please try again.');
    }

    setIsProcessing(false);
  };

  // Empty cart
  if (cartItems.length === 0 && !orderResult) {
    return (
      <section className="min-h-screen bg-ob-light">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h1 className="text-2xl font-bold text-ob-navy mb-2">Your cart is empty</h1>
          <p className="text-gray-500 mb-6">Add some products before checking out.</p>
          <Link href="/shop" className="inline-block bg-ob-purple text-white px-6 py-3 rounded-lg font-medium hover:bg-ob-purple/90 transition">
            Browse Products
          </Link>
        </div>
      </section>
    );
  }

  // Order confirmation
  if (step === 3 && orderResult) {
    return (
      <section className="min-h-screen bg-ob-light">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✅</span>
            </div>
            <h1 className="text-2xl font-bold text-ob-navy mb-2">Order Confirmed!</h1>
            <p className="text-gray-500 mb-4">Thank you for your order. A confirmation has been sent to your email.</p>
            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
              <p className="text-sm text-gray-500">Order Number</p>
              <p className="font-bold text-ob-navy">{orderResult.orderId}</p>
              <p className="text-sm text-gray-500 mt-2">Total</p>
              <p className="font-bold text-ob-navy">{cur.symbol}{orderResult.totalAmount?.toLocaleString()}</p>
              <p className="text-sm text-gray-500 mt-2">Date</p>
              <p className="text-sm text-gray-700">{orderResult.date}</p>
            </div>
            <div className="flex gap-3 justify-center">
              <Link href="/account/orders" className="bg-ob-purple text-white px-6 py-3 rounded-lg font-medium hover:bg-ob-purple/90 transition">
                View Orders
              </Link>
              <Link href="/shop" className="border border-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-ob-light">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-ob-navy mb-1">Checkout</h1>
        <p className="text-gray-500 text-sm mb-6">Complete your order securely</p>

        {/* Steps */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= s ? 'bg-ob-purple text-white' : 'bg-gray-200 text-gray-500'}`}>
                {step > s ? '✓' : s}
              </div>
              {s < 3 && <div className={`w-12 h-0.5 ${step > s ? 'bg-ob-purple' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-700 text-sm">{error}</div>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            {/* STEP 1: Shipping */}
            {step === 1 && (
              <form onSubmit={handleShippingSubmit} className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-bold text-ob-navy mb-4">Shipping Information</h2>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                    <input required value={shipping.firstName} onChange={e => setShipping({ ...shipping, firstName: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                    <input required value={shipping.lastName} onChange={e => setShipping({ ...shipping, lastName: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none" />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input required type="email" value={shipping.email} onChange={e => setShipping({ ...shipping, email: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none" />
                  <p className="text-xs text-gray-400 mt-1">Order confirmation and tracking link will be sent here</p>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                  <input required value={shipping.phone} onChange={e => setShipping({ ...shipping, phone: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none" />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address *</label>
                  <input required placeholder="Street address" value={shipping.address} onChange={e => setShipping({ ...shipping, address: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none" />
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                    <input required value={shipping.city} onChange={e => setShipping({ ...shipping, city: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                    <input required value={shipping.state} onChange={e => setShipping({ ...shipping, state: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                    <input value={shipping.zip} onChange={e => setShipping({ ...shipping, zip: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none" />
                  </div>
                </div>
                <button type="submit" className="w-full bg-ob-purple text-white py-3 rounded-lg font-medium hover:bg-ob-purple/90 transition">
                  Continue to Payment
                </button>
              </form>
            )}

            {/* STEP 2: Payment */}
            {step === 2 && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-bold text-ob-navy mb-4">Payment Method</h2>

                {/* Currency selector */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.keys(currencies).map(c => {
                      const curInfo = currencies[c];
                      return (
                        <button key={c} type="button" disabled={!!curInfo.comingSoon}
                          onClick={() => !curInfo.comingSoon && setCurrency(c)}
                          className={`py-2.5 rounded-lg text-sm font-semibold border transition-all relative ${
                            curInfo.comingSoon
                              ? 'border-gray-100 text-gray-400 cursor-not-allowed opacity-60'
                              : currency === c
                                ? 'border-ob-purple bg-ob-purple/5 text-ob-purple'
                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}>
                          {c}
                          {curInfo.comingSoon && (
                            <span className="absolute -top-2 -right-1 text-[8px] bg-gray-100 text-gray-400 px-1 py-0.5 rounded-full">Soon</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Payment options */}
                <div className="space-y-3 mb-6">
                  {[
                    { id: 'paystack', label: 'Paystack (Recommended)', icon: '🟢' },
                    { id: 'card', label: 'Card (Visa/Mastercard)', icon: '💳' },
                    { id: 'transfer', label: 'Bank Transfer', icon: '🏦' },
                  ].map(opt => (
                    <label key={opt.id} className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${paymentMethod === opt.id ? 'border-ob-purple bg-ob-purple/5' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input type="radio" name="payment" value={opt.id} checked={paymentMethod === opt.id} onChange={() => setPaymentMethod(opt.id)} className="sr-only" />
                      <span className="text-xl mr-3">{opt.icon}</span>
                      <span className="font-medium text-ob-navy">{opt.label}</span>
                      {paymentMethod === opt.id && <span className="ml-auto text-ob-purple">✓</span>}
                    </label>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="flex-1 border border-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition">
                    Back
                  </button>
                  <button onClick={handlePayment} disabled={isProcessing}
                    className="flex-1 bg-ob-lime text-ob-navy py-3 rounded-lg font-bold hover:bg-ob-lime/90 transition disabled:opacity-50">
                    {isProcessing ? 'Processing...' : `Pay ${cur.symbol}${displayTotal}`}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="bg-white rounded-xl p-6 shadow-sm h-fit">
            <h3 className="font-bold text-ob-navy mb-4">Order Summary</h3>
            <div className="space-y-3 mb-4">
              {cartItems.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <div>
                    <p className="text-gray-700">{item.name}</p>
                    <p className="text-gray-400 text-xs">× {item.quantity}</p>
                  </div>
                  <span className="font-medium text-ob-navy">{cur.symbol}{(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-ob-navy">{cur.symbol}{(subtotal * cur.rate).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Shipping</span>
                <span className="text-ob-navy">{shipping_fee === 0 ? 'Free' : `${cur.symbol}${(shipping_fee * cur.rate).toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between font-bold text-ob-navy pt-2 border-t">
                <span>Total ({currency})</span>
                <span>{cur.symbol}{displayTotal}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-400 mt-4">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              <span>Secure checkout powered by Paystack</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

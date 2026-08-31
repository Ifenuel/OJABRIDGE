'use client';

import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal, itemCount, clearCart } = useCart();
  const { isAuthenticated } = useAuth();

  const shipping = subtotal > 50000 ? 0 : 2500;
  const total = subtotal + shipping;

  const formatPrice = (n) => `₦${Number(n).toLocaleString()}`;

  if (items.length === 0) {
    return (
      <section className="section-padding bg-ob-light min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-ob-navy mb-3">Your Cart is Empty</h2>
          <p className="text-gray-500 mb-6">Discover amazing products from verified vendors.</p>
          <Link href="/shop" className="btn-primary">Start Shopping</Link>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="bg-ob-navy text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold">Shopping Cart</h1>
          <p className="text-gray-300 mt-2">{itemCount} item{itemCount !== 1 ? 's' : ''} in your cart</p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={`${item.productId}-${item.variantId}`} className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 flex gap-4">
                {/* Image */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-50 rounded-xl flex-shrink-0 overflow-hidden">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl text-gray-200">📦</div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-ob-navy text-sm sm:text-base truncate">{item.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">by {item.vendor}</p>
                      {item.variantName && <p className="text-xs text-gray-400 mt-0.5">{item.variantName}</p>}
                    </div>
                    <button onClick={() => removeItem(item.productId, item.variantId)} className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0" title="Remove">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    {/* Quantity */}
                    <div className="flex items-center gap-2 border border-gray-200 rounded-lg">
                      <button onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)} className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-50 rounded-l-lg">−</button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)} className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-50 rounded-r-lg">+</button>
                    </div>
                    <p className="font-bold text-ob-navy">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                </div>
              </div>
            ))}

            <button onClick={clearCart} className="text-sm text-red-500 hover:text-red-600 font-medium">
              Clear Cart
            </button>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 sticky top-24">
              <h3 className="font-bold text-ob-navy text-lg mb-4">Order Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal ({itemCount} items)</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Shipping</span>
                  <span className="font-medium">{shipping === 0 ? <span className="text-green-600">Free</span> : formatPrice(shipping)}</span>
                </div>
                {shipping > 0 && (
                  <p className="text-xs text-gray-400">Free shipping on orders over ₦50,000</p>
                )}
                <div className="border-t border-gray-100 pt-3 flex justify-between">
                  <span className="font-bold text-ob-navy">Total</span>
                  <span className="font-bold text-ob-navy text-lg">{formatPrice(total)}</span>
                </div>
              </div>

              {isAuthenticated ? (
                <Link href="/checkout" className="btn-primary w-full text-center mt-6 block">
                  Proceed to Checkout
                </Link>
              ) : (
                <Link href="/login?returnTo=/checkout" className="btn-primary w-full text-center mt-6 block">
                  Login to Checkout
                </Link>
              )}

              <Link href="/shop" className="text-ob-purple text-sm font-medium hover:underline mt-4 block text-center">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

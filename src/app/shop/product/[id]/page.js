'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import HeartButton from '@/components/HeartButton';

export default function ProductDetailPage({ params }) {
  const resolvedParams = use(params);
  const id = resolvedParams?.id;

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState(0);
  const [activeTab, setActiveTab] = useState('description');
  const [addedToCart, setAddedToCart] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [reportSending, setReportSending] = useState(false);
  const [reportMessage, setReportMessage] = useState('');
  const { addItem } = useCart();

  const handleReport = async () => {
    if (!reportReason.trim() || !reportDesc.trim()) return;
    setReportSending(true);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType: 'product',
          targetId: product.id,
          reason: reportReason,
          description: reportDesc,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReportMessage('Report submitted. Our team will review it.');
        setShowReportModal(false);
        setReportReason('');
        setReportDesc('');
      } else {
        setReportMessage(data.error || 'Failed to submit report');
      }
    } catch (err) {
      setReportMessage('Network error. Please try again.');
    }
    setReportSending(false);
    setTimeout(() => setReportMessage(''), 5000);
  };

  useEffect(() => {
    if (id) loadProduct();
  }, [id]);

  const loadProduct = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${id}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success && data.product) {
        setProduct(data.product);
        // Load reviews
        try {
          const revRes = await fetch(`/api/reviews?productId=${id}`, { credentials: 'include' });
          const revData = await revRes.json();
          if (revData.success) setReviews(revData.reviews || []);
        } catch (e) {}
      } else {
        setError(data.error || 'Product not found');
      }
    } catch (err) {
      setError('Failed to load product');
    }
    setLoading(false);
  };

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      vendor: product.store_name || 'Vendor',
      vendor_id: product.vendor_id,
      images: product.images || [],
      stock_quantity: product.stock_quantity,
      currency: product.currency || 'NGN',
    }, quantity);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const formatPrice = (price) => {
    const num = Number(price);
    if (isNaN(num)) return '₦0';
    return `₦${num.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ob-light flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-ob-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-ob-light flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-6xl mb-4">📦</p>
          <h1 className="text-2xl font-bold text-ob-navy mb-2">Product Not Found</h1>
          <p className="text-gray-500 mb-6">{error || 'This product may have been removed or is unavailable.'}</p>
          <Link href="/shop" className="bg-ob-purple text-white px-6 py-3 rounded-xl font-semibold hover:bg-ob-purple-dark transition-colors">
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  const averageRating = Number(product.average_rating) || 0;
  const totalReviews = product.total_reviews || 0;
  const stock = product.stock_quantity || 0;
  const hasDiscount = product.compare_price && Number(product.compare_price) > Number(product.price);

  return (
    <>
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-ob-purple">Home</Link>
            <span>/</span>
            <Link href="/shop" className="hover:text-ob-purple">Shop</Link>
            <span>/</span>
            {product.category && (
              <>
                <span className="text-ob-navy font-medium">{product.category}</span>
                <span>/</span>
              </>
            )}
            <span className="text-ob-navy font-medium truncate">{product.name}</span>
          </div>
        </div>
      </div>

      {/* Product Detail */}
      <section className="py-8 lg:py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Left — Image */}
            <div className="space-y-4">
              <div className="aspect-square bg-gradient-to-br from-ob-purple/5 to-ob-lime/5 rounded-2xl flex items-center justify-center border border-gray-100 overflow-hidden">
                {product.images && product.images[0] ? (
                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center">
                    <div className="w-32 h-32 bg-ob-purple/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
                      <svg className="w-16 h-16 text-ob-purple/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <p className="text-gray-400 text-sm">Product Image</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right — Info */}
            <div className="space-y-6">
              {/* Vendor */}
              {product.store_name && (
                <div className="flex items-center justify-between">
                  <Link href={`/vendor/${product.store_slug || ''}`} className="text-sm text-ob-purple font-medium hover:underline flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    {product.store_name}
                  </Link>
                  {product.sku && <span className="text-xs text-gray-400">SKU: {product.sku}</span>}
                </div>
              )}

              {/* Name & Rating */}
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-ob-navy mb-3">{product.name}</h1>
                <div className="flex items-center space-x-3">
                  {averageRating > 0 && (
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg key={star} className={`w-5 h-5 ${star <= Math.round(averageRating) ? 'text-ob-gold' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  )}
                  <span className="text-sm text-gray-600">{averageRating > 0 ? averageRating.toFixed(1) : 'No ratings'}</span>
                  {totalReviews > 0 && <span className="text-sm text-gray-400">({totalReviews} reviews)</span>}
                </div>
              </div>

              {/* Price */}
              <div className="flex items-baseline space-x-3">
                <span className="text-3xl font-bold text-ob-navy">{formatPrice(product.price)}</span>
                {hasDiscount && (
                  <>
                    <span className="text-lg text-gray-400 line-through">{formatPrice(product.compare_price)}</span>
                    <span className="bg-red-100 text-red-600 text-sm font-semibold px-2 py-0.5 rounded">
                      -{Math.round((1 - Number(product.price) / Number(product.compare_price)) * 100)}%
                    </span>
                  </>
                )}
              </div>

              {/* Description */}
              {(product.short_description || product.description) && (
                <div>
                  <p className="text-gray-600 leading-relaxed text-sm">
                    {product.short_description || product.description?.substring(0, 200)}
                  </p>
                </div>
              )}

              {/* Tags */}
              {product.tags && product.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag, i) => (
                    <span key={i} className="bg-ob-light text-ob-purple text-xs px-3 py-1 rounded-full">{tag}</span>
                  ))}
                </div>
              )}

              {/* Quantity */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Quantity:</p>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center border border-gray-200 rounded-lg">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 py-2 text-gray-600 hover:text-ob-purple transition-colors">-</button>
                    <span className="px-4 py-2 font-semibold text-ob-navy min-w-[48px] text-center">{quantity}</span>
                    <button onClick={() => setQuantity(Math.min(stock || 99, quantity + 1))} className="px-4 py-2 text-gray-600 hover:text-ob-purple transition-colors">+</button>
                  </div>
                  <span className={`text-sm font-medium ${stock > 10 ? 'text-green-600' : stock > 0 ? 'text-amber-600' : 'text-red-600'}`}>
                    {stock > 10 ? `In Stock (${stock} available)` : stock > 0 ? `Only ${stock} left` : 'Out of Stock'}
                  </span>
                </div>
              </div>

              {/* Add to Cart & Buy Now */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={handleAddToCart} disabled={stock === 0}
                  className="flex-1 bg-ob-navy hover:bg-ob-navy-light text-white font-semibold px-6 py-3.5 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>{addedToCart ? '✓ Added!' : stock === 0 ? 'Out of Stock' : 'Add to Cart'}</span>
                </button>
                <Link href="/checkout" className="flex-1 bg-ob-purple hover:bg-ob-purple-dark text-white font-semibold px-6 py-3.5 rounded-lg transition-all duration-200 text-center">
                  Buy Now
                </Link>
              </div>

              {/* Favorite + Report */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <HeartButton productId={product.id} size="large" />
                  <span className="text-sm text-gray-500">Save to favorites</span>
                </div>
                <button onClick={() => setShowReportModal(true)} className="text-sm text-gray-400 hover:text-red-500 transition-colors">
                  🚩 Report this product
                </button>
              </div>
              {reportMessage && (
                <div className={`p-3 rounded-lg text-sm ${reportMessage.includes('submitted') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {reportMessage}
                </div>
              )}

              {/* Trust strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-gray-100">
                {[
                  { icon: '🔒', text: 'Secure Payment' },
                  { icon: '🚚', text: 'Fast Delivery' },
                  { icon: '🛡️', text: 'Buyer Protection' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>{item.icon}</span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-16">
            <div className="flex space-x-1 border-b border-gray-200 mb-8">
              {['description', 'reviews'].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3 text-sm font-medium capitalize transition-colors ${activeTab === tab ? 'text-ob-purple border-b-2 border-ob-purple' : 'text-gray-500 hover:text-gray-700'}`}>
                  {tab} {tab === 'reviews' && `(${totalReviews})`}
                </button>
              ))}
            </div>

            {activeTab === 'description' && (
              <div className="max-w-3xl">
                <p className="text-gray-600 leading-relaxed">{product.description || 'No description available.'}</p>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="max-w-3xl space-y-6">
                {averageRating > 0 && (
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="text-center">
                      <p className="text-4xl font-bold text-ob-navy">{averageRating.toFixed(1)}</p>
                      <div className="flex items-center space-x-0.5 my-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <svg key={s} className={`w-4 h-4 ${s <= Math.round(averageRating) ? 'text-ob-gold' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <p className="text-xs text-gray-400">{totalReviews} reviews</p>
                    </div>
                  </div>
                )}

                {reviews.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No reviews yet. Be the first to review this product!</p>
                  </div>
                ) : (
                  reviews.map((review, i) => (
                    <div key={review.id || i} className="bg-ob-light p-5 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-ob-purple/20 rounded-full flex items-center justify-center text-ob-purple text-sm font-bold">
                            {(review.user_name || 'A').charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-ob-navy text-sm">{review.user_name || 'Anonymous'}</p>
                            {review.verified_purchase && <span className="text-xs text-ob-lime-dark">✓ Verified Purchase</span>}
                          </div>
                        </div>
                        <span className="text-xs text-gray-400">{review.created_at ? new Date(review.created_at).toLocaleDateString() : ''}</span>
                      </div>
                      <div className="flex items-center space-x-0.5 mb-2">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <svg key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? 'text-ob-gold' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <p className="text-gray-600 text-sm">{review.comment || review.text}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-ob-navy">Report Product</h3>
              <button onClick={() => setShowReportModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Why are you reporting this product?</p>
            <div className="space-y-2 mb-4">
              {['Fake or counterfeit product', 'Misleading description', 'Fraudulent seller', 'Inappropriate content', 'Other'].map(r => (
                <button key={r} onClick={() => setReportReason(r)} className={`w-full text-left px-4 py-2.5 rounded-lg text-sm border transition-all ${reportReason === r ? 'border-ob-purple bg-ob-purple/5 text-ob-purple' : 'border-gray-200 text-gray-600 hover:border-ob-purple/30'}`}>
                  {r}
                </button>
              ))}
            </div>
            <textarea value={reportDesc} onChange={e => setReportDesc(e.target.value)} placeholder="Provide more details..." rows={3} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-ob-purple outline-none resize-none mb-4" />
            <div className="flex gap-3">
              <button onClick={handleReport} disabled={!reportReason || !reportDesc.trim() || reportSending} className="flex-1 bg-red-600 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50">
                {reportSending ? 'Submitting...' : 'Submit Report'}
              </button>
              <button onClick={() => setShowReportModal(false)} className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

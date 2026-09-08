'use client';

import { useState, useEffect } from 'react';

export default function WebsiteReviews() {
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState('0.0');
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/website-reviews', { credentials: 'include' });
        const data = await res.json();
        if (data.success) {
          setReviews((data.reviews || []).slice(0, 6));
          setAvgRating(data.averageRating || '0.0');
          setTotal(data.total || 0);
        }
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return null;
  if (reviews.length === 0) return null; // Hide section entirely if no approved reviews

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <p className="text-ob-purple font-semibold text-sm uppercase tracking-wider mb-2">Testimonials</p>
          <h2 className="text-3xl font-bold text-ob-navy">What Our Users Say</h2>
          <div className="flex items-center justify-center gap-2 mt-3">
            <svg className="w-5 h-5 text-ob-gold" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
            <span className="font-bold text-ob-navy text-lg">{avgRating}</span>
            <span className="text-gray-500 text-sm">from {total} verified review{total !== 1 ? 's' : ''}</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review) => (
            <div key={review.id} className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex flex-col">
              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map(star => (
                  <svg key={star} className={`w-4 h-4 ${star <= review.rating ? 'text-ob-gold' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                ))}
              </div>
              {review.title && <h3 className="font-semibold text-ob-navy mb-2">{review.title}</h3>}
              {review.comment && <p className="text-gray-600 text-sm flex-1">{review.comment}</p>}
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                <div className="w-9 h-9 bg-ob-purple/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-ob-purple font-semibold text-sm">{(review.user_name || 'U').charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-ob-navy">{review.user_name}</p>
                  <p className="text-xs text-gray-400">Verified User</p>
                </div>
              </div>
              {review.admin_reply && (
                <div className="mt-3 pl-3 border-l-2 border-ob-purple/30">
                  <p className="text-xs font-semibold text-ob-purple mb-0.5">OjaBridge Team:</p>
                  <p className="text-gray-600 text-sm">{review.admin_reply}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

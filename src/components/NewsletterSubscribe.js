'use client';

import { useState } from 'react';

/**
 * NewsletterSubscribe — Email subscription form for the footer.
 * Submits to /api/newsletter/subscribe.
 */
export default function NewsletterSubscribe({ dark = false }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSubmitting(true);
    setStatus(null);
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus('success');
        setMessage(data.message || 'Subscribed successfully!');
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong');
      }
    } catch (err) {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
    setSubmitting(false);
  };

  if (status === 'success') {
    return (
      <div className="flex items-center gap-2 bg-green-500/20 border border-green-400/30 rounded-lg px-4 py-2.5">
        <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-green-300 text-sm">{message}</span>
        <button onClick={() => setStatus(null)} className="text-green-400 hover:text-green-200 text-xs ml-2">✕</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 w-full">
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Enter your email"
        required
        className="flex-1 px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-ob-purple/30 focus:border-ob-purple transition-all"
      />
      <button
        type="submit"
        disabled={submitting}
        className="px-5 py-2.5 bg-ob-purple hover:bg-ob-purple-dark text-white text-sm font-semibold rounded-lg transition-all disabled:opacity-50 whitespace-nowrap"
      >
        {submitting ? '...' : 'Subscribe'}
      </button>
      {status === 'error' && (
        <span className="text-red-400 text-xs self-center ml-2">{message}</span>
      )}
    </form>
  );
}

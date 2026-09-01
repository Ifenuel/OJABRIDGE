'use client';

import { useState, useEffect } from 'react';
import { PLATFORM } from '@/lib/platform';

export default function PressPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/cms?type=press&limit=20')
      .then(r => r.json())
      .then(d => { setPosts(d.items || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <>
      <section className="bg-ob-navy text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Press</h1>
          <p className="text-gray-300">Media resources, press releases and company announcements</p>
        </div>
      </section>
      <section className="section-padding bg-ob-light">
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="bg-white rounded-xl h-32 animate-pulse" />)}</div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">📰</p>
              <p className="text-gray-400 text-lg font-medium mb-2">No press releases yet</p>
              <p className="text-gray-400 text-sm">Media resources and press information will be published here.</p>
              <div className="mt-8 bg-white rounded-xl p-8 border border-gray-100 text-left">
                <h3 className="font-bold text-ob-navy mb-2">Media Contact</h3>
                <p className="text-gray-500 text-sm">For press inquiries, please contact us at <a href={`mailto:${PLATFORM.emails.press}`} className="text-ob-purple hover:underline">{PLATFORM.emails.press}</a></p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map(post => (
                <div key={post.id} className="bg-white rounded-xl p-6 border border-gray-100">
                  <span className="text-xs text-ob-purple font-medium">{new Date(post.published_at || post.created_at).toLocaleDateString()}</span>
                  <h2 className="font-bold text-ob-navy text-lg mt-1 mb-2">{post.title}</h2>
                  <p className="text-gray-500 text-sm">{post.summary || post.content?.substring(0, 200)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

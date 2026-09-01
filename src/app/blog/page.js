'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function BlogPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/cms?type=blog&limit=20')
      .then(r => r.json())
      .then(d => { setPosts(d.items || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <>
      <section className="bg-ob-navy text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Blog</h1>
          <p className="text-gray-300">Insights, updates and stories from the OjaBridge team</p>
        </div>
      </section>
      <section className="section-padding bg-ob-light">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl h-64 animate-pulse" />)}</div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">📝</p>
              <p className="text-gray-400 text-lg font-medium mb-2">No blog posts yet</p>
              <p className="text-gray-400 text-sm">Check back soon for articles about marketplace commerce, vendor growth and technology.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map(post => (
                <div key={post.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 card-hover">
                  {post.featured_image && <div className="aspect-video bg-ob-purple/5"><img src={post.featured_image} alt={post.title} className="w-full h-full object-cover" /></div>}
                  <div className="p-6">
                    {post.category && <span className="text-xs text-ob-purple font-medium">{post.category}</span>}
                    <h2 className="font-bold text-ob-navy text-lg mt-1 mb-2">{post.title}</h2>
                    <p className="text-gray-500 text-sm line-clamp-3">{post.excerpt || post.content?.substring(0, 150)}</p>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                      <span className="text-xs text-gray-400">{post.published_at ? new Date(post.published_at).toLocaleDateString() : new Date(post.created_at).toLocaleDateString()}</span>
                      <span className="text-xs text-gray-400">{post.author || 'OjaBridge'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

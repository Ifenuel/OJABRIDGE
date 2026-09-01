'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

function extractYouTubeId(url) {
  if (!url) return null;
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
    /youtube\.com\/embed\/([^?]+)/,
    /youtube\.com\/shorts\/([^?]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

export default function BlogPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPost, setExpandedPost] = useState(null);
  const [galleryIndex, setGalleryIndex] = useState({});

  useEffect(() => {
    fetch('/api/cms?type=blog&limit=20')
      .then(r => r.json())
      .then(d => { setPosts(d.items || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const scrollGallery = (postId, direction) => {
    setGalleryIndex(prev => {
      const post = posts.find(p => p.id === postId);
      const images = post?.images || [];
      const current = prev[postId] || 0;
      const next = Math.max(0, Math.min(images.length - 1, current + direction));
      return { ...prev, [postId]: next };
    });
  };

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
              {posts.map(post => {
                const ytId = extractYouTubeId(post.youtube_url);
                const images = post.images || [];
                const currentIndex = galleryIndex[post.id] || 0;
                const isExpanded = expandedPost === post.id;

                return (
                  <div key={post.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 card-hover">
                    {/* Featured Image or YouTube */}
                    {post.featured_image && !ytId && (
                      <div className="aspect-video bg-ob-purple/5">
                        <img src={post.featured_image} alt={post.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    {ytId && (
                      <div className="aspect-video bg-gray-900">
                        <iframe src={`https://www.youtube.com/embed/${ytId}`} className="w-full h-full" allowFullScreen title={post.title} />
                      </div>
                    )}
                    {!post.featured_image && !ytId && images.length > 0 && (
                      <div className="aspect-video bg-gray-100 relative">
                        <img src={images[0]} alt={post.title} className="w-full h-full object-cover" />
                        {images.length > 1 && <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">+{images.length - 1} more</span>}
                      </div>
                    )}
                    {!post.featured_image && !ytId && images.length === 0 && !post.video_url && (
                      <div className="aspect-video bg-gradient-to-br from-ob-purple/10 to-ob-lime/10 flex items-center justify-center">
                        <span className="text-4xl">📝</span>
                      </div>
                    )}

                    {/* Video player */}
                    {post.video_url && (
                      <div className="aspect-video bg-gray-900">
                        <video src={post.video_url} controls className="w-full h-full" poster={post.featured_image || undefined} />
                      </div>
                    )}

                    <div className="p-6">
                      {post.category && <span className="text-xs text-ob-purple font-medium">{post.category}</span>}
                      <h2 className="font-bold text-ob-navy text-lg mt-1 mb-2">{post.title}</h2>
                      <p className={`text-gray-500 text-sm ${!isExpanded ? 'line-clamp-3' : ''}`}>{post.excerpt || post.content?.substring(0, 300)}</p>
                      {(post.content?.length > 300 || post.excerpt) && (
                        <button onClick={() => setExpandedPost(isExpanded ? null : post.id)} className="text-ob-purple text-xs font-medium mt-1 hover:underline">
                          {isExpanded ? 'Show less' : 'Read more'}
                        </button>
                      )}

                      {/* Image Gallery */}
                      {images.length > 1 && (
                        <div className="mt-4">
                          <p className="text-xs text-gray-400 mb-2">Gallery ({images.length} images)</p>
                          <div className="flex items-center gap-2">
                            <button onClick={() => scrollGallery(post.id, -1)} disabled={currentIndex === 0} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 disabled:opacity-30 hover:bg-gray-200 text-xs">←</button>
                            <div className="flex-1 overflow-hidden rounded-lg">
                              <img src={images[currentIndex]} alt="" className="w-full h-32 object-cover" />
                            </div>
                            <button onClick={() => scrollGallery(post.id, 1)} disabled={currentIndex >= images.length - 1} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 disabled:opacity-30 hover:bg-gray-200 text-xs">→</button>
                          </div>
                          <p className="text-center text-xs text-gray-400 mt-1">{currentIndex + 1} / {images.length}</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                        <span className="text-xs text-gray-400">{post.published_at ? new Date(post.published_at).toLocaleDateString() : new Date(post.created_at).toLocaleDateString()}</span>
                        <span className="text-xs text-gray-400">{post.author || 'OjaBridge'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

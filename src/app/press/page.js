'use client';

import { useState, useEffect } from 'react';
import { PLATFORM } from '@/lib/platform';

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

export default function PressPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [galleryIndex, setGalleryIndex] = useState({});

  useEffect(() => {
    fetch('/api/cms?type=press&limit=20')
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
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Press</h1>
          <p className="text-gray-300">Media resources, press releases and company announcements</p>
        </div>
      </section>
      <section className="section-padding bg-ob-light">
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="space-y-6">{[1,2,3].map(i => <div key={i} className="bg-white rounded-xl h-48 animate-pulse" />)}</div>
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
              {posts.map(post => {
                const ytId = extractYouTubeId(post.youtube_url);
                const images = post.images || [];
                const currentIndex = galleryIndex[post.id] || 0;

                return (
                  <div key={post.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    {/* Featured Image */}
                    {post.featured_image && !ytId && (
                      <div className="aspect-video bg-gray-50">
                        <img src={post.featured_image} alt={post.title} className="w-full h-full object-cover" />
                      </div>
                    )}

                    {/* YouTube Embed */}
                    {ytId && (
                      <div className="aspect-video bg-gray-900">
                        <iframe src={`https://www.youtube.com/embed/${ytId}`} className="w-full h-full" allowFullScreen title={post.title} />
                      </div>
                    )}

                    {/* Video Player */}
                    {post.video_url && !ytId && (
                      <div className="aspect-video bg-gray-900">
                        <video src={post.video_url} controls className="w-full h-full" poster={post.featured_image || undefined} />
                      </div>
                    )}

                    {/* Image Gallery */}
                    {images.length > 0 && (
                      <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                        <p className="text-xs text-gray-400 mb-2 font-medium">Photo Gallery ({images.length} images)</p>
                        <div className="flex items-center gap-3">
                          {images.length > 1 && (
                            <button onClick={() => scrollGallery(post.id, -1)} disabled={currentIndex === 0} className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 disabled:opacity-30 hover:bg-gray-100 text-sm flex-shrink-0">←</button>
                          )}
                          <div className="flex-1 overflow-hidden rounded-lg">
                            <img src={images[currentIndex]} alt="" className="w-full h-48 object-cover" />
                          </div>
                          {images.length > 1 && (
                            <button onClick={() => scrollGallery(post.id, 1)} disabled={currentIndex >= images.length - 1} className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 disabled:opacity-30 hover:bg-gray-100 text-sm flex-shrink-0">→</button>
                          )}
                        </div>
                        {images.length > 1 && (
                          <div className="flex justify-center gap-1 mt-2">
                            {images.map((_, i) => (
                              <div key={i} className={`w-2 h-2 rounded-full ${i === currentIndex ? 'bg-ob-purple' : 'bg-gray-300'}`} />
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs text-ob-purple font-medium">{new Date(post.published_at || post.created_at).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        {post.category && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{post.category}</span>}
                      </div>
                      <h2 className="font-bold text-ob-navy text-xl mb-3">{post.title}</h2>
                      <p className="text-gray-600 text-sm leading-relaxed">{post.summary || post.excerpt || post.content?.substring(0, 500)}</p>
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

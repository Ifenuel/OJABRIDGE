'use client';

import { useState, useEffect } from 'react';

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetch('/api/cms?type=announcement&limit=20')
      .then(r => r.json())
      .then(d => { setAnnouncements(d.items || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const priorityBadge = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-700';
      case 'high': return 'bg-amber-100 text-amber-700';
      case 'normal': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const priorityIcon = (priority) => {
    switch (priority) {
      case 'urgent': return '🔴';
      case 'high': return '🟡';
      case 'normal': return '🔵';
      default: return '⚪';
    }
  };

  return (
    <>
      <section className="bg-ob-navy text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Announcements</h1>
          <p className="text-gray-300">Important updates and news from OjaBridge</p>
        </div>
      </section>
      <section className="section-padding bg-ob-light">
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-2xl h-32 animate-pulse" />)}
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">📢</p>
              <p className="text-gray-400 text-lg font-medium mb-2">No announcements yet</p>
              <p className="text-gray-400 text-sm">Check back soon for important updates from OjaBridge.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map(a => (
                <div key={a.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div
                    onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}
                    className="px-6 py-5 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-2xl mt-1">{priorityIcon(a.priority)}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-ob-navy">{a.title}</h3>
                          <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${priorityBadge(a.priority)}`}>
                            {a.priority || 'normal'}
                          </span>
                        </div>
                        <p className="text-gray-500 text-sm">{a.content?.substring(0, 150)}{a.content?.length > 150 ? '...' : ''}</p>
                        <p className="text-xs text-gray-300 mt-2">
                          {new Date(a.published_at || a.created_at).toLocaleDateString('en-NG', {
                            year: 'numeric', month: 'long', day: 'numeric'
                          })}
                        </p>
                      </div>
                      <svg className={`w-5 h-5 text-gray-300 flex-shrink-0 transition-transform ${expandedId === a.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  {expandedId === a.id && (
                    <div className="px-6 pb-6 pt-0">
                      <div className="border-t border-gray-100 pt-4 ml-10">
                        <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-wrap">
                          {a.content}
                        </div>
                        {a.audience && a.audience !== 'all' && (
                          <p className="text-xs text-gray-400 mt-4">For: {a.audience}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

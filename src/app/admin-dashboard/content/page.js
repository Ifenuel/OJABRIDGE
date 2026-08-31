'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

export default function AdminContentPage() {
  const [activeTab, setActiveTab] = useState('blog');

  const tabs = [
    { key: 'blog', label: 'Blog', icon: '📝' },
    { key: 'careers', label: 'Careers', icon: '🚀' },
    { key: 'press', label: 'Press', icon: '📰' },
    { key: 'announcements', label: 'Announcements', icon: '📢' },
  ];

  return (
    <DashboardLayout role="admin">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ob-navy">Content Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage blog posts, careers, press releases and platform announcements.</p>
        </div>
        <button className="btn-primary text-sm px-5 py-2.5 inline-flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Create New
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === t.key ? 'bg-ob-purple text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-ob-purple'}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-xl border border-gray-100 p-8">
        {activeTab === 'blog' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-ob-navy">Blog Posts</h3>
              <button className="btn-primary text-xs px-4 py-2">+ New Post</button>
            </div>
            <p className="text-gray-400 text-sm text-center py-12">
              Blog posts created here will appear on <a href="/blog" className="text-ob-purple hover:underline">/blog</a>.<br />
              Create posts about marketplace commerce, vendor growth, payments and technology.
            </p>
          </div>
        )}
        {activeTab === 'careers' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-ob-navy">Career Posts</h3>
              <button className="btn-primary text-xs px-4 py-2">+ New Listing</button>
            </div>
            <p className="text-gray-400 text-sm text-center py-12">
              Career listings created here will appear on <a href="/careers" className="text-ob-purple hover:underline">/careers</a>.
            </p>
          </div>
        )}
        {activeTab === 'press' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-ob-navy">Press Releases</h3>
              <button className="btn-primary text-xs px-4 py-2">+ New Release</button>
            </div>
            <p className="text-gray-400 text-sm text-center py-12">
              Press releases created here will appear on <a href="/press" className="text-ob-purple hover:underline">/press</a>.
            </p>
          </div>
        )}
        {activeTab === 'announcements' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-ob-navy">Platform Announcements</h3>
              <button className="btn-primary text-xs px-4 py-2">+ New Announcement</button>
            </div>
            <p className="text-gray-400 text-sm text-center py-12">
              Announcements are shown to users on the platform based on audience and priority settings.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

'use client';

import { useState, useEffect } from 'react';

export default function CareersPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/cms?type=career&limit=20')
      .then(r => r.json())
      .then(d => { setJobs(d.items || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <>
      <section className="bg-ob-navy text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Careers</h1>
          <p className="text-gray-300">Join OjaBridge and help build the future of trusted digital commerce</p>
        </div>
      </section>
      <section className="section-padding bg-ob-light">
        <div className="max-w-4xl mx-auto">
          {/* Values */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-ob-navy mb-6">Why OjaBridge?</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { icon: '🌍', title: 'Global Impact', desc: 'Build infrastructure that connects businesses across Africa and beyond.' },
                { icon: '🚀', title: 'Growth', desc: 'Rapidly growing marketplace with real-world impact on commerce.' },
                { icon: '🤝', title: 'Team Culture', desc: 'Collaborative, innovative and driven by purpose.' },
                { icon: '💡', title: 'Meaningful Work', desc: 'You won\'t just write code — you\'ll build systems that matter.' },
              ].map((v, i) => (
                <div key={i} className="bg-white p-5 rounded-xl border border-gray-100">
                  <span className="text-2xl mb-3 block">{v.icon}</span>
                  <h3 className="font-bold text-ob-navy text-sm mb-1">{v.title}</h3>
                  <p className="text-gray-500 text-xs">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Job Listings */}
          <h2 className="text-2xl font-bold text-ob-navy mb-6">Open Positions</h2>
          {loading ? (
            <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="bg-white rounded-xl h-28 animate-pulse" />)}</div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">🚀</p>
              <p className="text-gray-400 text-lg font-medium mb-2">No open positions right now</p>
              <p className="text-gray-400 text-sm">We&apos;re always looking for talented people. Send your resume to <a href="mailto:careers@ojabridge.com" className="text-ob-purple hover:underline">careers@ojabridge.com</a></p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map(job => (
                <div key={job.id} className="bg-white p-6 rounded-xl border border-gray-100">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-ob-navy">{job.title}</h3>
                      <div className="flex gap-3 mt-1 text-sm text-gray-500">
                        {job.department && <span>{job.department}</span>}
                        {job.location && <span>📍 {job.location}</span>}
                        {job.employment_type && <span>{job.employment_type}</span>}
                      </div>
                    </div>
                  </div>
                  {job.description && <p className="text-gray-600 text-sm mt-3">{job.description.substring(0, 200)}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

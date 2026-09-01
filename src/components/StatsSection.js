'use client';

import { useState, useEffect } from 'react';
import AnimatedCounter from './AnimatedCounter';
import ScrollReveal from './ScrollReveal';

/**
 * StatsSection — Fetches real platform stats from /api/stats
 * and displays them as animated counters.
 */
export default function StatsSection() {
  const [stats, setStats] = useState({ vendors: 0, products: 0, orders: 0, satisfaction: 100 });

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setStats({
            vendors: data.vendors || 0,
            products: data.products || 0,
            orders: data.orders || 0,
            satisfaction: data.satisfaction || 100,
          });
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section className="bg-ob-purple py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
          <ScrollReveal animation="fade-up" delay={0}>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">
                <AnimatedCounter target={stats.vendors} suffix="+" />
              </div>
              <p className="text-white/70 text-sm">Verified Vendors</p>
            </div>
          </ScrollReveal>
          <ScrollReveal animation="fade-up" delay={100}>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">
                <AnimatedCounter target={stats.products} suffix="+" />
              </div>
              <p className="text-white/70 text-sm">Products Listed</p>
            </div>
          </ScrollReveal>
          <ScrollReveal animation="fade-up" delay={200}>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">
                <AnimatedCounter target={stats.orders} suffix="+" />
              </div>
              <p className="text-white/70 text-sm">Orders Completed</p>
            </div>
          </ScrollReveal>
          <ScrollReveal animation="fade-up" delay={300}>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">
                <AnimatedCounter target={stats.satisfaction} suffix="%" />
              </div>
              <p className="text-white/70 text-sm">Customer Satisfaction</p>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

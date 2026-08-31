'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * ScrollReveal — Wraps children and applies animation when scrolled into view.
 * Uses IntersectionObserver for performance (no scroll event listeners).
 *
 * Props:
 * - animation: 'fade-up' | 'fade-left' | 'fade-right' | 'scale-in' | 'fade-in'
 * - delay: number (ms) before animation starts
 * - duration: number (ms) for the animation
 * - className: additional classes to apply
 * - threshold: visibility threshold to trigger (0-1, default 0.1)
 * - once: boolean, animate only once (default true)
 */
export default function ScrollReveal({
  children,
  animation = 'fade-up',
  delay = 0,
  duration = 600,
  className = '',
  threshold = 0.1,
  once = true,
}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) {
            observer.unobserve(element);
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin: '0px 0px -50px 0px' }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, once]);

  const animations = {
    'fade-up': {
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translateY(0)' : 'translateY(40px)',
    },
    'fade-left': {
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translateX(0)' : 'translateX(40px)',
    },
    'fade-right': {
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translateX(0)' : 'translateX(-40px)',
    },
    'scale-in': {
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'scale(1)' : 'scale(0.92)',
    },
    'fade-in': {
      opacity: isVisible ? 1 : 0,
    },
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...animations[animation],
        transition: `opacity ${duration}ms ease-out ${delay}ms, transform ${duration}ms ease-out ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

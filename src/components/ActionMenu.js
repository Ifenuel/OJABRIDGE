'use client';

import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

/**
 * ActionMenu — Reusable dropdown action menu.
 *
 * Renders through a React portal into document.body with fixed positioning,
 * so it is NEVER clipped by parent containers (overflow-x-auto tables,
 * overflow-hidden cards) and never buried under sticky headers.
 *
 * - Aligns below the trigger button, right-aligned with it
 * - Flips above the button when there is no space below
 * - Clamps horizontally so it never overflows the viewport
 * - Closes on outside click, Escape key, and any scroll/resize
 *
 * Props:
 *  - actions: [{ label, icon (emoji), onClick, className (color classes), hidden (bool), confirm (string) }]
 *  - label: button text (default 'Actions ▾')
 */
export default function ActionMenu({ actions, label = 'Actions ▾' }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null); // { top, left }
  const [mounted, setMounted] = useState(false);
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => { setMounted(true); }, []);

  const visibleActions = (actions || []).filter(a => !a.hidden);
  const visibleCount = visibleActions.length;

  const computePosition = useCallback(() => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const menuW = menuRef.current?.offsetWidth || 208; // w-52 fallback
    const menuH = menuRef.current?.offsetHeight || Math.max(visibleCount * 40 + 8, 48);
    const margin = 8;

    let top = rect.bottom + 4;
    // Flip above the button if the menu would overflow the viewport bottom
    if (top + menuH > window.innerHeight - margin) {
      const flipped = rect.top - menuH - 4;
      top = flipped >= margin ? flipped : Math.max(margin, window.innerHeight - margin - menuH);
    }

    let left = rect.right - menuW; // right-align with the button
    if (left < margin) left = margin;
    if (left + menuW > window.innerWidth - margin) left = window.innerWidth - margin - menuW;

    setPos({ top, left });
  }, [visibleCount]);

  // Close on outside click / Escape / any scroll or resize
  useEffect(() => {
    if (!open) return;
    const onOutside = (e) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target) &&
        btnRef.current && !btnRef.current.contains(e.target)
      ) setOpen(false);
    };
    const onEscape = (e) => { if (e.key === 'Escape') setOpen(false); };
    const onScrollOrResize = () => setOpen(false);
    document.addEventListener('mousedown', onOutside);
    document.addEventListener('touchstart', onOutside);
    document.addEventListener('keydown', onEscape);
    // capture: true also catches scrolling inside overflow-x-auto tables
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      document.removeEventListener('mousedown', onOutside);
      document.removeEventListener('touchstart', onOutside);
      document.removeEventListener('keydown', onEscape);
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [open]);

  // Fine-tune position once the real menu is measured (flip/clamp with true size)
  useLayoutEffect(() => {
    if (open) computePosition();
  }, [open, computePosition]);

  if (visibleCount === 0) return null;

  const handleOpen = () => {
    if (open) { setOpen(false); return; }
    computePosition();
    setOpen(true);
  };

  const handleAction = (action) => {
    if (action.confirm) {
      if (!window.confirm(action.confirm)) { setOpen(false); return; }
    }
    setOpen(false);
    action.onClick();
  };

  const menu = open && pos ? (
    <div
      ref={menuRef}
      style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }}
      className="bg-white border border-gray-200 rounded-xl shadow-xl py-1 w-52 max-h-72 overflow-y-auto"
    >
      {visibleActions.map((action, i) => (
        <button key={i} type="button"
          onClick={() => handleAction(action)}
          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 whitespace-nowrap ${action.className || 'text-gray-700'}`}>
          {action.icon && <span className="flex-shrink-0">{action.icon}</span>}
          {action.label}
        </button>
      ))}
    </div>
  ) : null;

  return (
    <div className="relative inline-block">
      <button ref={btnRef} type="button" onClick={handleOpen}
        className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
        {label}
      </button>
      {mounted && menu && createPortal(menu, document.body)}
    </div>
  );
}

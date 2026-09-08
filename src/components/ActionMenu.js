'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * ActionMenu — Reusable dropdown action menu.
 * Closes on outside click and Escape key.
 *
 * Props:
 *  - actions: [{ label, icon (emoji), onClick, className (color classes), hidden (bool), confirm (string) }]
 *  - label: button text (default 'Actions ▾')
 */
export default function ActionMenu({ actions, label = 'Actions ▾' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onEscape = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, [open]);

  const visibleActions = (actions || []).filter(a => !a.hidden);
  if (visibleActions.length === 0) return null;

  const handleAction = (action) => {
    if (action.confirm) {
      if (!window.confirm(action.confirm)) { setOpen(false); return; }
    }
    setOpen(false);
    action.onClick();
  };

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(!open)}
        className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
        {label}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-30 bg-white border border-gray-200 rounded-xl shadow-lg py-1 w-52 max-h-72 overflow-y-auto">
          {visibleActions.map((action, i) => (
            <button key={i} type="button"
              onClick={() => handleAction(action)}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 whitespace-nowrap ${action.className || 'text-gray-700'}`}>
              {action.icon && <span className="flex-shrink-0">{action.icon}</span>}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

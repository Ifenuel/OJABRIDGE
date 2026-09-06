'use client';

import { useState, useRef, useEffect } from 'react';

/**
 * Reusable Export Button with format picker and custom date range
 * 
 * Props:
 *   onExport({ format, dateRange }) - callback when user selects export options
 *   dateRangeOptions - preset date ranges [{ label, start, end }]
 *   defaultDateRange - default selected range key
 */
export default function ExportButton({ onExport, dateRangeOptions = [], defaultDateRange = 'all' }) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDateRange, setShowDateRange] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [selectedRange, setSelectedRange] = useState(defaultDateRange);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
        setShowDateRange(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = (format) => {
    let dateRange = null;
    if (selectedRange !== 'custom' && selectedRange !== 'all') {
      const preset = dateRangeOptions.find(r => r.key === selectedRange);
      if (preset) dateRange = { start: preset.start, end: preset.end, label: preset.label };
    } else if (selectedRange === 'custom') {
      if (customStart || customEnd) {
        dateRange = { start: customStart || null, end: customEnd || null, label: 'Custom Range' };
      }
    }
    onExport({ format, dateRange });
    setShowMenu(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-4 py-2 bg-ob-purple text-white rounded-lg text-xs font-medium hover:bg-ob-purple-dark transition-all"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Export
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showMenu && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl border border-gray-200 shadow-xl z-50 overflow-hidden">
          {/* Date Range Selector */}
          {dateRangeOptions.length > 0 && (
            <div className="border-b border-gray-100">
              <button
                onClick={() => setShowDateRange(!showDateRange)}
                className="w-full px-4 py-3 text-left text-xs font-medium text-gray-500 hover:bg-gray-50 flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Date Range
                </span>
                <span className="text-ob-purple font-medium">
                  {selectedRange === 'all' ? 'All Time' :
                   selectedRange === 'custom' ? 'Custom' :
                   dateRangeOptions.find(r => r.key === selectedRange)?.label || 'All Time'}
                </span>
              </button>
              
              {showDateRange && (
                <div className="px-4 pb-3 space-y-1">
                  <button
                    onClick={() => { setSelectedRange('all'); }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors ${selectedRange === 'all' ? 'bg-ob-purple/10 text-ob-purple font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    All Time
                  </button>
                  {dateRangeOptions.map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => setSelectedRange(opt.key)}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors ${selectedRange === opt.key ? 'bg-ob-purple/10 text-ob-purple font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                  <button
                    onClick={() => setSelectedRange('custom')}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors ${selectedRange === 'custom' ? 'bg-ob-purple/10 text-ob-purple font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    Custom Range
                  </button>
                  {selectedRange === 'custom' && (
                    <div className="flex gap-2 mt-2">
                      <input
                        type="date"
                        value={customStart}
                        onChange={e => setCustomStart(e.target.value)}
                        className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:border-ob-purple outline-none"
                        placeholder="Start"
                      />
                      <input
                        type="date"
                        value={customEnd}
                        onChange={e => setCustomEnd(e.target.value)}
                        className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:border-ob-purple outline-none"
                        placeholder="End"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Export Format Options */}
          <div className="p-1">
            <button onClick={() => handleExport('csv')} className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 rounded-lg transition-colors">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-900">Download as CSV</p>
                <p className="text-[10px] text-gray-400">Opens in Excel, Google Sheets, Numbers</p>
              </div>
            </button>
            <button onClick={() => handleExport('excel')} className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 rounded-lg transition-colors">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-900">Download as Excel</p>
                <p className="text-[10px] text-gray-400">Formatted .xls with styles and headers</p>
              </div>
            </button>
            <button onClick={() => handleExport('json')} className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 rounded-lg transition-colors">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-900">Download as JSON</p>
                <p className="text-[10px] text-gray-400">For developers and data integration</p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

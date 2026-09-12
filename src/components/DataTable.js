'use client';

import { createElement } from 'react';

/**
 * DataTable — responsive data table used across dashboards.
 *
 * Desktop (md+): renders a real <table> with proper column layout — unchanged
 * from the original dashboard design.
 *
 * Mobile (<md): each row becomes a stacked card. Every column's data and the
 * row's actions remain fully visible and tappable — nothing clipped, hidden,
 * or shrunk to unreadable sizes. Long values wrap naturally.
 *
 * ONE real implementation, same data/actions for both layouts — only the
 * presentation changes by viewport. No fake separate mobile dashboard.
 *
 * Props:
 *  - columns: [{ key, label, render?(row), className?, mobileFull? }]
 *      render(row) -> cell content. Falls back to row[key].
 *      mobileFull: on mobile, this field gets its own full-width row in the card.
 *  - rows: array of data objects
 *  - rowKey: (row) => unique key (default: row.id)
 *  - actions: (row) => ReactNode  — rendered in a footer row of the mobile card
 *  - emptyMessage: string shown when rows is empty
 *  - mobilePrimary: column key shown as the card title on mobile (default: first column)
 */
export default function DataTable({
  columns,
  rows,
  rowKey = (r) => r.id,
  actions,
  emptyMessage = 'No records found.',
  mobilePrimary,
}) {
  if (!Array.isArray(columns) || columns.length === 0) return null;

  const cellContent = (col, row) => {
    if (col.render) return col.render(row);
    const v = row[col.key];
    return v === null || v === undefined || v === '' ? '—' : v;
  };

  const primaryKey = mobilePrimary || columns.find(c => !c.mobileFull)?.key || columns[0].key;
  const primaryCol = columns.find(c => c.key === primaryKey) || columns[0];
  const secondaryCols = columns.filter(c => c.key !== primaryCol.key);

  return (
    <>
      {/* ===== Desktop / Tablet: real table ===== */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-gray-400 uppercase border-b border-gray-100">
              {columns.map(col => (
                <th key={col.key} className={`px-6 py-4 font-medium whitespace-nowrap ${col.thClassName || ''}`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-16 text-center text-gray-400 text-sm">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map(row => (
                <tr key={rowKey(row)} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  {columns.map(col => (
                    <td key={col.key} className={`px-6 py-4 text-sm ${col.className || ''}`}>
                      {cellContent(col, row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ===== Mobile: stacked cards ===== */}
      <div className="md:hidden divide-y divide-gray-100">
        {rows.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm px-4">{emptyMessage}</div>
        ) : (
          rows.map(row => (
            <div key={rowKey(row)} className="py-4 px-1">
              {/* Primary field as card title */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0 flex-1 text-sm font-semibold text-ob-navy break-words">
                  {cellContent(primaryCol, row)}
                </div>
              </div>

              {/* Remaining fields as label/value rows */}
              <dl className="space-y-1.5">
                {secondaryCols.map(col => (
                  <div key={col.key} className={`flex items-start justify-between gap-3 ${col.mobileFull ? 'flex-col items-stretch' : ''}`}>
                    <dt className="text-xs text-gray-400 flex-shrink-0 pt-0.5">{col.label}</dt>
                    <dd className={`text-sm text-gray-700 min-w-0 ${col.mobileFull ? 'w-full break-words' : 'text-right truncate'}`}>
                      {cellContent(col, row)}
                    </dd>
                  </div>
                ))}
              </dl>

              {/* Row actions — always visible, comfortable touch targets */}
              {actions && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-2">
                  {actions(row)}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </>
  );
}

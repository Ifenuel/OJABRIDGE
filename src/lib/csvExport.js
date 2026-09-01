/**
 * ============================================
 * OJABRIDGE CSV EXPORT UTILITY
 * ============================================
 * Generates professional CSV files with OjaBridge header branding.
 * 
 * Usage:
 *   import { exportCsv } from '@/lib/csvExport';
 *   exportCsv({ title: 'Payments Report', columns, rows, filename });
 */

function escapeCsvField(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-NG', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch {
    return String(dateStr);
  }
}

function formatCurrency(amount, currency = 'NGN') {
  const num = Number(amount) || 0;
  const symbols = { NGN: '₦', USD: '$', GBP: '£', EUR: '€' };
  return `${symbols[currency] || '₦'}${num.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/**
 * Export data to a branded CSV file and trigger download
 * 
 * @param {Object} options
 * @param {string} options.title - Report title (e.g., "Payments Report")
 * @param {Array} options.columns - Column definitions: [{ key, label, format? }]
 * @param {Array} options.rows - Data rows (array of objects)
 * @param {string} options.filename - Download filename (without .csv)
 * @param {Object} options.summary - Optional summary stats [{ label, value }]
 */
export function exportCsv({ title, columns, rows, filename, summary = [] }) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });

  const lines = [];

  // === OJABRIDGE HEADER ===
  lines.push('OjaBridge — Official Report');
  lines.push(`Report: ${title}`);
  lines.push(`Generated: ${dateStr} at ${timeStr}`);
  lines.push(`Total Records: ${rows.length}`);
  lines.push('');

  // === SUMMARY STATS (if provided) ===
  if (summary.length > 0) {
    summary.forEach(s => {
      lines.push(`${s.label}: ${s.value}`);
    });
    lines.push('');
  }

  // === COLUMN HEADERS ===
  const headerRow = columns.map(c => escapeCsvField(c.label)).join(',');
  lines.push(headerRow);

  // === DATA ROWS ===
  rows.forEach(row => {
    const cells = columns.map(col => {
      let value = row[col.key];
      if (col.format) {
        value = col.format(value, row);
      }
      return escapeCsvField(value);
    });
    lines.push(cells.join(','));
  });

  // === FOOTER ===
  lines.push('');
  lines.push('---');
  lines.push('OjaBridge — Shop • Connect • Grow');
  lines.push('This report was generated from the OjaBridge Admin Dashboard.');
  lines.push('For questions, contact: support@ojabridge.com');

  // Create and download file
  const csvContent = '\uFEFF' + lines.join('\n'); // BOM for Excel UTF-8 support
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename || title.replace(/\s+/g, '_').toLowerCase()}_${now.toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export { formatDate, formatCurrency };

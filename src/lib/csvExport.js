/**
 * ============================================
 * OJABRIDGE EXPORT UTILITY
 * ============================================
 * Generates professional exports in multiple formats:
 *   - CSV (universal, opens in any spreadsheet app)
 *   - Excel XML Spreadsheet (.xls — opens natively in Excel)
 *   - JSON (for developers / data integration)
 * 
 * All exports include OjaBridge branded headers.
 * 
 * Usage:
 *   import { exportData, formatDate, formatCurrency } from '@/lib/csvExport';
 *   exportData({ format: 'csv', title: 'Payments Report', columns, rows, filename });
 * 
 * For date range filtering:
 *   import { filterByDateRange } from '@/lib/csvExport';
 *   const filtered = filterByDateRange(data, startDate, endDate, 'created_at');
 */

function escapeCsvField(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function escapeXml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-NG', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch {
    return String(dateStr);
  }
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleString('en-NG', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return String(dateStr);
  }
}

export function formatCurrency(amount, currency = 'NGN') {
  const num = Number(amount) || 0;
  const symbols = { NGN: '₦', USD: '$', GBP: '£', EUR: '€' };
  return `${symbols[currency] || '₦'}${num.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/**
 * Filter an array of objects by date range
 * @param {Array} data - Array of objects with a date field
 * @param {string|null} startDate - ISO date string or null for no start
 * @param {string|null} endDate - ISO date string or null for no end
 * @param {string} dateField - The field name containing the date (default: 'created_at')
 * @returns {Array} Filtered data
 */
export function filterByDateRange(data, startDate, endDate, dateField = 'created_at') {
  if (!startDate && !endDate) return data;
  return data.filter(item => {
    const date = new Date(item[dateField]);
    if (isNaN(date.getTime())) return false;
    if (startDate && date < new Date(startDate)) return false;
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (date > end) return false;
    }
    return true;
  });
}

function getExportMeta(title, rows, summary, dateRange) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
  
  let dateRangeLabel = 'All Time';
  if (dateRange?.start && dateRange?.end) {
    dateRangeLabel = `${formatDate(dateRange.start)} — ${formatDate(dateRange.end)}`;
  } else if (dateRange?.start) {
    dateRangeLabel = `From ${formatDate(dateRange.start)}`;
  } else if (dateRange?.end) {
    dateRangeLabel = `Up to ${formatDate(dateRange.end)}`;
  } else if (dateRange?.label) {
    dateRangeLabel = dateRange.label;
  }

  return { dateStr, timeStr, dateRangeLabel, totalRecords: rows.length, summary };
}

/**
 * Export data in the specified format
 * 
 * @param {Object} options
 * @param {string} options.format - 'csv' | 'excel' | 'json' (default: 'csv')
 * @param {string} options.title - Report title
 * @param {Array} options.columns - Column definitions: [{ key, label, format? }]
 * @param {Array} options.rows - Data rows
 * @param {string} options.filename - Download filename (without extension)
 * @param {Array} options.summary - Optional summary stats [{ label, value }]
 * @param {Object} options.dateRange - Optional { start, end, label } for date filtering display
 */
export function exportData({ format = 'csv', title, columns, rows, filename, summary = [], dateRange }) {
  const baseName = filename || title.replace(/\s+/g, '_').toLowerCase();
  const meta = getExportMeta(title, rows, summary, dateRange);

  switch (format) {
    case 'excel':
      return exportExcel({ title, columns, rows, baseName, meta });
    case 'json':
      return exportJson({ title, columns, rows, baseName, meta });
    case 'csv':
    default:
      return exportCsv({ title, columns, rows, filename: baseName, summary, dateRange });
  }
}

/**
 * Export as CSV (original format, enhanced)
 */
export function exportCsv({ title, columns, rows, filename, summary = [], dateRange }) {
  const meta = getExportMeta(title, rows, summary, dateRange);
  const lines = [];

  // === OJABRIDGE HEADER ===
  lines.push('OjaBridge — Official Report');
  lines.push(`Report: ${title}`);
  lines.push(`Generated: ${meta.dateStr} at ${meta.timeStr}`);
  lines.push(`Date Range: ${meta.dateRangeLabel}`);
  lines.push(`Total Records: ${meta.totalRecords}`);
  lines.push('');

  // === SUMMARY STATS (if provided) ===
  if (summary.length > 0) {
    lines.push('--- Summary ---');
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
  lines.push('OjaBridge — Shop · Connect · Grow');
  lines.push('This report was generated from the OjaBridge Dashboard.');
  lines.push('For questions, contact: support@ojabridge.com');

  // Create and download file
  const csvContent = '\uFEFF' + lines.join('\n'); // BOM for Excel UTF-8 support
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, `${baseName(title, filename)}_${dateStamp()}.csv`);
}

/**
 * Export as Excel XML Spreadsheet (.xls)
 * Opens natively in Microsoft Excel, Google Sheets, LibreOffice
 */
function exportExcel({ title, columns, rows, baseName, meta }) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<?mso-application progid="Excel.Sheet"?>\n';
  xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n';
  xml += '  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n';
  
  // Styles
  xml += '<Styles>\n';
  xml += '  <Style ss:ID="header"><Font ss:Bold="1" ss:Size="11" ss:Color="#FFFFFF"/><Interior ss:Color="#2D1B69" ss:Pattern="Solid"/></Style>\n';
  xml += '  <Style ss:ID="title"><Font ss:Bold="1" ss:Size="14" ss:Color="#2D1B69"/></Style>\n';
  xml += '  <Style ss:ID="subtitle"><Font ss:Bold="1" ss:Size="10" ss:Color="#6B7280"/></Style>\n';
  xml += '  <Style ss:ID="summary"><Font ss:Bold="1" ss:Size="10" ss:Color="#374151"/></Style>\n';
  xml += '  <Style ss:ID="currency"><NumberFormat ss:Format="&#x20A6;#,##0"/></Style>\n';
  xml += '  <Style ss:ID="date"><NumberFormat ss:Format="dd-mmm-yyyy"/></Style>\n';
  xml += '  <Style ss:ID="normal"><Font ss:Size="10"/></Style>\n';
  xml += '  <Style ss:ID="footer"><Font ss:Italic="1" ss:Size="9" ss:Color="#9CA3AF"/></Style>\n';
  xml += '</Styles>\n';

  // Report Info Sheet
  xml += '<Worksheet ss:Name="Report">\n<Table>\n';
  
  // Title row
  xml += `<Row><Cell ss:StyleID="title" ss:MergeAcross="${columns.length - 1}"><Data ss:Type="String">OjaBridge — ${escapeXml(title)}</Data></Cell></Row>\n`;
  xml += `<Row><Cell ss:StyleID="subtitle" ss:MergeAcross="${columns.length - 1}"><Data ss:Type="String">Generated: ${meta.dateStr} at ${meta.timeStr}</Data></Cell></Row>\n`;
  xml += `<Row><Cell ss:StyleID="subtitle" ss:MergeAcross="${columns.length - 1}"><Data ss:Type="String">Date Range: ${meta.dateRangeLabel} | Total Records: ${meta.totalRecords}</Data></Cell></Row>\n`;
  xml += '<Row><Cell></Cell></Row>\n';

  // Summary if provided
  if (meta.summary && meta.summary.length > 0) {
    meta.summary.forEach(s => {
      xml += `<Row><Cell ss:StyleID="summary"><Data ss:Type="String">${escapeXml(s.label)}:</Data></Cell><Cell ss:StyleID="normal"><Data ss:Type="String">${escapeXml(String(s.value))}</Data></Cell></Row>\n`;
    });
    xml += '<Row><Cell></Cell></Row>\n';
  }

  // Column headers
  xml += '<Row>';
  columns.forEach(col => {
    xml += `<Cell ss:StyleID="header"><Data ss:Type="String">${escapeXml(col.label)}</Data></Cell>`;
  });
  xml += '</Row>\n';

  // Data rows
  rows.forEach(row => {
    xml += '<Row>';
    columns.forEach(col => {
      let value = row[col.key];
      if (col.format) value = col.format(value, row);
      
      // Detect numeric values for proper Excel formatting
      const rawNum = typeof row[col.key] === 'number' ? row[col.key] : parseFloat(String(row[col.key]).replace(/[₦$£€,]/g, ''));
      if (!isNaN(rawNum) && typeof row[col.key] === 'number') {
        xml += `<Cell ss:StyleID="currency"><Data ss:Type="Number">${rawNum}</Data></Cell>`;
      } else {
        xml += `<Cell ss:StyleID="normal"><Data ss:Type="String">${escapeXml(String(value || ''))}</Data></Cell>`;
      }
    });
    xml += '</Row>\n';
  });

  // Footer
  xml += '<Row><Cell></Cell></Row>\n';
  xml += `<Row><Cell ss:StyleID="footer" ss:MergeAcross="${columns.length - 1}"><Data ss:Type="String">OjaBridge — Shop · Connect · Grow | Generated from OjaBridge Dashboard | support@ojabridge.com</Data></Cell></Row>\n`;

  xml += '</Table>\n</Worksheet>\n</Workbook>';

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  triggerDownload(blob, `${baseName}_${dateStamp()}.xls`);
}

/**
 * Export as JSON (for developers / API integration)
 */
function exportJson({ title, columns, rows, baseName, meta }) {
  const exportData = {
    ojabridge_report: true,
    title,
    generated_at: new Date().toISOString(),
    date_range: meta.dateRangeLabel,
    total_records: meta.totalRecords,
    summary: meta.summary,
    columns: columns.map(c => ({ key: c.key, label: c.label })),
    data: rows.map(row => {
      const obj = {};
      columns.forEach(col => {
        let value = row[col.key];
        if (col.format) value = col.format(value, row);
        obj[col.key] = value;
      });
      return obj;
    }),
    footer: {
      platform: 'OjaBridge',
      tagline: 'Shop · Connect · Grow',
      support: 'support@ojabridge.com',
    },
  };

  const jsonStr = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  triggerDownload(blob, `${baseName}_${dateStamp()}.json`);
}

/**
 * Download helper
 */
function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function baseName(title, filename) {
  return filename || title.replace(/\s+/g, '_').toLowerCase();
}

function dateStamp() {
  return new Date().toISOString().slice(0, 10);
}

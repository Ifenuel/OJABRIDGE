'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line,
} from 'recharts';

const COLORS = ['#5B21B6', '#7ED321', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4'];

/**
 * Reusable Bar Chart — revenue, orders, etc.
 */
export function DashboardBarChart({ data, title, xKey = 'name', yKey = 'value', color = '#5B21B6', height = 280 }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl border border-gray-100">
        {title && <h3 className="font-bold text-ob-navy mb-4">{title}</h3>}
        <div className="flex items-center justify-center" style={{ height }}>
          <p className="text-gray-400 text-sm">No data available yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100">
      {title && <h3 className="font-bold text-ob-navy mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey={xKey} tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: '1px solid #f0f0f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
            labelStyle={{ fontWeight: 600, color: '#1a1a2e' }}
          />
          <Bar dataKey={yKey} fill={color} radius={[6, 6, 0, 0]} maxBarSize={50} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Reusable Pie Chart — order status, user distribution, etc.
 */
export function DashboardPieChart({ data, title, height = 280, innerRadius = 60, outerRadius = 100 }) {
  if (!data || data.length === 0 || data.every(d => d.value === 0)) {
    return (
      <div className="bg-white p-6 rounded-xl border border-gray-100">
        {title && <h3 className="font-bold text-ob-navy mb-4">{title}</h3>}
        <div className="flex items-center justify-center" style={{ height }}>
          <p className="text-gray-400 text-sm">No data available yet</p>
        </div>
      </div>
    );
  }

  const renderLabel = ({ name, percent }) => {
    if (percent < 0.05) return null;
    return `${name} ${(percent * 100).toFixed(0)}%`;
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100">
      {title && <h3 className="font-bold text-ob-navy mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            dataKey="value"
            label={renderLabel}
            labelLine={false}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ borderRadius: 12, border: '1px solid #f0f0f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
          />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Reusable Line Chart — trends over time
 */
export function DashboardLineChart({ data, title, lines = [{ key: 'value', color: '#5B21B6', name: 'Value' }], xKey = 'name', height = 280 }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl border border-gray-100">
        {title && <h3 className="font-bold text-ob-navy mb-4">{title}</h3>}
        <div className="flex items-center justify-center" style={{ height }}>
          <p className="text-gray-400 text-sm">No data available yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100">
      {title && <h3 className="font-bold text-ob-navy mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey={xKey} tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: '1px solid #f0f0f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
          />
          {lines.map((l, i) => (
            <Line key={i} type="monotone" dataKey={l.key} stroke={l.color} strokeWidth={2.5} dot={{ r: 3, fill: l.color }} name={l.name || l.key} />
          ))}
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Stat Card — reusable metric card
 */
export function StatCard({ label, value, change, icon, color = 'text-ob-purple', delay = 0 }) {
  return (
    <div
      className="bg-white p-5 rounded-xl border border-gray-100 hover:shadow-md transition-all duration-300"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          {change && <p className="text-xs text-gray-400 mt-1">{change}</p>}
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
}

/**
 * Export Button — CSV / PDF / Print
 */
export function ExportButton({ data, filename = 'export', columns, label = 'Export' }) {
  const exportCSV = () => {
    if (!data || data.length === 0) return;
    const cols = columns || Object.keys(data[0]);
    const csvHeader = cols.join(',');
    const csvRows = data.map(row => cols.map(c => {
      let val = row[c] ?? '';
      val = String(val).replace(/"/g, '""');
      return `"${val}"`;
    }).join(','));
    const csv = [csvHeader, ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    if (!data || data.length === 0) return;
    const cols = columns || Object.keys(data[0]);
    let html = `<html><head><title>${filename}</title><style>
      body{font-family:Arial,sans-serif;padding:20px}
      h1{font-size:20px;color:#5B21B6;margin-bottom:5px}
      p{color:#666;font-size:12px;margin-bottom:20px}
      table{width:100%;border-collapse:collapse}
      th{background:#5B21B6;color:#fff;padding:10px 12px;text-align:left;font-size:12px}
      td{padding:8px 12px;border-bottom:1px solid #eee;font-size:12px}
      tr:nth-child(even){background:#f9f9f9}
      .footer{margin-top:30px;font-size:10px;color:#999;text-align:center}
    </style></head><body>
    <h1>OjaBridge — ${filename}</h1>
    <p>Generated on ${new Date().toLocaleDateString('en-NG', { year:'numeric', month:'long', day:'numeric' })} at ${new Date().toLocaleTimeString('en-NG')}</p>
    <table><thead><tr>${cols.map(c => `<th>${c.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</th>`).join('')}</tr></thead>
    <tbody>${data.map(row => `<tr>${cols.map(c => `<td>${row[c] ?? ''}</td>`).join('')}</tr>`).join('')}</tbody></table>
    <div class="footer">Generated by OjaBridge Platform &copy; ${new Date().getFullYear()}</div>
    </body></html>`;
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.print();
  };

  return (
    <div className="relative group inline-flex">
      <button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:border-ob-purple hover:text-ob-purple transition-all">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        {label}
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>
      <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg py-1 min-w-[160px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
        <button onClick={exportCSV} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          Download CSV
        </button>
        <button onClick={exportPDF} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
          Download PDF
        </button>
      </div>
    </div>
  );
}

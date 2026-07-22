/**
 * Build a CSV string from a homogeneous list of rows and trigger a browser
 * download. Handles RFC-4180-style escaping: fields that contain a comma,
 * double-quote, CR, or LF are wrapped in quotes and embedded quotes doubled.
 */

export function buildCSV(rows: Record<string, any>[], columns?: string[]): string {
  if (!rows || rows.length === 0) { return ''; }
  const cols = columns && columns.length ? columns : Object.keys(rows[0]);
  const header = cols.map(escapeField).join(',');
  const body = rows.map(r => cols.map(c => escapeField(r?.[c])).join(',')).join('\r\n');
  return `${header}\r\n${body}`;
}

export function exportToCSV(
  rows: Record<string, any>[],
  filename: string,
  columns?: string[],
): void {
  const csv = buildCSV(rows, columns);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, filename);
}

export function exportToJSON(payload: unknown, filename: string): void {
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  triggerDownload(blob, filename);
}

function escapeField(value: any): string {
  if (value === null || value === undefined) { return ''; }
  const str = typeof value === 'string' ? value : String(value);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function triggerDownload(blob: Blob, filename: string): void {
  if (typeof document === 'undefined') { return; }
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

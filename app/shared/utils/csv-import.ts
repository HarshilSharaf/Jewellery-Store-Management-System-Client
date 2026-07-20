/**
 * RFC-4180-ish CSV parser. Hand-rolled to avoid a runtime dependency.
 *
 * - Delimiter is a literal comma.
 * - Fields may be wrapped in double quotes; a literal quote inside a quoted
 *   field is escaped by doubling: `""`.
 * - Row terminators may be CRLF, LF, or CR; a bare CR inside a quoted field
 *   is preserved verbatim.
 * - The first non-empty row is treated as headers unless `hasHeader` is set
 *   to false. When headers exist, rows are returned as `Record<string,string>`
 *   keyed by header name; when they don't, rows are keyed as `col_0`, `col_1`.
 */

export interface CsvParseOptions {
  hasHeader?: boolean;
}

export interface CsvParseResult {
  headers: string[];
  rows: Record<string, string>[];
  errors: string[];
}

export function parseCSV(input: string, options: CsvParseOptions = {}): CsvParseResult {
  const errors: string[] = [];
  const rows: string[][] = [];

  if (input == null) {
    return { headers: [], rows: [], errors: ['input was null'] };
  }

  const text = input.replace(/^﻿/, '');
  const len = text.length;

  let i = 0;
  let field = '';
  let row: string[] = [];
  let inQuotes = false;

  while (i < len) {
    const ch = text.charCodeAt(i);

    if (inQuotes) {
      if (ch === 34) {
        if (i + 1 < len && text.charCodeAt(i + 1) === 34) {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += text[i];
      i += 1;
      continue;
    }

    if (ch === 34) {
      inQuotes = true;
      i += 1;
      continue;
    }

    if (ch === 44) {
      row.push(field);
      field = '';
      i += 1;
      continue;
    }

    if (ch === 13 || ch === 10) {
      row.push(field);
      rows.push(row);
      field = '';
      row = [];
      if (ch === 13 && i + 1 < len && text.charCodeAt(i + 1) === 10) {
        i += 2;
      } else {
        i += 1;
      }
      continue;
    }

    field += text[i];
    i += 1;
  }

  if (inQuotes) {
    errors.push('unterminated quoted field at end of input');
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const nonEmpty = rows.filter(r => !(r.length === 1 && r[0] === ''));
  if (nonEmpty.length === 0) {
    return { headers: [], rows: [], errors };
  }

  const hasHeader = options.hasHeader !== false;
  let headers: string[];
  let dataRows: string[][];

  if (hasHeader) {
    headers = nonEmpty[0].map(h => (h ?? '').trim());
    dataRows = nonEmpty.slice(1);
  } else {
    const width = Math.max(...nonEmpty.map(r => r.length));
    headers = Array.from({ length: width }, (_, idx) => `col_${idx}`);
    dataRows = nonEmpty;
  }

  const width = headers.length;
  const out: Record<string, string>[] = dataRows.map((r, idx) => {
    const rec: Record<string, string> = {};
    for (let c = 0; c < width; c++) {
      rec[headers[c] || `col_${c}`] = r[c] ?? '';
    }
    if (r.length > width) {
      errors.push(`row ${idx + (hasHeader ? 2 : 1)} has ${r.length} fields, expected ${width}`);
    }
    return rec;
  });

  return { headers, rows: out, errors };
}

export async function parseCSVFile(file: File, options: CsvParseOptions = {}): Promise<CsvParseResult> {
  const text = await file.text();
  return parseCSV(text, options);
}

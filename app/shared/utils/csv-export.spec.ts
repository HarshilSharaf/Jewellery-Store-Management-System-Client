import { buildCSV } from './csv-export';

describe('buildCSV', () => {
  it('returns an empty string for an empty row list', () => {
    expect(buildCSV([])).toBe('');
  });

  it('emits a header row followed by data rows using object keys', () => {
    const rows = [
      { name: 'Alice', qty: 1 },
      { name: 'Bob',   qty: 2 },
    ];
    expect(buildCSV(rows)).toBe('name,qty\r\nAlice,1\r\nBob,2');
  });

  it('escapes commas, quotes, and newlines with RFC-4180 quoting', () => {
    const rows = [
      { label: 'A, B', note: 'She said "hi"', tail: 'line1\nline2' },
    ];
    expect(buildCSV(rows)).toBe(
      'label,note,tail\r\n"A, B","She said ""hi""","line1\nline2"'
    );
  });

  it('honours an explicit column ordering + fills nullish cells with empty strings', () => {
    const rows = [
      { date: '2026-07-20', total: 1200, note: null },
      { date: '2026-07-21', total: 3400, note: undefined },
    ];
    expect(buildCSV(rows, ['note', 'date', 'total'])).toBe(
      'note,date,total\r\n,2026-07-20,1200\r\n,2026-07-21,3400'
    );
  });
});

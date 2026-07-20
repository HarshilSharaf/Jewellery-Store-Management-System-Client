import { parseCSV } from './csv-import';

describe('parseCSV', () => {
  it('parses a basic CSV with a header row', () => {
    const csv = 'name,qty\nAlice,1\nBob,2';
    const result = parseCSV(csv);
    expect(result.headers).toEqual(['name', 'qty']);
    expect(result.rows).toEqual([
      { name: 'Alice', qty: '1' },
      { name: 'Bob', qty: '2' },
    ]);
    expect(result.errors.length).toBe(0);
  });

  it('preserves commas inside quoted fields', () => {
    const csv = 'name,address\n"Alice","221B, Baker St"\nBob,"Sherlock Holmes, London"';
    const result = parseCSV(csv);
    expect(result.rows).toEqual([
      { name: 'Alice',   address: '221B, Baker St' },
      { name: 'Bob',     address: 'Sherlock Holmes, London' },
    ]);
  });

  it('handles doubled quotes as an escaped literal quote', () => {
    const csv = 'note\n"She said ""hi"" today"';
    const result = parseCSV(csv);
    expect(result.rows).toEqual([{ note: 'She said "hi" today' }]);
  });

  it('handles CRLF row terminators', () => {
    const csv = 'a,b\r\n1,2\r\n3,4\r\n';
    const result = parseCSV(csv);
    expect(result.rows).toEqual([
      { a: '1', b: '2' },
      { a: '3', b: '4' },
    ]);
  });

  it('treats empty cells as empty strings', () => {
    const csv = 'a,b,c\n,x,\n,,';
    const result = parseCSV(csv);
    expect(result.rows).toEqual([
      { a: '', b: 'x', c: '' },
      { a: '', b: '',  c: '' },
    ]);
  });
});

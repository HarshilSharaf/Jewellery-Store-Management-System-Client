import { escapeXml, buildDayBookXml, buildSalesRegisterXml } from './tally-xml';
import { DayBookRow } from '../../interfaces/Reports/report-day-book';
import { SalesRegisterRow } from '../../interfaces/Reports/report-sales-register';

describe('escapeXml', () => {
  it('escapes the five XML special characters', () => {
    expect(escapeXml(`<M&M's "co">'`)).toBe('&lt;M&amp;M&apos;s &quot;co&quot;&gt;&apos;');
  });
});

describe('buildDayBookXml', () => {
  it('wraps output in an <ENVELOPE> root with Tally headers', () => {
    const xml = buildDayBookXml([]);
    expect(xml.trim().startsWith('<?xml')).toBe(true);
    expect(xml).toContain('<ENVELOPE>');
    expect(xml).toContain('<TALLYREQUEST>Import Data</TALLYREQUEST>');
    expect(xml).toContain('<REPORTNAME>Vouchers</REPORTNAME>');
  });

  it('emits one <VOUCHER> per non-zero payment bucket', () => {
    const rows: DayBookRow[] = [
      { txDate: '2026-07-20', cash: 1000, cheque: 0, upi: 500, card: 0, online: 0, total: 1500, invoiceCount: 2, totalTaxableValue: 1300 },
      { txDate: '2026-07-21', cash: 0,    cheque: 800, upi: 0, card: 200, online: 100, total: 1100, invoiceCount: 3, totalTaxableValue: 950 },
    ];
    const xml = buildDayBookXml(rows);
    const voucherCount = (xml.match(/<VOUCHER /g) || []).length;
    expect(voucherCount).toBe(5);
  });
});

describe('buildSalesRegisterXml', () => {
  const salesRow: SalesRegisterRow = {
    id: 1,
    invoiceGuid: 'g1',
    invoiceNumber: 'INV/001',
    invoiceDate: '2026-07-20',
    customerName: 'Ramesh & Sons',
    customerGstin: '27AAACR5055K1Z5',
    customerPan: null,
    customerState: 'Maharashtra',
    customerStateCode: '27',
    placeOfSupply: 'Maharashtra',
    hsn: '7113',
    subTotalTaxable: 10000,
    cgstAmount: 150,
    sgstAmount: 150,
    igstAmount: 0,
    totalMakingCharge: 500,
    totalStoneCharge: 0,
    totalWastageCharge: 0,
    totalDiscount: 0,
    oldGoldCredit: 0,
    roundOffAmount: 0,
    grandTotal: 10300,
    status: 'paid',
    invoiceType: 'B2B',
  };

  it('emits one <VOUCHER> per invoice row and escapes special characters', () => {
    const xml = buildSalesRegisterXml([salesRow, { ...salesRow, id: 2, invoiceNumber: 'INV/002' }]);
    const voucherCount = (xml.match(/<VOUCHER /g) || []).length;
    expect(voucherCount).toBe(2);
    expect(xml).toContain('Ramesh &amp; Sons');
    expect(xml).toContain('<PARTYGSTIN>27AAACR5055K1Z5</PARTYGSTIN>');
  });

  it('formats currency amounts with two decimals', () => {
    const xml = buildSalesRegisterXml([salesRow]);
    expect(xml).toContain('<AMOUNT>10000.00</AMOUNT>');
    expect(xml).toContain('<AMOUNT>-10300.00</AMOUNT>');
    expect(xml).toContain('<AMOUNT>150.00</AMOUNT>');
  });
});

import { DayBookRow } from '../../interfaces/Reports/report-day-book';
import { SalesRegisterRow } from '../../interfaces/Reports/report-sales-register';

export function escapeXml(input: string | number | null | undefined): string {
  if (input === null || input === undefined) { return ''; }
  const str = typeof input === 'string' ? input : String(input);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatDateTally(iso: string): string {
  if (!iso) { return ''; }
  const d = iso.slice(0, 10).replace(/-/g, '');
  return d.length === 8 ? d : iso;
}

function formatAmount(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) { return '0.00'; }
  return n.toFixed(2);
}

interface PaymentBucket { ledger: string; amount: number; }

function paymentBuckets(row: DayBookRow): PaymentBucket[] {
  const out: PaymentBucket[] = [];
  if (Number(row.cash))   { out.push({ ledger: 'Cash',            amount: Number(row.cash) }); }
  if (Number(row.cheque)) { out.push({ ledger: 'Bank Account',    amount: Number(row.cheque) }); }
  if (Number(row.upi))    { out.push({ ledger: 'UPI Suspense',    amount: Number(row.upi) }); }
  if (Number(row.card))   { out.push({ ledger: 'Card Suspense',   amount: Number(row.card) }); }
  if (Number(row.online)) { out.push({ ledger: 'Online Suspense', amount: Number(row.online) }); }
  return out;
}

export function buildDayBookXml(rows: DayBookRow[]): string {
  const vouchers: string[] = [];

  for (const row of rows) {
    const date = formatDateTally(row.txDate);
    for (const bucket of paymentBuckets(row)) {
      const total = formatAmount(bucket.amount);
      const negTotal = formatAmount(-bucket.amount);
      vouchers.push(
`      <VOUCHER VCHTYPE="Receipt" ACTION="Create">
        <DATE>${escapeXml(date)}</DATE>
        <VOUCHERTYPENAME>Receipt</VOUCHERTYPENAME>
        <NARRATION>Day-book receipt for ${escapeXml(row.txDate)} via ${escapeXml(bucket.ledger)}</NARRATION>
        <PARTYLEDGERNAME>${escapeXml(bucket.ledger)}</PARTYLEDGERNAME>
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>${escapeXml(bucket.ledger)}</LEDGERNAME>
          <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
          <AMOUNT>-${total}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>Sundry Debtors</LEDGERNAME>
          <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
          <AMOUNT>${negTotal.replace(/^-/, '')}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>
      </VOUCHER>`
      );
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
      </REQUESTDESC>
      <REQUESTDATA>
${vouchers.join('\n')}
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

export function buildSalesRegisterXml(rows: SalesRegisterRow[]): string {
  const vouchers: string[] = [];

  for (const row of rows) {
    const date = formatDateTally(row.invoiceDate);
    const taxable = Number(row.subTotalTaxable) || 0;
    const cgst    = Number(row.cgstAmount) || 0;
    const sgst    = Number(row.sgstAmount) || 0;
    const igst    = Number(row.igstAmount) || 0;
    const grand   = Number(row.grandTotal) || 0;
    const partyLedger = row.customerName || 'Cash Sales';
    const salesLedger = 'Sales - Jewellery';

    const invEntries: string[] = [];
    invEntries.push(
`          <ALLINVENTORYENTRIES.LIST>
            <STOCKITEMNAME>${escapeXml(`HSN ${row.hsn} - ${row.invoiceType}`)}</STOCKITEMNAME>
            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
            <RATE>${formatAmount(taxable)}/nos</RATE>
            <ACTUALQTY>1 nos</ACTUALQTY>
            <BILLEDQTY>1 nos</BILLEDQTY>
            <AMOUNT>${formatAmount(taxable)}</AMOUNT>
            <ACCOUNTINGALLOCATIONS.LIST>
              <LEDGERNAME>${escapeXml(salesLedger)}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>${formatAmount(taxable)}</AMOUNT>
            </ACCOUNTINGALLOCATIONS.LIST>
          </ALLINVENTORYENTRIES.LIST>`
    );

    const ledgerEntries: string[] = [];
    ledgerEntries.push(
`        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>${escapeXml(partyLedger)}</LEDGERNAME>
          <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
          <AMOUNT>-${formatAmount(grand)}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>`
    );
    ledgerEntries.push(
`        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>${escapeXml(salesLedger)}</LEDGERNAME>
          <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
          <AMOUNT>${formatAmount(taxable)}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>`
    );
    if (cgst) {
      ledgerEntries.push(
`        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>CGST @ 1.5%</LEDGERNAME>
          <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
          <AMOUNT>${formatAmount(cgst)}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>`
      );
    }
    if (sgst) {
      ledgerEntries.push(
`        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>SGST @ 1.5%</LEDGERNAME>
          <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
          <AMOUNT>${formatAmount(sgst)}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>`
      );
    }
    if (igst) {
      ledgerEntries.push(
`        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>IGST @ 3%</LEDGERNAME>
          <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
          <AMOUNT>${formatAmount(igst)}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>`
      );
    }

    vouchers.push(
`      <VOUCHER VCHTYPE="Sales" ACTION="Create">
        <DATE>${escapeXml(date)}</DATE>
        <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
        <VOUCHERNUMBER>${escapeXml(row.invoiceNumber)}</VOUCHERNUMBER>
        <REFERENCE>${escapeXml(row.invoiceNumber)}</REFERENCE>
        <PARTYLEDGERNAME>${escapeXml(partyLedger)}</PARTYLEDGERNAME>
        <PARTYNAME>${escapeXml(row.customerName)}</PARTYNAME>
        <PLACEOFSUPPLY>${escapeXml(row.placeOfSupply ?? '')}</PLACEOFSUPPLY>
        <PARTYGSTIN>${escapeXml(row.customerGstin ?? '')}</PARTYGSTIN>
        <NARRATION>Invoice ${escapeXml(row.invoiceNumber)} • ${escapeXml(row.invoiceType)}</NARRATION>
${ledgerEntries.join('\n')}
${invEntries.join('\n')}
      </VOUCHER>`
    );
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
      </REQUESTDESC>
      <REQUESTDATA>
${vouchers.join('\n')}
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

export function downloadXml(xml: string, filename: string): void {
  if (typeof document === 'undefined') { return; }
  const blob = new Blob([xml], { type: 'application/xml;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

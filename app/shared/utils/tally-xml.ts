import { DayBookRow } from '../../interfaces/Reports/report-day-book';
import { SalesRegisterRow } from '../../interfaces/Reports/report-sales-register';

// Single generic stock item used across all sales vouchers. Users create this
// once in Tally Prime under Stock Group "Jewellery"; every sales voucher
// references it. Synthetic identifiers (e.g. "HSN 7113 - B2B") caused Tally
// to reject the import with "Stock Item does not exist".
export const TALLY_STOCK_ITEM = 'Jewellery — Composite';

// Party ledger used for aggregate day-book receipt vouchers where no
// per-customer breakdown is available. Users create this once in Tally as a
// Sundry Debtors sub-ledger.
export const TALLY_CASH_SALES_LEDGER = 'Cash Sales';

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

function slugifyLedger(ledger: string): string {
  return ledger
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
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
    const dateSlug = date || (row.txDate || '').replace(/-/g, '');
    for (const bucket of paymentBuckets(row)) {
      const total = formatAmount(bucket.amount);
      const guid = `tally-receipt-${dateSlug}-${slugifyLedger(bucket.ledger)}`;
      // Receipt voucher: PARTYLEDGERNAME must be the customer / debtor ledger,
      // NOT the payment method. Day-book aggregates by mode + day with no
      // per-customer info, so route every aggregate receipt through the
      // synthetic "Cash Sales" ledger. The counter entry credits the mode
      // ledger (Cash / Bank Account / UPI Suspense / etc.).
      vouchers.push(
`      <VOUCHER VCHTYPE="Receipt" ACTION="Create">
        <DATE>${escapeXml(date)}</DATE>
        <GUID>${escapeXml(guid)}</GUID>
        <VOUCHERTYPENAME>Receipt</VOUCHERTYPENAME>
        <NARRATION>Day-book receipt for ${escapeXml(row.txDate)} via ${escapeXml(bucket.ledger)}</NARRATION>
        <PARTYLEDGERNAME>${escapeXml(TALLY_CASH_SALES_LEDGER)}</PARTYLEDGERNAME>
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>${escapeXml(bucket.ledger)}</LEDGERNAME>
          <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
          <AMOUNT>-${total}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>${escapeXml(TALLY_CASH_SALES_LEDGER)}</LEDGERNAME>
          <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
          <AMOUNT>${total}</AMOUNT>
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
    // Fallback to "Cash Sales" when the invoice has no customer on file.
    // Tally rejects Sales vouchers with empty PARTYNAME on strict imports.
    const partyLedger = (row.customerName && row.customerName.trim())
      ? row.customerName
      : TALLY_CASH_SALES_LEDGER;
    const salesLedger = 'Sales — Jewellery';
    const guid = `tally-sales-${slugifyLedger(row.invoiceNumber)}`;

    const invEntries: string[] = [];
    invEntries.push(
`          <ALLINVENTORYENTRIES.LIST>
            <STOCKITEMNAME>${escapeXml(TALLY_STOCK_ITEM)}</STOCKITEMNAME>
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

    // Omit PARTYGSTIN entirely (not as an empty tag) when the customer has
    // no GSTIN on file — Tally rejects empty required GSTIN on B2B rows.
    const gstinLine = (row.customerGstin && row.customerGstin.trim())
      ? `        <PARTYGSTIN>${escapeXml(row.customerGstin)}</PARTYGSTIN>\n`
      : '';

    vouchers.push(
`      <VOUCHER VCHTYPE="Sales" ACTION="Create">
        <DATE>${escapeXml(date)}</DATE>
        <GUID>${escapeXml(guid)}</GUID>
        <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
        <VOUCHERNUMBER>${escapeXml(row.invoiceNumber)}</VOUCHERNUMBER>
        <REFERENCE>${escapeXml(row.invoiceNumber)}</REFERENCE>
        <PARTYLEDGERNAME>${escapeXml(partyLedger)}</PARTYLEDGERNAME>
        <PARTYNAME>${escapeXml(partyLedger)}</PARTYNAME>
        <PLACEOFSUPPLY>${escapeXml(row.placeOfSupply ?? '')}</PLACEOFSUPPLY>
${gstinLine}        <NARRATION>Invoice ${escapeXml(row.invoiceNumber)} • ${escapeXml(row.invoiceType)}</NARRATION>
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

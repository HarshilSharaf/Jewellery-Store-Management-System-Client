export interface Gstr1ExportRow {
  invoiceNumber: string;
  invoiceDate: string;
  customerGstin?: string | null;
  invoiceType: 'B2B' | 'B2CS';
  placeOfSupply: string;
  invoicePlaceOfSupply?: string | null;
  hsnCode: string;
  taxableValue: number;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  invoiceValue: number;
}

export interface Gstr1HsnSummaryRow {
  hsnCode: string;
  invoiceCount: number;
  taxableValue: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  invoiceValue: number;
}

export interface Gstr1ExportPayload {
  rows: Gstr1ExportRow[];
  hsnSummary: Gstr1HsnSummaryRow[];
}

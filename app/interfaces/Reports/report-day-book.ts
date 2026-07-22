export interface DayBookRow {
  txDate: string;
  cash: number;
  cheque: number;
  upi: number;
  card: number;
  online: number;
  total: number;
  invoiceCount: number;
  totalTaxableValue: number;
}

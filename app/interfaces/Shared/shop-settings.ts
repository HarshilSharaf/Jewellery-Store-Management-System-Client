export interface ShopSettings {
  id?: number;
  shopName: string;
  gstin: string;
  pan?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  stateCode: string;
  pincode: string;
  phone: string;
  email?: string | null;
  logoPath?: string | null;
  invoicePrefix: string;
  invoiceStartFrom: number;
  currentInvoiceCounter: number;
  defaultCurrency: string;
  timezone: string;
  roundOffEnabled: 0 | 1 | boolean;
}

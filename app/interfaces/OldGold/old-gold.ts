export interface OldGoldReceipt {
  id?: number;
  receiptGuid: string;
  invoiceId?: number | null;
  invoiceGuid?: string | null;
  invoiceNumber?: string | null;
  customerId: number;
  customerGuid?: string;
  customerName?: string;
  grossWeight: number;
  testedPurityCode?: string | null;
  testedPurityPercent?: number | null;
  deductionPercent: number;
  ratePerGram: number;
  creditAmount: number;
  remarks?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface SaveOldGoldReceiptPayload {
  customerGuid: string;
  invoiceGuid?: string | null;
  grossWeight: number;
  testedPurityPercent?: number | null;
  testedPurityCode?: string | null;
  deductionPercent: number;
  ratePerGram: number;
  creditAmount: number;
  remarks?: string | null;
  actorUserId?: number | null;
}

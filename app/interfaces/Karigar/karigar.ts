import { SchemePaymentMode } from '../SavingSchemes/saving-scheme';

export type KarigarJobStatus = 'issued' | 'received' | 'settled' | 'cancelled';
export type KarigarLedgerEntryType = 'issue' | 'receive' | 'payment' | 'adjustment';
export type KarigarLedgerDirection = 'debit' | 'credit';

export interface Karigar {
  id?: number;
  karigarGuid: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  remarks?: string | null;
  totalJobs?: number;
  openJobs?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AddKarigarPayload {
  name: string;
  phone?: string | null;
  address?: string | null;
  remarks?: string | null;
  actorUserId?: number | null;
}

export interface UpdateKarigarPayload extends AddKarigarPayload {
  karigarGuid: string;
}

export interface KarigarIssuedStone {
  stoneType: string;
  weight: number;
  value: number;
}

export interface KarigarJob {
  id?: number;
  jobGuid: string;
  karigarId: number;
  karigarGuid?: string;
  karigarName?: string;
  karigarPhone?: string | null;
  issueDate: string;
  expectedReturnDate?: string | null;
  receivedDate?: string | null;
  issuedGrossWeight: number;
  issuedPurityCode?: string | null;
  issuedStones?: KarigarIssuedStone[] | string | null;
  receivedGrossWeight?: number;
  receivedNetWeight?: number;
  receivedStoneWeight?: number;
  wastagePercentAllowed?: number;
  wastageGramsActual?: number;
  makingCharge?: number;
  settlementAmount?: number;
  settlementPaymentMode?: string | null;
  settlementRefNumber?: string | null;
  settledAt?: string | null;
  productId?: number | null;
  productSku?: string | null;
  productDescription?: string | null;
  description?: string | null;
  remarks?: string | null;
  status: KarigarJobStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface IssueKarigarJobPayload {
  karigarGuid: string;
  issueDate?: string;
  issuedGrossWeight: number;
  issuedPurityCode?: string | null;
  issuedStones?: KarigarIssuedStone[];
  expectedReturnDate?: string | null;
  description?: string | null;
  actorUserId?: number | null;
}

export interface ReceiveKarigarJobPayload {
  jobGuid: string;
  receivedDate?: string;
  receivedGrossWeight: number;
  receivedNetWeight: number;
  receivedStoneWeight?: number;
  wastagePercentAllowed?: number;
  wastageGramsActual?: number;
  makingCharge?: number;
  remarks?: string | null;
  actorUserId?: number | null;
}

export interface SettleKarigarJobPayload {
  jobGuid: string;
  settlementAmount: number;
  paymentMode: SchemePaymentMode;
  refNumber?: string | null;
  actorUserId?: number | null;
}

export interface KarigarLedgerEntry {
  id?: number;
  ledgerGuid: string;
  jobId?: number | null;
  jobGuid?: string | null;
  entryType: KarigarLedgerEntryType;
  direction: KarigarLedgerDirection;
  weightGrams?: number | null;
  amount?: number | null;
  txnDate: string;
  notes?: string | null;
  actorUserId?: number | null;
  actorUserName?: string | null;
  createdAt?: string;
}

export interface KarigarLedgerSummary {
  karigarId: number;
  karigarGuid: string;
  karigarName: string;
  dateFrom: string;
  dateTo: string;
  issuedGrams: number;
  receivedGrams: number;
  netMetalOutstandingGrams: number;
  makingAccrued: number;
  paymentsMade: number;
  balanceDue: number;
}

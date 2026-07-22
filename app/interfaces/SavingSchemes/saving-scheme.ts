export type SavingSchemeStatus = 'active' | 'matured' | 'redeemed' | 'forfeited';
export type SchemePaymentMode = 'cash' | 'cheque' | 'online' | 'upi' | 'card';

export interface SavingScheme {
  id?: number;
  schemeGuid: string;
  customerId: number;
  customerGuid?: string;
  customerName?: string;
  phoneNumber?: string | null;
  planName: string;
  monthlyAmount: number;
  tenureMonths: number;
  bonusInstallments: number;
  startDate: string;
  expectedMaturityDate: string;
  totalPaid: number;
  status: SavingSchemeStatus;
  redeemedInvoiceId?: number | null;
  redeemedInvoiceNumber?: string | null;
  redeemedAmount?: number | null;
  redeemedAt?: string | null;
  forfeitedAt?: string | null;
  forfeitReason?: string | null;
  installmentsPaid?: number;
  installmentsRemaining?: number;
  projectedCorpus?: number;
  bonusAmount?: number;
  expectedTotalContribution?: number;
  isEligibleForRedemption?: 0 | 1;
  createdAt?: string;
}

export interface SavingSchemeInstallment {
  id?: number;
  installmentGuid: string;
  schemeId: number;
  installmentNumber: number;
  amount: number;
  paymentMode: SchemePaymentMode;
  refNumber?: string | null;
  receiptDate: string;
  actorUserId?: number | null;
  actorUserName?: string | null;
  createdAt?: string;
}

export interface EnrollSavingSchemePayload {
  customerGuid: string;
  planName: string;
  monthlyAmount: number;
  tenureMonths?: number;
  bonusInstallments?: number;
  actorUserId?: number | null;
}

export interface RecordSchemeInstallmentPayload {
  schemeGuid: string;
  amount: number;
  paymentMode: SchemePaymentMode;
  refNumber?: string | null;
  receiptDate?: string;
  actorUserId?: number | null;
  allowMultipleThisMonth?: boolean;
}

export interface RedeemSavingSchemePayload {
  schemeGuid: string;
  invoiceGuid: string;
  actorUserId?: number | null;
}

export interface ForfeitSavingSchemePayload {
  schemeGuid: string;
  reason: string;
  actorUserId?: number | null;
}

import { CartLineComputed, OldGoldReceiptInput } from '../Shared/cart';

export interface SaveOrderPayload {
  customerId: number;
  placeOfSupply?: string;
  hsn?: string;
  rateSnapshot?: Record<string, number> | null;
  subTotalTaxable: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalDiscount: number;
  totalMakingCharge: number;
  totalStoneCharge: number;
  totalWastageCharge: number;
  oldGoldCreditAmount?: number;
  roundOffAmount?: number;
  grandTotal: number;
  remarks?: string | null;
  amountPaid?: number;
  paymentMethod?: string;
  paymentRefNumber?: string | null;
  lineItems: CartLineComputed[];
  oldGoldReceipts?: OldGoldReceiptInput[] | null;
  oldGoldReceiptGuid?: string | null;
  savingSchemeGuid?: string | null;
  actorUserId?: number | null;
}

export interface RecordPaymentPayload {
  orderGuid: string;
  paymentType: string;
  refNumber?: string | null;
  remarks?: string | null;
  paymentAmount: number;
  paymentDate?: string;
}

export interface OrdersServiceInterface {
    getSalesAndLabour(timeInterval: number): Promise<unknown>;
    getRecentOrders(numberOfOrders: number): Promise<unknown>;
    getTotalRevenueInLast6Months(): Promise<unknown>;
    getAllOrders(itemsPerPage: number, pageNumber: number, searchQuery: string): Promise<any>;
    getOrderDetails(orderGuid: string): Promise<any>;
    saveOrder(orderData: SaveOrderPayload): Promise<unknown>;
    cancelOrder(orderGuid: string, cancelReason?: string | null): Promise<unknown>;
    recordPayment(paymentData: RecordPaymentPayload): Promise<unknown>;
  }

import { PaymentStatus } from '../../orders/models/orders-data-model';

export interface CustomerOrders {
  orderId: number;
  orderGuid: string;
  invoiceNumber?: string;
  numberOfProducts: number;
  totalAmountWithGst: number | string | null;
  grandTotal?: number | string | null;
  orderDate: Date;
  remarks?: string;
  cancelledAt?: Date;
  paymentStatus: PaymentStatus;
}

import { PaymentStatus } from '../../orders/models/orders-data-model';

export interface CustomerOrders {
  orderId: number;
  orderGuid: string;
  numberOfProducts: number;
  totalAmountWithGst: number;
  orderDate: Date;
  remarks?: string;
  cancelledAt?: Date;
  paymentStatus: PaymentStatus;
}

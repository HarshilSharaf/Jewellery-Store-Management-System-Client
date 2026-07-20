import { Injectable } from '@angular/core';
import { HttpResponse } from '../../../models/http-response';
import { SaveOrderPayload, RecordPaymentPayload } from '../../../interfaces/Orders/orders-service-interface';
import { DbBridgeService } from '../../../shared/services/Db/db-bridge.service';

/**
 * Bypasses `Backend/Orders/db-orders.service.ts` and calls A's new SPs
 * directly through the IPC bridge. Keeps the parent Backend TS untouched
 * during the Phase 1 rebuild.
 */
@Injectable({ providedIn: 'root' })
export class OrderService {

  constructor(private db: DbBridgeService) { }

  getSalesAndLabour(timeInterval = 8): Promise<any> {
    return this.db.execute('call get_sales_labour(?);', [timeInterval]);
  }

  getTotalRevenueInLast6Months(): Promise<any> {
    return this.db.query('call get_revenue_of_six_months();');
  }

  getRecentOrders(numberOfOrders = 5): Promise<any> {
    return this.db.execute('call get_recent_orders(?);', [numberOfOrders]);
  }

  saveOrder(orderData: SaveOrderPayload): Promise<any> {
    return this.db.execute(
      'call save_order(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);',
      [
        orderData.customerId,
        orderData.placeOfSupply,
        orderData.hsn ?? '7113',
        orderData.rateSnapshot ? JSON.stringify(orderData.rateSnapshot) : null,
        orderData.subTotalTaxable,
        orderData.totalCgst,
        orderData.totalSgst,
        orderData.totalIgst,
        orderData.totalDiscount,
        orderData.totalMakingCharge,
        orderData.totalStoneCharge,
        orderData.totalWastageCharge,
        orderData.oldGoldCreditAmount ?? 0,
        orderData.roundOffAmount ?? 0,
        orderData.grandTotal,
        orderData.remarks ?? null,
        orderData.amountPaid ?? 0,
        orderData.paymentMethod ?? 'cash',
        orderData.paymentRefNumber ?? null,
        orderData.lineItems ? JSON.stringify(orderData.lineItems) : null,
        orderData.oldGoldReceipts ? JSON.stringify(orderData.oldGoldReceipts) : null,
        orderData.oldGoldReceiptGuid ?? null,
        orderData.savingSchemeGuid ?? null,
        orderData.actorUserId ?? null,
      ],
    );
  }

  getAllOrders(itemsPerPage: number, pageNumber = 1, searchQuery = ''): Promise<any> {
    return this.db.execute('call get_all_orders(?, ?, ?);', [itemsPerPage, pageNumber, searchQuery]);
  }

  cancelOrder(orderGuid: string, cancelReason: string | null = null): Promise<any> {
    return this.db.execute('call cancel_order(?, ?);', [orderGuid, cancelReason]);
  }

  getOrderDetails(orderGuid: string): Promise<HttpResponse> {
    return this.db.execute('call get_order_details(?);', [orderGuid]) as unknown as Promise<HttpResponse>;
  }

  recordPayment(paymentData: RecordPaymentPayload): Promise<any> {
    return this.db.execute('call record_payment(?, ?, ?, ?, ?, ?);', [
      paymentData.orderGuid,
      paymentData.paymentType,
      paymentData.refNumber ?? null,
      paymentData.remarks ?? null,
      paymentData.paymentAmount,
      paymentData.paymentDate ?? null,
    ]);
  }
}

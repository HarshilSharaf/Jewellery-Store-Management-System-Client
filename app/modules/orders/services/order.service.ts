import { Injectable } from '@angular/core';
import { DbOrdersService } from 'Backend/Orders/db-orders.service';
import { HttpResponse } from '../../../models/http-response';

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  constructor(private dbOrderService:DbOrdersService) { }

  getSalesAndLabour(timeInterval = 8): Promise<any> {
    return this.dbOrderService.getSalesAndLabour(timeInterval)
  }

  getTotalRevenueInLast6Months(): Promise<any> {
    return this.dbOrderService.getTotalRevenueInLast6Months()
  }

  getRecentOrders(numberOfOrders = 5): Promise<any> {
    return this.dbOrderService.getRecentOrders(numberOfOrders)
  }

  saveOrder(orderData:any):Promise<any>{
    return this.dbOrderService.saveOrder(orderData)
  }

  getAllOrders(itemsPerPage:number , pageNumber = 1, searchQuery = ''):Promise<any>{
    return this.dbOrderService.getAllOrders(itemsPerPage, pageNumber, searchQuery)
  }

  cancelOrder(orderGuid:string):Promise<any> {
    return this.dbOrderService.cancelOrder(orderGuid)
  }

  getOrderDetails(orderGuid:string):Promise<HttpResponse> {
    return this.dbOrderService.getOrderDetails(orderGuid)
  }

  recordPayment(paymentData:any):Promise<any> {
    return this.dbOrderService.recordPayment(paymentData)
  }
}

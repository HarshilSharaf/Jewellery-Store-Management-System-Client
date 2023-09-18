import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DbOrdersService } from 'Backend/Orders/db-orders.service';
import { Observable } from 'rxjs';
import { HttpResponse } from 'src/app/models/http-response';

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  apiUrl = 'http://localhost:5000/orders/'
  constructor(private http:HttpClient, private dbOrderService:DbOrdersService) { }

  getSalesAndLabour(timeInterval = 8): Observable<any> {
    return this.dbOrderService.getSalesAndLabour(timeInterval)
  }

  getTotalRevenueInLast6Months(): Observable<any> {
    return this.dbOrderService.getTotalRevenueInLast6Months()
  }

  getRecentOrders(numberOfOrders = 5) {
    return this.dbOrderService.getRecentOrders(numberOfOrders)
  }

  saveOrder(orderData:any):Observable<any>{
    return this.dbOrderService.saveOrder(orderData)
  }

  getAllOrders(itemsPerPage:number , pageNumber = 1, searchQuery = ''):Observable<any>{
    return this.dbOrderService.getAllOrders(itemsPerPage, pageNumber, searchQuery)
  }

  cancelOrder(orderGuid:string):Observable<any> {
    return this.dbOrderService.cancelOrder(orderGuid)
  }

  getOrderDetails(orderGuid:string):Observable<HttpResponse> {
    return this.dbOrderService.getOrderDetails(orderGuid)
  }

  recordPayment(paymentData:any):Observable<any> {
    return this.dbOrderService.recordPayment(paymentData)
  }
}

import { Injectable } from '@angular/core';
import { DbCustomersService } from 'Backend/Customers/db-customers.service';

@Injectable({
  providedIn: 'root'
})
export class CustomerDataService {

  constructor(private dbCustomerService:DbCustomersService) { }

  getTotalCustomers(): Promise<any> {
    return this.dbCustomerService.getTotalCustomers()
  }

  getAllCustomers(fetchImage = false, itemsPerPage:number, pageNumber = 1, searchQuery = '', fetchAll = false): Promise<any> {
    return this.dbCustomerService.getAllCustomers(fetchImage, itemsPerPage, pageNumber, searchQuery, fetchAll);
  }

  addCustomer(customerDetails: any): Promise<any> {
    return this.dbCustomerService.addCustomer(customerDetails);
  }

  deleteCustomer(guid: string,hardDelete = 0): Promise<any> {
    return this.dbCustomerService.deleteCustomer(guid, hardDelete)
  }

  deleteCustomerPhoto(guid: string): Promise<any> {
    return this.dbCustomerService.deleteCustomerImage(guid)
  }

  getCustomerImage(customerGuid:string): Promise<any>{
    return this.dbCustomerService.getCustomerImage(customerGuid)
  }

  getCustomerDetails(customerGuid:string): Promise<any>{
    return this.dbCustomerService.getCustomerDetails(customerGuid)
  }

  updateCustomerImage(customerDetails:any):Promise<any>{
    return this.dbCustomerService.updateCustomerImage(customerDetails.customerGuid, customerDetails.image)
  }

  updateCustomerDetails(customerDetails:any): Promise<any> {    
    return this.dbCustomerService.updateCustomerDetails(customerDetails)
  }

  getTotalAmountOfProductsBoughtForCustomer(customerGuid:string) {
    return this.dbCustomerService.getTotalAmountOfProductsBoughtForCustomer(customerGuid)
  }

  getCustomerOrders(customerGuid:string, itemsPerPage:number, pageNumber = 1, searchQuery = '', getCancelledOrders?: number) {
    return this.dbCustomerService.getCustomerOrders(customerGuid, itemsPerPage, pageNumber, searchQuery, getCancelledOrders)
  }
}

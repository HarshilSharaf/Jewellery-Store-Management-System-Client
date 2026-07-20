import { Injectable } from '@angular/core';
import dayjs from 'dayjs';
import { CustomerDetails } from '../models/customerDetails';
import { DbBridgeService } from '../../../shared/services/Db/db-bridge.service';

/**
 * NOTE: This service previously delegated to
 * `Backend/Customers/db-customers.service.ts`. We now go directly through
 * the IPC bridge (DbBridgeService) so that Workstream A's new SP signatures
 * (state, stateCode, gstin, pan, remarks, creditBalance) are honoured
 * without needing a coordinated bump of the parent-repo Backend TS. The
 * parent Backend service is left untouched.
 */
@Injectable({ providedIn: 'root' })
export class CustomerDataService {

  constructor(private db: DbBridgeService) {}

  getTotalCustomers(): Promise<any> {
    return this.db.query('call get_total_customers();');
  }

  getAllCustomers(fetchImage = false, itemsPerPage: number, pageNumber = 1, searchQuery = '', fetchAll = false): Promise<any> {
    return this.db.execute('call get_all_customers(?, ?, ?, ?, ?);', [
      fetchImage ? 1 : 0,
      itemsPerPage,
      pageNumber,
      fetchAll ? 1 : 0,
      searchQuery,
    ]);
  }

  addCustomer(customerDetails: CustomerDetails & any): Promise<any> {
    return this.db.execute(
      'call add_customer(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);',
      [
        customerDetails.firstName,
        customerDetails.lastName,
        dayjs(customerDetails.dateOfBirth).format('YYYY-MM-DD'),
        customerDetails.gender,
        customerDetails.address,
        customerDetails.city,
        customerDetails.state ?? null,
        customerDetails.stateCode ?? null,
        customerDetails.email || null,
        customerDetails.phoneNumber,
        customerDetails.gstin ?? null,
        customerDetails.pan ?? null,
        customerDetails.remarks ?? null,
        customerDetails.imagePath ?? null,
      ],
    );
  }

  deleteCustomer(guid: string, hardDelete = 0): Promise<any> {
    return this.db.execute('call delete_customer(?, ?);', [hardDelete, guid]);
  }

  deleteCustomerPhoto(guid: string): Promise<any> {
    return this.db.execute('call delete_customer_image(?);', [guid]);
  }

  getCustomerImage(customerGuid: string): Promise<any> {
    return this.db.execute('call get_customer_image(?);', [customerGuid]);
  }

  getCustomerDetails(customerGuid: string): Promise<any> {
    return this.db.execute('call get_customer_details(?);', [customerGuid]);
  }

  updateCustomerImage(customerDetails: any): Promise<any> {
    return this.db.execute('call update_customer_image(?, ?);', [customerDetails.customerGuid, customerDetails.image]);
  }

  updateCustomerDetails(customerDetails: any): Promise<any> {
    return this.db.execute(
      'call update_customer_details(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);',
      [
        customerDetails.customerGuid,
        customerDetails.firstName,
        customerDetails.lastName,
        dayjs(customerDetails.dob ?? customerDetails.dateOfBirth).format('YYYY-MM-DD'),
        customerDetails.address || null,
        customerDetails.city,
        customerDetails.state ?? null,
        customerDetails.stateCode ?? null,
        customerDetails.email || null,
        customerDetails.phone ?? customerDetails.phoneNumber,
        customerDetails.gender,
        customerDetails.gstin ?? null,
        customerDetails.pan ?? null,
        customerDetails.remarks ?? null,
      ],
    );
  }

  getTotalAmountOfProductsBoughtForCustomer(customerGuid: string): Promise<any> {
    return this.db.execute('call get_total_amount_of_products_bought_for_customer(?);', [customerGuid]);
  }

  getCustomerOrders(customerGuid: string, itemsPerPage: number, pageNumber = 1, searchQuery = '', getCancelledOrders = 1): Promise<any> {
    return this.db.execute('call get_customer_orders(?, ?, ?, ?, ?);', [
      getCancelledOrders,
      customerGuid,
      itemsPerPage,
      pageNumber,
      searchQuery,
    ]);
  }
}

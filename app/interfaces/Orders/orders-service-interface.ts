import { Observable } from "rxjs";

/**
 * Represents an interface for an orders service that provides operations related to order management.
 */
export interface OrdersServiceInterface {
    /**
     * Retrieves sales and labor information for a specified time interval.
     * 
     * @param {number} timeInterval - The time interval (in months) for which to retrieve sales and labor data.
     * @returns {Observable<unknown>} An Observable that emits the sales and labor information.
     */
    getSalesAndLabour(timeInterval: number): Observable<unknown>;
  
    /**
     * Retrieves recent orders based on the specified number of orders to retrieve.
     * 
     * @param {number} numberOfOrders - The number of recent orders to retrieve.
     * @returns {Observable<unknown>} An Observable that emits the list of recent orders.
     */
    getRecentOrders(numberOfOrders: number): Observable<unknown>;
  
    /**
     * Retrieves the total revenue for the last 6 months.
     * 
     * @returns {Observable<unknown>} An Observable that emits the total revenue data.
     */
    getTotalRevenueInLast6Months(): Observable<unknown>;
  
    /**
     * Retrieves a list of all orders based on specified parameters.
     * 
     * @param {number} itemsPerPage - The number of items to retrieve per page.
     * @param {number} pageNumber - The page number to retrieve. Default value is 1
     * @param {string} searchQuery - A search query to filter orders. Default value is ''
     * @returns {Observable<any>} An Observable that emits the list of orders.
     */
    getAllOrders(itemsPerPage: number, pageNumber: number, searchQuery: string): Observable<any>;
  
    /**
     * Retrieves the details of an order with the specified orderGuid.
     * 
     * @param {string} orderGuid - The GUID of the order.
     * @returns {Observable<any>} An Observable that emits the order details.
     */
    getOrderDetails(orderGuid: string): Observable<any>;
  
    /**
     * Saves an order with the provided order data.
     * 
     * @param {any} orderData - The data of the new order.
     * @returns {Observable<unknown>} An Observable that emits the result of the save operation.
     */
    saveOrder(orderData: any): Observable<unknown>;
  
    /**
     * Cancels an order with the specified orderGuid.
     * 
     * @param {string} orderGuid - The GUID of the order to cancel.
     * @returns {Observable<unknown>} An Observable that emits the result of the cancellation.
     */
    cancelOrder(orderGuid: string): Observable<unknown>;
  
    /**
     * Records a payment for an order with the provided payment data.
     * 
     * @param {any} paymentData - The data of the payment to be recorded.
     * @returns {Observable<unknown>} An Observable that emits the result of the payment recording.
     */
    recordPayment(paymentData: any): Observable<unknown>;
  }
  
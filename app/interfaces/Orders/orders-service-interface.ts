/**
 * Represents an interface for an orders service that provides operations related to order management.
 */
export interface OrdersServiceInterface {
    /**
     * Retrieves sales and labor information for a specified time interval.
     * 
     * @param {number} timeInterval - The time interval (in months) for which to retrieve sales and labor data.
     * @returns {Promise<unknown>} A Promise that resolves with the sales and labor information.
     */
    getSalesAndLabour(timeInterval: number): Promise<unknown>;
  
    /**
     * Retrieves recent orders based on the specified number of orders to retrieve.
     * 
     * @param {number} numberOfOrders - The number of recent orders to retrieve.
     * @returns {Promise<unknown>} A Promise that resolves with the list of recent orders.
     */
    getRecentOrders(numberOfOrders: number): Promise<unknown>;
  
    /**
     * Retrieves the total revenue for the last 6 months.
     * 
     * @returns {Promise<unknown>} A Promise that resolves with the total revenue data.
     */
    getTotalRevenueInLast6Months(): Promise<unknown>;
  
    /**
     * Retrieves a list of all orders based on specified parameters.
     * 
     * @param {number} itemsPerPage - The number of items to retrieve per page.
     * @param {number} pageNumber - The page number to retrieve. Default value is 1
     * @param {string} searchQuery - A search query to filter orders. Default value is ''
     * @returns {Promise<any>} A Promise that resolves with the list of orders.
     */
    getAllOrders(itemsPerPage: number, pageNumber: number, searchQuery: string): Promise<any>;
  
    /**
     * Retrieves the details of an order with the specified orderGuid.
     * 
     * @param {string} orderGuid - The GUID of the order.
     * @returns {Promise<any>} A Promise that resolves with the order details.
     */
    getOrderDetails(orderGuid: string): Promise<any>;
  
    /**
     * Saves an order with the provided order data.
     * 
     * @param {any} orderData - The data of the new order.
     * @returns {Promise<unknown>} A Promise that resolves with the result of the save operation.
     */
    saveOrder(orderData: any): Promise<unknown>;
  
    /**
     * Cancels an order with the specified orderGuid.
     * 
     * @param {string} orderGuid - The GUID of the order to cancel.
     * @returns {Promise<unknown>} A Promise that resolves with the result of the cancellation.
     */
    cancelOrder(orderGuid: string): Promise<unknown>;
  
    /**
     * Records a payment for an order with the provided payment data.
     * 
     * @param {any} paymentData - The data of the payment to be recorded.
     * @returns {Promise<unknown>} A Promise that resolves with the result of the payment recording.
     */
    recordPayment(paymentData: any): Promise<unknown>;
  }
  
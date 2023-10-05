import { CustomerDetails } from "client/app/modules/customers/models/customerDetails";
import { Observable } from "rxjs";

/**
 * Represents an interface for a customer service that provides operations related to customers.
 */
export interface CustomerServiceInterface {
    /**
     * Retrieves the total number of customers as an Observable.
     * 
     * @returns {Observable<unknown>} An Observable that emits the total number of customers.
     */
    getTotalCustomers(): Observable<unknown>;
  
    /**
     * Retrieves a list of customers based on specified parameters.
     * 
     * @param {boolean} fetchImage - Indicates whether to fetch customer images.
     * @param {number} itemsPerPage - The number of items to retrieve per page.
     * @param {number} pageNumber - The page number to retrieve. Default value is 1
     * @param {string} searchQuery - A search query to filter customers. Default value is ''
     * @param {boolean} fetchAll - Indicates whether to fetch all customers. Default value is false
     * @returns {Observable<unknown>} An Observable that emits the list of customers.
     */
    getAllCustomers(fetchImage: boolean, itemsPerPage: number, pageNumber: number, searchQuery: string, fetchAll: boolean): Observable<unknown>;
  
    /**
     * Adds a new customer with the provided customer details.
     * 
     * @param {CustomerDetails} customerDetails - The details of the new customer.
     * @returns {Observable<unknown>} An Observable that emits the result of the add operation.
     */
    addCustomer(customerDetails: CustomerDetails): Observable<unknown>;
  
    /**
     * Deletes a customer with the specified customer GUID.
     * 
     * @param {string} customerGuid - The GUID of the customer to delete.
     * @param {number} hardDelete - Indicates whether to perform a hard delete. Default value is 0
     * @returns {Observable<unknown>} An Observable that emits the result of the delete operation.
     */
    deleteCustomer(customerGuid: string, hardDelete: number): Observable<unknown>;
  
    /**
     * Retrieves the details of a customer with the specified customer GUID.
     * 
     * @param {string} customerGuid - The GUID of the customer.
     * @returns {Observable<unknown>} An Observable that emits the customer details.
     */
    getCustomerDetails(customerGuid: string): Observable<unknown>;
  
    /**
     * Retrieves the image of a customer with the specified customer GUID.
     * 
     * @param {string} customerGuid - The GUID of the customer.
     * @returns {Observable<unknown>} An Observable that emits the customer's image.
     */
    getCustomerImage(customerGuid: string): Observable<unknown>;
  
    /**
     * Updates the image of a customer with the specified customer GUID.
     * 
     * @param {string} customerGuid - The GUID of the customer.
     * @param {string} imagePath - The path to the updated image.
     * @returns {Observable<unknown>} An Observable that emits the result of the image update.
     */
    updateCustomerImage(customerGuid: string, imagePath: string): Observable<unknown>;
  
    /**
     * Deletes the image of a customer with the specified customer GUID.
     * 
     * @param {string} customerGuid - The GUID of the customer.
     * @returns {Observable<unknown>} An Observable that emits the result of the image delete operation.
     */
    deleteCustomerImage(customerGuid: string): Observable<unknown>;
  
    /**
     * Updates the details of a customer with the provided customer details.
     * 
     * @param {any} customerDetails - The updated customer details.
     * @returns {Observable<unknown>} An Observable that emits the result of the customer details update.
     */
    updateCustomerDetails(customerDetails: any): Observable<unknown>;
  
    /**
     * Retrieves the total amount of products bought by a customer with the specified customer GUID.
     * 
     * @param {string} customerGuid - The GUID of the customer.
     * @returns {Observable<unknown>} An Observable that emits the total amount of products bought by the customer.
     */
    getTotalAmountOfProductsBoughtForCustomer(customerGuid: string): Observable<unknown>;
  
    /**
     * Retrieves the orders of a customer with the specified customer GUID based on specified parameters.
     * 
     * @param {string} customerGuid - The GUID of the customer.
     * @param {number} itemsPerPage - The number of items to retrieve per page.
     * @param {number} pageNumber - The page number to retrieve. Default value is 1
     * @param {string} searchQuery - A search query to filter orders. Default value is ''
     * @param {number} getCancelledOrders - Indicates whether to retrieve canceled orders. Default value is 1
     * @returns {Observable<unknown>} An Observable that emits the list of customer orders.
     */
    getCustomerOrders(customerGuid: string, itemsPerPage: number, pageNumber: number, searchQuery: string, getCancelledOrders: number): Observable<unknown>;
  }
  
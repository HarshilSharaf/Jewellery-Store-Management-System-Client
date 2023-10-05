import { Observable } from "rxjs";

/**
 * Represents an interface for an inventory service that provides operations related to inventory management.
 */
export interface InventoryServiceInterface {
    /**
     * Retrieves the total stock as an Observable.
     * 
     * @returns {Observable<unknown>} An Observable that emits the total stock.
     */
    getTotalStock(): Observable<unknown>;
  
    /**
     * Retrieves the total stock of products belonging to a specific master category.
     * 
     * @param {number} mid - The ID of the master category.
     * @returns {Observable<unknown>} An Observable that emits the total stock of products for the master category.
     */
    getTotalStockOfMasterCategory(mid: number): Observable<unknown>;
  
    /**
     * Retrieves a list of products based on specified parameters.
     * 
     * @param {number} itemsPerPage - The number of items to retrieve per page.
     * @param {number} pageNumber - The page number to retrieve. Default value is 1
     * @param {string} searchQuery - A search query to filter products. Default value is ''
     * @param {number} fetchSoldProducts - Indicates whether to fetch sold products. Default value is 0
     * @returns {Observable<unknown>} An Observable that emits the list of products.
     */
    getAllProducts(itemsPerPage: number, pageNumber: number, searchQuery: string, fetchSoldProducts: number): Observable<unknown>;
  
    /**
     * Adds a new product with the provided product data.
     * 
     * @param {any} addProductFormData - The data of the new product.
     * @returns {Observable<unknown>} An Observable that emits the result of the add operation.
     */
    addProduct(addProductFormData: any): Observable<unknown>;
  
    /**
     * Deletes a product with the specified product GUID.
     * 
     * @param {string} productGuid - The GUID of the product to delete.
     * @param {number} hardDelete - Indicates whether to perform a hard delete.
     * @returns {Observable<unknown>} An Observable that emits the result of the delete operation.
     */
    deleteProduct(productGuid: string, hardDelete: number): Observable<unknown>;
  
    /**
     * Deletes the image of a product with the specified product GUID.
     * 
     * @param {string} productGuid - The GUID of the product.
     * @returns {Observable<unknown>} An Observable that emits the result of the image delete operation.
     */
    deleteProductImage(productGuid: string): Observable<unknown>;
  
    /**
     * Retrieves the details of a product with the specified product GUID.
     * 
     * @param {string} productGuid - The GUID of the product.
     * @returns {Observable<unknown>} An Observable that emits the product details.
     */
    getProductDetails(productGuid: string): Observable<unknown>;
  
    /**
     * Retrieves the image of a product with the specified product GUID.
     * 
     * @param {string} productGuid - The GUID of the product.
     * @returns {Observable<unknown>} An Observable that emits the product's image.
     */
    getProductImage(productGuid: string): Observable<unknown>;
  
    /**
     * Updates the details of a product with the provided product details.
     * 
     * @param {any} productDetails - The updated product details.
     * @returns {Observable<unknown>} An Observable that emits the result of the product details update.
     */
    updateProductDetails(productDetails: any): Observable<unknown>;
  
    /**
     * Updates the image of a product with the specified product GUID.
     * 
     * @param {string} productGuid - The GUID of the product.
     * @param {string} imagePath - The path to the updated image.
     * @returns {Observable<unknown>} An Observable that emits the result of the image update.
     */
    updateProductImage(productGuid: string, imagePath: string): Observable<unknown>;
  }
  
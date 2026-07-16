/**
 * Represents an interface for an inventory service that provides operations related to inventory management.
 */
export interface InventoryServiceInterface {
    /**
     * Retrieves the total stock as a Promise.
     * 
     * @returns {Promise<unknown>} A Promise that resolves with the total stock.
     */
    getTotalStock(): Promise<unknown>;
  
    /**
     * Retrieves the total stock of products belonging to a specific master category.
     * 
     * @param {number} mid - The ID of the master category.
     * @returns {Promise<unknown>} A Promise that resolves with the total stock of products for the master category.
     */
    getTotalStockOfMasterCategory(mid: number): Promise<unknown>;
  
    /**
     * Retrieves a list of products based on specified parameters.
     * 
     * @param {number} itemsPerPage - The number of items to retrieve per page.
     * @param {number} pageNumber - The page number to retrieve. Default value is 1
     * @param {string} searchQuery - A search query to filter products. Default value is ''
     * @param {number} fetchSoldProducts - Indicates whether to fetch sold products. Default value is 0
     * @returns {Promise<unknown>} A Promise that resolves with the list of products.
     */
    getAllProducts(itemsPerPage: number, pageNumber: number, searchQuery: string, fetchSoldProducts: number): Promise<unknown>;
  
    /**
     * Adds a new product with the provided product data.
     * 
     * @param {any} addProductFormData - The data of the new product.
     * @returns {Promise<unknown>} A Promise that resolves with the result of the add operation.
     */
    addProduct(addProductFormData: any): Promise<unknown>;
  
    /**
     * Deletes a product with the specified product GUID.
     * 
     * @param {string} productGuid - The GUID of the product to delete.
     * @param {number} hardDelete - Indicates whether to perform a hard delete.
     * @returns {Promise<unknown>} A Promise that resolves with the result of the delete operation.
     */
    deleteProduct(productGuid: string, hardDelete: number): Promise<unknown>;
  
    /**
     * Deletes the image of a product with the specified product GUID.
     * 
     * @param {string} productGuid - The GUID of the product.
     * @returns {Promise<unknown>} A Promise that resolves with the result of the image delete operation.
     */
    deleteProductImage(productGuid: string): Promise<unknown>;
  
    /**
     * Retrieves the details of a product with the specified product GUID.
     * 
     * @param {string} productGuid - The GUID of the product.
     * @returns {Promise<unknown>} A Promise that resolves with the product details.
     */
    getProductDetails(productGuid: string): Promise<unknown>;
  
    /**
     * Retrieves the image of a product with the specified product GUID.
     * 
     * @param {string} productGuid - The GUID of the product.
     * @returns {Promise<unknown>} A Promise that resolves with the product's image.
     */
    getProductImage(productGuid: string): Promise<unknown>;
  
    /**
     * Updates the details of a product with the provided product details.
     * 
     * @param {any} productDetails - The updated product details.
     * @returns {Promise<unknown>} A Promise that resolves with the result of the product details update.
     */
    updateProductDetails(productDetails: any): Promise<unknown>;
  
    /**
     * Updates the image of a product with the specified product GUID.
     * 
     * @param {string} productGuid - The GUID of the product.
     * @param {string} imagePath - The path to the updated image.
     * @returns {Promise<unknown>} A Promise that resolves with the result of the image update.
     */
    updateProductImage(productGuid: string, imagePath: string): Promise<unknown>;
  }
  
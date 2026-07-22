/**
 * Represents an interface for a product category service that provides operations related to product categories.
 */
export interface ProductCategoryServiceInterface {
    /**
     * Retrieves the top product categories as a Promise.
     *
     * @param {number} numberOfCategories - The number of top categories to retrieve.
     * @returns {Promise<unknown>} A Promise that resolves with the top product categories.
     */
    getTopProductCategories(numberOfCategories: number): Promise<unknown>;

    /**
     * Retrieves all product categories as a Promise.
     *
     * @returns {Promise<unknown>} A Promise that resolves with the list of product categories.
     */
    getProductCategories(): Promise<unknown>;

    /**
     * Adds a new product category with the specified name and description.
     *
     * @param {string} name - The name of the new product category.
     * @param {string} description - The description of the new product category.
     * @returns {Promise<unknown>} A Promise that resolves with the result of the add operation.
     */
    addProductCategory(name: string, description: string): Promise<unknown>;
  }
  
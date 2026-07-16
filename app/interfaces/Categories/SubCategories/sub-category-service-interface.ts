/**
 * Represents an interface for a sub-category service that provides operations related to sub-categories.
 */
export interface SubCategoryServiceInterface {
    /**
     * Retrieves all sub-categories as a Promise.
     *
     * @returns {Promise<unknown>} A Promise that resolves with the list of sub-categories.
     */
    getSubCategories(): Promise<unknown>;

    /**
     * Adds a new sub-category with the specified name and description.
     *
     * @param {string} name - The name of the new sub-category.
     * @param {string} description - The description of the new sub-category.
     * @returns {Promise<unknown>} A Promise that resolves with the result of the add operation.
     */
    addSubCategory(name: string, description: string): Promise<unknown>;
  }
  
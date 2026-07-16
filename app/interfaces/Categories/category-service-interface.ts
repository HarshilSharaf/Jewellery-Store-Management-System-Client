/**
 * Represents an interface for a category service that provides operations related to categories.
 */
export interface CategoryServiceInterface {
    /**
     * Retrieves all categories data.
     *
     * @returns {Promise<unknown>} A Promise that resolves with the list of categories.
     */
    getAllCategories(): Promise<unknown>;
  }
  
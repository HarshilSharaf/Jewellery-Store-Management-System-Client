/**
 * Represents an interface for a master category service that provides operations related to master categories.
 */
export interface MasterCategoryServiceInterface {
    /**
     * Retrieves all master categories as a Promise.
     * 
     * @returns {Promise<unknown>} A Promise that resolves with the list of master categories.
     */
    getMasterCategories(): Promise<unknown>;
  
    /**
     * Adds a new master category with the specified name and description.
     * 
     * @param {string} name - The name of the new master category.
     * @param {string} description - The description of the new master category.
     * @returns {Promise<unknown>} A Promise that resolves with the result of the add operation.
     */
    addMasterCategory(name: string, description: string): Promise<unknown>;
  }
  
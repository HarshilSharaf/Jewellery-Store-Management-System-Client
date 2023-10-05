import { Observable } from "rxjs";

/**
 * Represents an interface for a master category service that provides operations related to master categories.
 */
export interface MasterCategoryServiceInterface {
    /**
     * Retrieves all master categories as an Observable.
     * 
     * @returns {Observable<unknown>} An Observable that emits the list of master categories.
     */
    getMasterCategories(): Observable<unknown>;
  
    /**
     * Adds a new master category with the specified name and description.
     * 
     * @param {string} name - The name of the new master category.
     * @param {string} description - The description of the new master category.
     * @returns {Observable<unknown>} An Observable that emits the result of the add operation.
     */
    addMasterCategory(name: string, description: string): Observable<unknown>;
  }
  
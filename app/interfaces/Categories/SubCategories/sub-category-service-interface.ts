import { Observable } from "rxjs";

/**
 * Represents an interface for a sub-category service that provides operations related to sub-categories.
 */
export interface SubCategoryServiceInterface {
    /**
     * Retrieves all sub-categories as an Observable.
     * 
     * @returns {Observable<unknown>} An Observable that emits the list of sub-categories.
     */
    getSubCategories(): Observable<unknown>;
  
    /**
     * Adds a new sub-category with the specified name and description.
     * 
     * @param {string} name - The name of the new sub-category.
     * @param {string} description - The description of the new sub-category.
     * @returns {Observable<unknown>} An Observable that emits the result of the add operation.
     */
    addSubCategory(name: string, description: string): Observable<unknown>;
  }
  
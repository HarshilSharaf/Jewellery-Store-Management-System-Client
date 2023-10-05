import { Observable } from "rxjs";

/**
 * Represents an interface for a category service that provides operations related to categories.
 */
export interface CategoryServiceInterface {
    /**
     * Retrieves all categories data.
     * 
     * @returns {Observable<unknown>} An Observable that emits the list of categories.
     */
    getAllCategories(): Observable<unknown>;
  }
  
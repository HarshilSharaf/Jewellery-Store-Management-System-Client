import { Observable } from "rxjs";

/**
 * Represents an interface for a product category service that provides operations related to product categories.
 */
export interface ProductCategoryServiceInterface {
    /**
     * Retrieves the top product categories as an Observable.
     * 
     * @param {number} numberOfCategories - The number of top categories to retrieve.
     * @returns {Observable<unknown>} An Observable that emits the top product categories.
     */
    getTopProductCategories(numberOfCategories: number): Observable<unknown>;
  
    /**
     * Retrieves all product categories as an Observable.
     * 
     * @returns {Observable<unknown>} An Observable that emits the list of product categories.
     */
    getProductCategories(): Observable<unknown>;
  
    /**
     * Adds a new product category with the specified name and description.
     * 
     * @param {string} name - The name of the new product category.
     * @param {string} description - The description of the new product category.
     * @returns {Observable<unknown>} An Observable that emits the result of the add operation.
     */
    addProductCategory(name: string, description: string): Observable<unknown>;
  }
  
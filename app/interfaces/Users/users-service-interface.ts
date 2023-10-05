import { Observable } from "rxjs";

/**
 * Represents an interface for a users service that provides operations related to user management.
 */
export interface UsersServiceInterface {
    /**
     * Retrieves the details of a user with the specified user ID.
     * 
     * @param {number} userId - The ID of the user.
     * @returns {Observable<unknown>} An Observable that emits the user details.
     */
    getUserDetails(userId: number): Observable<unknown>;
  
    /**
     * Updates the details of a user with the provided user details.
     * 
     * @param {any} userDetails - The updated user details.
     * @returns {Observable<unknown>} An Observable that emits the result of the user details update.
     */
    updateUserDetails(userDetails: any): Observable<unknown>;
  
    /**
     * Retrieves the image of a user with the specified user ID.
     * 
     * @param {number} uid - The ID of the user.
     * @returns {Observable<unknown>} An Observable that emits the user's image.
     */
    getUserImage(uid: number): Observable<unknown>;
  
    /**
     * Updates the image of a user with the specified user ID and image file name.
     * 
     * @param {number} uid - The ID of the user.
     * @param {string} imageFileName - The name of the updated image.
     * @returns {Observable<unknown>} An Observable that emits the result of the image update.
     */
    updateUserImage(uid: number, imageFileName: string): Observable<unknown>;
  
    /**
     * Deletes the image of a user with the specified user ID.
     * 
     * @param {number} uid - The ID of the user.
     * @returns {Observable<unknown>} An Observable that emits the result of the image delete operation.
     */
    deleteUserImage(uid: number): Observable<unknown>;
  }
  
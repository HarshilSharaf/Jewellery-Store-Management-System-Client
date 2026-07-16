/**
 * Represents an interface for a users service that provides operations related to user management.
 */
export interface UsersServiceInterface {
    /**
     * Retrieves the details of a user with the specified user ID.
     *
     * @param {number} userId - The ID of the user.
     * @returns {Promise<unknown>} A Promise that resolves with the user details.
     */
    getUserDetails(userId: number): Promise<unknown>;

    /**
     * Updates the details of a user with the provided user details.
     *
     * @param {any} userDetails - The updated user details.
     * @returns {Promise<unknown>} A Promise that resolves with the result of the user details update.
     */
    updateUserDetails(userDetails: any): Promise<unknown>;

    /**
     * Retrieves the image of a user with the specified user ID.
     *
     * @param {number} uid - The ID of the user.
     * @returns {Promise<unknown>} A Promise that resolves with the user's image.
     */
    getUserImage(uid: number): Promise<unknown>;

    /**
     * Updates the image of a user with the specified user ID and image file name.
     *
     * @param {number} uid - The ID of the user.
     * @param {string} imageFileName - The name of the updated image.
     * @returns {Promise<unknown>} A Promise that resolves with the result of the image update.
     */
    updateUserImage(uid: number, imageFileName: string): Promise<unknown>;

    /**
     * Deletes the image of a user with the specified user ID.
     *
     * @param {number} uid - The ID of the user.
     * @returns {Promise<unknown>} A Promise that resolves with the result of the image delete operation.
     */
    deleteUserImage(uid: number): Promise<unknown>;
  }
  
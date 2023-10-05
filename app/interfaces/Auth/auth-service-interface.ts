/**
 * Represents an interface for an authentication service.
 */
export interface AuthServiceInterface {
    /**
     * Logs in a user with the specified username.
     * @async
     * @param {string} userName - The username of the user to be logged in.
     * @returns {Promise<any>} A Promise that resolves when the login operation is complete.
     */
    loginUser(userName: string): Promise<any>;
  }
  
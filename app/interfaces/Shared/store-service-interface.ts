/**
 * Represents an interface for a store service that provides storage-related functionality.
 */
export interface StoreServiceInterface {

    /**
     * Initializes the store service, preparing it for data storage operations.
     * 
     * @returns {Promise<any>} A Promise that is resolved when the store is successfully initialized.
     */
    initializeStore(): Promise<any>;

    /**
     * Retrieves the value associated with the specified key from the store.
     * 
     * @param {string} key - The key for which to retrieve the value.
     * @returns {any} The value associated with the specified key, or `undefined` if the key is not found.
     */
    get(key: string): any;

    /**
     * Sets a key-value pair in the store.
     * 
     * @param {string} key - The key under which to store the value.
     * @param {any} value - The value to be stored.
     */
    set(key: string, value: any): void;

    /**
     * Deletes the key-value pair associated with the specified key from the store.
     * 
     * @param {string} key - The key to be deleted.
     */
    delete(key: string): void;
}

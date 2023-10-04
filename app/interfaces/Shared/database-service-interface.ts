/**
 * Represents the interface for a database service.
 */
export interface DatabaseServiceInterface {

    /**
     * The database connection instance.
     */
    dbConnection: any;

    /**
     * Initializes a connection to the database.
     * 
     * @returns {Promise<any>} A Promise that is resolved if the connection is successfully established.
     */
    initializeDbConnection(): Promise<any>;

    /**
     * Displays a popup on any error that occurs while establishing a connection to the database
     * and redirects to the Settings page.
     * 
     * @param {any} error - The error object or message encountered during the connection process.
     */
    showErrorAndRedirectToSettingsPage(error: any): void;
}


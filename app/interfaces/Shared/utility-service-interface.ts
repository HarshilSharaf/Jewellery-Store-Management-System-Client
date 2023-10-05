/**
 * Represents an interface for a utility service that provides various utility functions.
 */
export interface UtilityServiceInterface {
    /**
     * Gets the file url for an image based on the provided relative image path.
     * 
     * @param {string} imagePath - The relative path of the image.
     * @example
     * file://C://Users//Admin//Pictures//Jewellery-Store-Management-System//customerImages//cust-1.jpg
     * 
     * @returns {string} The full file path for the image.
     */
    getFilePath(imagePath: string): string;
  
    /**
     * Relaunches the application.
     * @async
     * @returns {Promise<void>} A Promise that is resolved when the relaunch operation is complete.
     */
    relaunch(): Promise<void>;
  }
  
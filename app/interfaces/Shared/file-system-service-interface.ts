/**
 * Represents the interface for a file system service.
 */
export interface FileSystemServiceInterface {
    /**
    * The directory name of the application in which other folders will be created.
    */
    imagesParentDirectoryForApp: string

    /**
    * The name of the directory in which images of customers will be stored.
    */
    customerImagesDirectoryName: string

    /**
    * The full path of customer images directory.
    * @example
    * C:\\Users\\Admin\\Pictures\\Jewellery-Store-Management-System\\customerImages
    */
    customerImagesDir: string

    /**
    * The name of the directory in which images of products will be stored.
    */
    productImagesDirectoryName: string

    /**
    * The full path of customer images directory.
    * @example
    * C:\\Users\\Admin\\Pictures\\Jewellery-Store-Management-System\\productImages
    */
    productImagesDir: string

    /**
    * The full path of customer images directory.
    * @example
    * C:\\Users\\Admin\\Pictures\\Jewellery-Store-Management-System\\userImages
    */
    userImagesDir: string

    /**
    * The name of the directory in which images of users will be stored.
    */
    userImagesDirectoryName: string

    /**
    * Deletes a file if it exists in the specified directory.
    * @async
    * @param {string} dirPath - The path of the directory where the file is stored.
    * @param {string} fileName - The name of the file to be deleted.
    * @returns {Promise<void>} A Promise that resolves when the file is deleted, or rejects if an error occurs.
    */
    deleteFileIfExists(dirPath: string, fileName: string): Promise<void>;

    /**
     * Compresses and saves an image to the specified path.
     * @async
     * @param {string} savePath - The path where the image will be saved.
     * @param {*} imageFile - The image file to be compressed and saved.
     * @param {string} funcName - A descriptive name for the function call (optional).
     * @returns {Promise<void>} A Promise that resolves when the image is compressed and saved, or rejects if an error occurs.
     */
    compressAndSaveImage(savePath: string, imageFile: any, funcName: string): Promise<void>;

    /**
     * Retrieves a customer's image in base64 format.
     * @async
     * @param {string} imageFileName - The name of the customer's image file.
     * @returns {Promise<string>} A Promise that resolves with the customer's image in base64 format, or rejects if an error occurs.
     */
    getCustomerImageInBase64(imageFileName: string): Promise<string>;

    /**
     * Retrieves a product's image in base64 format.
     * @async
     * @param {string} imageFileName - The name of the product's image file.
     * @returns {Promise<string>} A Promise that resolves with the product's image in base64 format, or rejects if an error occurs.
     */
    getProductImageInBase64(imageFileName: string): Promise<string>;

    /**
     * Converts an image file to a Uint8Array.
     * @async
     * @param {File} file - The image file to be converted.
     * @returns {Promise<Uint8Array>} A Promise that resolves with the Uint8Array representation of the image file, or rejects if an error occurs.
     */
    imageFileToUint8Array(file: File): Promise<Uint8Array>;

    /**
     * Saves a customer's image file.
     * @async
     * @param {*} imageFile - The customer's image file to be saved.
     * @param {string} imageFileName - The name under which the image will be saved.
     * @returns {Promise<void>} A Promise that resolves when the image is saved, or rejects if an error occurs.
     */
    saveCustomerImage(imageFile: any, imageFileName: string): Promise<void>;

    /**
     * Saves a product's image file.
     * @async
     * @param {*} imageFile - The product's image file to be saved.
     * @param {string} imageFileName - The name under which the image will be saved.
     * @returns {Promise<void>} A Promise that resolves when the image is saved, or rejects if an error occurs.
     */
    saveProductImage(imageFile: any, imageFileName: string): Promise<void>;

    /**
     * Updates a product's image file.
     * @async
     * @param {string} oldFileName - The current name of the product's image file.
     * @param {string} newFileName - The new name under which the image will be saved.
     * @param {*} imageFile - The updated product's image file.
     * @returns {Promise<void>} A Promise that resolves when the image is updated, or rejects if an error occurs.
     */
    updateProductImage(oldFileName: string, newFileName: string, imageFile: any): Promise<void>;

    /**
     * Deletes a customer's image file.
     * @async
     * @param {string} fileName - The name of the customer's image file to be deleted.
     * @returns {Promise<void>} A Promise that resolves when the image is deleted, or rejects if an error occurs.
     */
    deleteCustomerImage(fileName: string): Promise<void>;

    /**
     * Deletes a product's image file.
     * @async
     * @param {string} fileName - The name of the product's image file to be deleted.
     * @returns {Promise<void>} A Promise that resolves when the image is deleted, or rejects if an error occurs.
     */
    deleteProductImage(fileName: string): Promise<void>;

    /**
     * Saves a user's image file.
     * @async
     * @param {*} imageFile - The user's image file to be saved.
     * @param {string} imageFileName - The name under which the image will be saved.
     * @returns {Promise<void>} A Promise that resolves when the image is saved, or rejects if an error occurs.
     */
    saveUserImage(imageFile: any, imageFileName: string): Promise<void>;

    /**
     * Updates a user's image file.
     * @async
     * @param {string} oldFileName - The current name of the user's image file.
     * @param {string} newFileName - The new name under which the image will be saved.
     * @param {*} imageFile - The updated user's image file.
     * @returns {Promise<void>} A Promise that resolves when the image is updated, or rejects if an error occurs.
     */
    updateUserImage(oldFileName: string, newFileName: string, imageFile: any): Promise<void>;

    /**
     * Deletes a user's image file.
     * @async
     * @param {string} fileName - The name of the user's image file to be deleted.
     * @returns {Promise<void>} A Promise that resolves when the image is deleted, or rejects if an error occurs.
     */
    deleteUserImage(fileName: string): Promise<void>;
}

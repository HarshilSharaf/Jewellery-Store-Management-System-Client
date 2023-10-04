/**
 * Represents an interface for a logger service that provides logging functionality.
 */
export interface LoggerServiceInterface {
    /**
     * Logs an informational message.
     * 
     * @param {string} infoString - The informational message to be logged.
     */
    LogInfo(infoString: string): void;
  
    /**
     * Logs an error message along with its source.
     * 
     * @param {any} errorString - The error message or object to be logged.
     * @param {string} errorFrom - The source or context from which the error occurred.
     */
    LogError(errorString: any, errorFrom: string): void;
  }
  
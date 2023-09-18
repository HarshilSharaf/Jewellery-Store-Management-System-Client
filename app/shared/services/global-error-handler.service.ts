import { ErrorHandler, Injectable } from '@angular/core';
import { LoggerService } from './logger.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable()
export class GlobalErrorHandlerService implements ErrorHandler {
  constructor(
    private loggerService: LoggerService,
    private snackBar: MatSnackBar
  ) {}

  handleError(error: any): void {
    this.snackBar.open(
      'An unexpected error occurred. Please check logs for more detais.',
      'Dismiss',
      {
        duration: 1000
      }
    );
    this.loggerService.LogError(
      `An unexpected error occured: { ${error} }`,
      'GlobalErrorHandler'
    );
  }
}

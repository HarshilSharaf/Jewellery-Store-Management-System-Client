import { ErrorHandler, Injectable, inject } from '@angular/core';
import { LoggerService } from '../../../../Backend/Shared/logger.service';
import { AppToastService } from './AppToast/app-toast.service';

@Injectable()
export class GlobalErrorHandlerService implements ErrorHandler {
  private readonly toast = inject(AppToastService);

  constructor(private loggerService: LoggerService) {}

  handleError(error: any): void {
    this.toast.error(
      'An unexpected error occurred. Please check logs for more details.',
      undefined,
      { position: 'bottom-end', timer: 3000 }
    );
    this.loggerService.LogError(
      `An unexpected error occured: { ${error} }`,
      'GlobalErrorHandler'
    );
  }
}

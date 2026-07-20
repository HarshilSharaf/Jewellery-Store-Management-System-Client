import { ErrorHandler, Injectable } from '@angular/core';
import Swal from 'sweetalert2';
import { LoggerService } from '../../../../Backend/Shared/logger.service';

@Injectable()
export class GlobalErrorHandlerService implements ErrorHandler {
  private readonly toast = Swal.mixin({
    toast: true,
    position: 'bottom-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
  });

  constructor(private loggerService: LoggerService) {}

  handleError(error: any): void {
    this.toast.fire({
      icon: 'error',
      title: 'An unexpected error occurred. Please check logs for more details.',
    });
    this.loggerService.LogError(
      `An unexpected error occured: { ${error} }`,
      'GlobalErrorHandler'
    );
  }
}

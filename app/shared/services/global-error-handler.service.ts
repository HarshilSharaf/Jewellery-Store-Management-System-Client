import { ErrorHandler, Injectable } from '@angular/core';
import type SwalT from 'sweetalert2';
import { LoggerService } from '../../../../Backend/Shared/logger.service';

@Injectable()
export class GlobalErrorHandlerService implements ErrorHandler {
  private toast: ReturnType<typeof SwalT.mixin> | null = null;

  constructor(private loggerService: LoggerService) {}

  handleError(error: any): void {
    this.showToast().catch(() => { /* silent */ });
    this.loggerService.LogError(
      `An unexpected error occured: { ${error} }`,
      'GlobalErrorHandler'
    );
  }

  private async showToast(): Promise<void> {
    if (!this.toast) {
      const { default: Swal } = await import('sweetalert2');
      this.toast = Swal.mixin({
        toast: true,
        position: 'bottom-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    }
    await this.toast.fire({
      icon: 'error',
      title: 'An unexpected error occurred. Please check logs for more details.',
    });
  }
}

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideCircleCheck,
  lucideCircleAlert,
  lucideCircleX,
  lucideInfo,
  lucideX,
} from '@ng-icons/lucide';

import { AppToastService, ToastItem, ToastVariant } from '../../services/AppToast/app-toast.service';

@Component({
  selector: 'app-toast',
  templateUrl: './app-toast.component.html',
  styleUrls: ['./app-toast.component.scss'],
  standalone: true,
  imports: [CommonModule, NgIcon],
  viewProviders: [
    provideIcons({
      lucideCircleCheck,
      lucideCircleAlert,
      lucideCircleX,
      lucideInfo,
      lucideX,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppToastComponent {
  readonly service = inject(AppToastService);

  iconName(variant: ToastVariant): string {
    switch (variant) {
      case 'success': return 'lucideCircleCheck';
      case 'error':   return 'lucideCircleX';
      case 'warning': return 'lucideCircleAlert';
      case 'info':    return 'lucideInfo';
    }
  }

  trackById(_: number, t: ToastItem): number {
    return t.id;
  }

  onDismiss(id: number): void {
    this.service.dismiss(id);
  }

  onPause(id: number): void {
    this.service.pause(id);
  }

  onResume(id: number): void {
    this.service.resume(id);
  }
}

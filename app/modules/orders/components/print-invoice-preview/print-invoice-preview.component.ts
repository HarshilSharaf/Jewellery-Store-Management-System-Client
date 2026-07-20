import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxUiLoaderService } from 'ngx-ui-loader';

import { PrintInvoiceComponent } from '../print-invoice/print-invoice.component';
import { InvoiceDataModel } from '../../models/invoice-data-model';
import { InvoiceProductDataModel } from '../../models/invoice-product-data-model';
import { OrderService } from '../../services/order.service';
import { LoggerService } from '../../../../../../Backend/Shared/logger.service';

@Component({
  selector: 'app-print-invoice-preview',
  templateUrl: './print-invoice-preview.component.html',
  styleUrls: ['./print-invoice-preview.component.scss'],
  standalone: true,
  imports: [CommonModule, PrintInvoiceComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrintInvoicePreviewComponent implements OnInit {

  invoice: InvoiceDataModel | null = null;
  loading = true;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly orderService = inject(OrderService);
  private readonly loaderService = inject(NgxUiLoaderService);
  private readonly loggerService = inject(LoggerService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    const nav = this.router.getCurrentNavigation();
    const passed = (nav?.extras?.state ?? (history?.state as any));
    if (passed?.orderData) {
      const data = passed.orderData as InvoiceDataModel;
      if (passed.customerData) { data.customer_details = passed.customerData; }
      if (passed.productsData) { data.lineItems = passed.productsData as InvoiceProductDataModel[]; }
      if (passed.paymentsData) { data.payments = passed.paymentsData; }
      this.invoice = data;
      this.loading = false;
      return;
    }

    this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const guid = params['orderGuid'];
      if (!guid) { this.loading = false; return; }
      this.fetch(guid);
    });
  }

  goBack() {
    history.length > 1 ? history.back() : this.router.navigate(['/orders']);
  }

  private fetch(orderGuid: string) {
    this.loaderService.start();
    this.orderService.getOrderDetails(orderGuid)
      .then((response: any) => {
        const row = Array.isArray(response) && Array.isArray(response[0]) ? response[0][0] : response[0];
        if (!row) { this.loading = false; this.loaderService.stop(); return; }
        const data = row as InvoiceDataModel;
        data.customer_details = row.customerDetails ?? row.customer_details ?? data.customer_details;
        data.lineItems = row.lineItems ?? row.invoice_products ?? [];
        this.invoice = data;
        this.loading = false;
        this.loaderService.stop();
      })
      .catch((err) => {
        this.loading = false;
        this.loaderService.stop();
        this.loggerService.LogError(err, 'PrintInvoicePreview.fetch');
      });
  }
}

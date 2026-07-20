import { ChangeDetectionStrategy, Component, Input, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InvoiceDataModel } from '../../models/invoice-data-model';
import { InvoiceProductDataModel } from '../../models/invoice-product-data-model';
import { ShopSettingsService } from '../../../../shared/services/ShopSettings/shop-settings.service';
import { ShopSettings } from '../../../../interfaces/Shared/shop-settings';
import { numberToIndianRupees } from '../../../../shared/utils/amount-in-words';

type PrintVariant = 'A4' | '80mm';

@Component({
  selector: 'app-print-invoice',
  templateUrl: './print-invoice.component.html',
  styleUrls: ['./print-invoice.component.scss'],
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrintInvoiceComponent implements OnInit {

  public _invoice: InvoiceDataModel | null = null;
  @Input() set InvoiceData(data: any) {
    if (!data) { this._invoice = null; return; }
    this._invoice = { ...data } as InvoiceDataModel;
  }

  @Input() showToolbar = true;
  @Input() set variantInput(v: PrintVariant | null | undefined) {
    if (v === 'A4' || v === '80mm') { this.variant.set(v); }
  }

  readonly shopSettings = signal<ShopSettings | null>(null);
  readonly variant = signal<PrintVariant>('A4');

  private readonly shopSettingsService = inject(ShopSettingsService);

  private readonly moneyFormatter = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  private readonly qtyFormatter = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });

  readonly isIntraState = computed<boolean>(() => {
    const shop = this.shopSettings();
    if (!shop?.stateCode) { return true; }
    const posCode = this.placeOfSupplyStateCode();
    if (!posCode) { return true; }
    return String(shop.stateCode).trim() === String(posCode).trim();
  });

  ngOnInit(): void {
    const cached = this.shopSettingsService.settings();
    if (cached) {
      this.shopSettings.set(cached);
    } else {
      this.shopSettingsService.get().then((row) => this.shopSettings.set(row)).catch(() => this.shopSettings.set(null));
    }
  }

  setVariant(v: PrintVariant) { this.variant.set(v); }

  get lineItems(): InvoiceProductDataModel[] {
    const items = this._invoice?.lineItems ?? this._invoice?.invoice_products ?? [];
    return Array.isArray(items) ? items : [];
  }

  money(value: number | string | null | undefined): string {
    const n = Number(value);
    if (!Number.isFinite(n)) { return this.moneyFormatter.format(0); }
    return this.moneyFormatter.format(n);
  }

  qty(value: number | string | null | undefined): string {
    const n = Number(value);
    if (!Number.isFinite(n)) { return this.qtyFormatter.format(0); }
    return this.qtyFormatter.format(n);
  }

  amountInWords(): string {
    return numberToIndianRupees(Number(this._invoice?.grandTotal ?? 0));
  }

  invoiceTitle(): string {
    return this._invoice?.isEinvoice ? 'e-Invoice' : 'Tax Invoice';
  }

  placeOfSupplyStateCode(): string | null {
    const raw = this._invoice?.placeOfSupply ?? '';
    const match = raw.match(/\((\d{1,2})\)/);
    if (match?.[1]) { return match[1]; }
    const customerStateCode = this._invoice?.customer_details?.stateCode ?? this._invoice?.customerDetails?.stateCode;
    return customerStateCode ? String(customerStateCode) : null;
  }

  cgstRate(line: InvoiceProductDataModel): number {
    const taxable = Number(line.taxableAmount ?? 0);
    const cgst = Number(line.cgst ?? 0);
    if (taxable <= 0 || cgst <= 0) { return 0; }
    return (cgst / taxable) * 100;
  }

  sgstRate(line: InvoiceProductDataModel): number {
    const taxable = Number(line.taxableAmount ?? 0);
    const sgst = Number(line.sgst ?? 0);
    if (taxable <= 0 || sgst <= 0) { return 0; }
    return (sgst / taxable) * 100;
  }

  igstRate(line: InvoiceProductDataModel): number {
    const taxable = Number(line.taxableAmount ?? 0);
    const igst = Number(line.igst ?? 0);
    if (taxable <= 0 || igst <= 0) { return 0; }
    return (igst / taxable) * 100;
  }

  purityChip(line: InvoiceProductDataModel): string {
    return line.purityLabel ?? line.purityCode ?? '';
  }

  descriptionOf(line: InvoiceProductDataModel): string {
    return line.description ?? line.productDescription ?? line.masterCategory ?? '';
  }

  print() {
    window.print();
  }
}

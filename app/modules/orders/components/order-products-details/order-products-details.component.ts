import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InvoiceProductDataModel } from '../../models/invoice-product-data-model';

@Component({
  selector: 'app-order-products-details',
  templateUrl: './order-products-details.component.html',
  styleUrls: ['./order-products-details.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class OrderProductsDetailsComponent {

  _productDetails: InvoiceProductDataModel[] = [];
  @Input() set productDetails(data: InvoiceProductDataModel[]) {
    this._productDetails = Array.isArray(data) ? data : [];
  }

  _isLoading = false;
  @Input() set isLoading(value: boolean) {
    this._isLoading = value;
  }

  @Input() isInterState = false;

  private readonly moneyFmt = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  private readonly qtyFmt = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });

  money(n: any): string {
    const v = Number(n);
    return this.moneyFmt.format(Number.isFinite(v) ? v : 0);
  }

  wt(n: any): string {
    const v = Number(n);
    return this.qtyFmt.format(Number.isFinite(v) ? v : 0);
  }

  description(line: InvoiceProductDataModel): string {
    return line.description ?? line.productDescription ?? line.masterCategory ?? '';
  }

  taxLabel(line: InvoiceProductDataModel): string {
    const cgst = Number(line.cgst ?? 0);
    const sgst = Number(line.sgst ?? 0);
    const igst = Number(line.igst ?? 0);
    if (igst > 0) return `IGST ${this.money(igst)}`;
    if (cgst > 0 || sgst > 0) return `CGST ${this.money(cgst)} + SGST ${this.money(sgst)}`;
    return '—';
  }
}

import { Injectable, inject } from '@angular/core';
import { parseCSVFile } from '../../utils/csv-import';
import { exportToCSV } from '../../utils/csv-export';
import { CustomerDataService } from '../../../modules/customers/services/customer-data.service';
import { AvailableProductsService } from '../../../modules/inventory/components/available-products/services/available-products.service';
import { MetalRatesService } from '../MetalRates/metal-rates.service';
import { MetalRateSession, MetalRateUpsertPayload } from '../../../interfaces/Shared/metal-rate';

export type DuplicateStrategy = 'skip' | 'update' | 'abort';

export interface CsvPreview {
  headers: string[];
  rows: Record<string, string>[];
  issues: RowIssue[];
}

export interface RowIssue {
  rowIndex: number;
  message: string;
}

export interface ImportResult {
  imported: number;
  updated: number;
  skipped: number;
  failed: number;
  failedRows: Array<Record<string, string> & { _error?: string }>;
  aborted?: boolean;
}

export interface CustomerMapping {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  email?: string;
  gender?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  state?: string;
  stateCode?: string;
  gstin?: string;
  pan?: string;
  remarks?: string;
}

export interface ProductMapping {
  sku?: string;
  huid?: string;
  purityCode?: string;
  productDescription?: string;
  grossWeight?: string;
  netWeight?: string;
  stoneWeight?: string;
  stoneCharges?: string;
  makingMode?: string;
  makingValue?: string;
  wastagePercent?: string;
  costPrice?: string;
  tagPrice?: string;
  hsnCode?: string;
  masterCategoryId?: string;
  subCategoryId?: string;
  productCategoryId?: string;
}

export interface RatesMapping {
  effectiveDate?: string;
  session?: string;
  purityCode?: string;
  ratePerGram?: string;
}

/** Normalise a variety of purity spellings to the canonical fineness codes. */
export function normalisePurityCode(raw: string | number | null | undefined): string {
  const s = String(raw ?? '').trim().toLowerCase().replace(/[\s\-_]+/g, '');
  if (!s) { return ''; }
  if (['22k', '22kgold', '916', 'gold22k', '22kt'].includes(s)) { return '916'; }
  if (['18k', '18kgold', '750', 'gold18k', '18kt'].includes(s)) { return '750'; }
  if (['14k', '14kgold', '585', 'gold14k', '14kt'].includes(s)) { return '585'; }
  if (['24k', '24kgold', '999', 'gold24k', '24kt', '9999'].includes(s)) { return '999'; }
  if (['silver999', '999silver'].includes(s)) { return '999'; }
  return String(raw).trim().toUpperCase();
}

/** Normalise making-charge mode strings to the canonical enum values. */
export function normaliseMakingMode(raw: string | null | undefined): 'flat' | 'perGram' | 'percent' {
  const s = String(raw ?? '').trim().toLowerCase().replace(/[\s\-_]+/g, '');
  if (!s) { return 'flat'; }
  if (['flat', '$', 'f', 'inr', 'rs', 'fix', 'fixed'].includes(s)) { return 'flat'; }
  if (['pergram', '$/g', 'pg', '₹/g', 'rs/g', 'perg'].includes(s)) { return 'perGram'; }
  if (['percent', '%', 'p', 'percentage', 'pct'].includes(s)) { return 'percent'; }
  return 'flat';
}

function digitsOnly(s: string): string {
  return String(s ?? '').replace(/[^0-9]/g, '');
}

@Injectable({ providedIn: 'root' })
export class MigrationService {

  private readonly customers = inject(CustomerDataService);
  private readonly products = inject(AvailableProductsService);
  private readonly rates = inject(MetalRatesService);

  // ---------------------------------------------------------------------------
  // Customers
  // ---------------------------------------------------------------------------

  async previewCustomerCsv(file: File): Promise<CsvPreview> {
    const parsed = await parseCSVFile(file);
    const issues: RowIssue[] = [];
    parsed.rows.forEach((row, idx) => {
      const values = Object.values(row);
      if (values.every(v => !v || !String(v).trim())) {
        issues.push({ rowIndex: idx, message: 'row is empty' });
      }
    });
    for (const err of parsed.errors) {
      issues.push({ rowIndex: -1, message: err });
    }
    return { headers: parsed.headers, rows: parsed.rows, issues };
  }

  async importCustomers(
    rows: Record<string, string>[],
    mapping: CustomerMapping,
    duplicateStrategy: DuplicateStrategy = 'skip',
  ): Promise<ImportResult> {
    const result: ImportResult = { imported: 0, updated: 0, skipped: 0, failed: 0, failedRows: [] };

    const existing = await this.fetchAllCustomersMinimal();
    const byPhone = new Map<string, any>();
    for (const c of existing) {
      const key = digitsOnly(String(c.phoneNumber ?? c.mobileNumber ?? ''));
      if (key) { byPhone.set(key, c); }
    }

    for (const raw of rows) {
      const record = this.applyMapping(raw, mapping);
      const phone = digitsOnly(record.phoneNumber ?? '');

      if (!record.firstName || !phone) {
        result.failed += 1;
        result.failedRows.push({ ...raw, _error: 'firstName or phoneNumber missing' });
        continue;
      }

      const duplicate = byPhone.get(phone);
      if (duplicate) {
        if (duplicateStrategy === 'abort') {
          result.aborted = true;
          break;
        }
        if (duplicateStrategy === 'skip') {
          result.skipped += 1;
          continue;
        }
        try {
          await this.customers.updateCustomerDetails({
            customerGuid: duplicate.customerGuid,
            firstName: record.firstName,
            lastName: record.lastName || '',
            dob: record.dateOfBirth || '2000-01-01',
            phoneNumber: phone,
            gender: record.gender || 'other',
            address: record.address || '',
            city: record.city || '',
            state: record.state || null,
            stateCode: record.stateCode || null,
            email: record.email || '',
            gstin: record.gstin || null,
            pan: record.pan || null,
            remarks: record.remarks || null,
          });
          result.updated += 1;
        } catch (err: any) {
          result.failed += 1;
          result.failedRows.push({ ...raw, _error: String(err?.message ?? err) });
        }
        continue;
      }

      try {
        await this.customers.addCustomer({
          firstName: record.firstName,
          lastName: record.lastName || '',
          dateOfBirth: record.dateOfBirth || '2000-01-01',
          gender: record.gender || 'other',
          address: record.address || '',
          city: record.city || '',
          state: record.state || null,
          stateCode: record.stateCode || null,
          email: record.email || null,
          phoneNumber: phone,
          gstin: record.gstin || null,
          pan: record.pan || null,
          remarks: record.remarks || null,
          imagePath: null,
        } as any);
        result.imported += 1;
      } catch (err: any) {
        result.failed += 1;
        result.failedRows.push({ ...raw, _error: String(err?.message ?? err) });
      }
    }

    return result;
  }

  async exportCustomers(): Promise<Record<string, any>[]> {
    const list = await this.fetchAllCustomersMinimal();
    return list.map(c => ({
      firstName: c.firstName ?? '',
      lastName: c.lastName ?? '',
      phoneNumber: c.phoneNumber ?? c.mobileNumber ?? '',
      email: c.email ?? '',
      gender: c.gender ?? '',
      dateOfBirth: c.dateOfBirth ?? c.dob ?? '',
      address: c.address ?? '',
      city: c.city ?? '',
      state: c.state ?? '',
      stateCode: c.stateCode ?? '',
      gstin: c.gstin ?? '',
      pan: c.pan ?? '',
      remarks: c.remarks ?? '',
    }));
  }

  triggerExportCustomers(filename = `customers-${new Date().toISOString().slice(0, 10)}.csv`): Promise<void> {
    return this.exportCustomers().then(rows => exportToCSV(rows, filename));
  }

  private async fetchAllCustomersMinimal(): Promise<any[]> {
    const raw: any = await this.customers.getAllCustomers(false, 10_000, 1, '', true);
    const list = Array.isArray(raw) ? raw.slice(1) : [];
    return list;
  }

  // ---------------------------------------------------------------------------
  // Products
  // ---------------------------------------------------------------------------

  async previewProductCsv(file: File): Promise<CsvPreview> {
    return this.previewCustomerCsv(file);
  }

  async importProducts(
    rows: Record<string, string>[],
    mapping: ProductMapping,
    duplicateStrategy: DuplicateStrategy = 'skip',
  ): Promise<ImportResult> {
    const result: ImportResult = { imported: 0, updated: 0, skipped: 0, failed: 0, failedRows: [] };

    const existing = await this.fetchAllProductsMinimal();
    const bySku = new Map<string, any>();
    for (const p of existing) {
      const key = String(p.sku ?? '').trim().toUpperCase();
      if (key) { bySku.set(key, p); }
    }

    for (const raw of rows) {
      const record = this.applyProductMapping(raw, mapping);
      const sku = String(record.sku ?? '').trim().toUpperCase();

      if (!sku || !record.purityCode) {
        result.failed += 1;
        result.failedRows.push({ ...raw, _error: 'sku or purityCode missing' });
        continue;
      }

      const duplicate = bySku.get(sku);
      if (duplicate) {
        if (duplicateStrategy === 'abort') { result.aborted = true; break; }
        if (duplicateStrategy === 'skip') { result.skipped += 1; continue; }
        try {
          await this.products.updateProductDetails({
            productGuid: duplicate.productGuid,
            ...record,
            sku,
          });
          result.updated += 1;
        } catch (err: any) {
          result.failed += 1;
          result.failedRows.push({ ...raw, _error: String(err?.message ?? err) });
        }
        continue;
      }

      try {
        await this.products.addProduct({ ...record, sku });
        result.imported += 1;
      } catch (err: any) {
        result.failed += 1;
        result.failedRows.push({ ...raw, _error: String(err?.message ?? err) });
      }
    }

    return result;
  }

  async exportProducts(includeCost: boolean): Promise<Record<string, any>[]> {
    const list = await this.fetchAllProductsMinimal();
    return list.map(p => {
      const row: Record<string, any> = {
        sku: p.sku ?? '',
        huid: p.huid ?? '',
        purityCode: p.purityCode ?? '',
        productDescription: p.productDescription ?? '',
        grossWeight: p.grossWeight ?? 0,
        netWeight: p.netWeight ?? 0,
        stoneWeight: p.stoneWeight ?? 0,
        stoneCharges: p.stoneCharges ?? 0,
        makingMode: p.makingMode ?? 'perGram',
        makingValue: p.makingValue ?? 0,
        wastagePercent: p.wastagePercent ?? 0,
        tagPrice: p.tagPrice ?? 0,
        hsnCode: p.hsnCode ?? '7113',
      };
      if (includeCost) {
        row['costPrice'] = p.costPrice ?? 0;
      }
      return row;
    });
  }

  triggerExportProducts(includeCost: boolean, filename = `products-${new Date().toISOString().slice(0, 10)}.csv`): Promise<void> {
    return this.exportProducts(includeCost).then(rows => exportToCSV(rows, filename));
  }

  private async fetchAllProductsMinimal(): Promise<any[]> {
    const raw: any = await this.products.getAllProductsData(10_000, 1, '', 1);
    const list = Array.isArray(raw) ? raw.slice(1) : [];
    return list;
  }

  // ---------------------------------------------------------------------------
  // Rates
  // ---------------------------------------------------------------------------

  async previewRatesCsv(file: File): Promise<CsvPreview> {
    return this.previewCustomerCsv(file);
  }

  async importRates(
    rows: Record<string, string>[],
    mapping: RatesMapping,
    duplicateStrategy: DuplicateStrategy = 'skip',
  ): Promise<ImportResult> {
    const result: ImportResult = { imported: 0, updated: 0, skipped: 0, failed: 0, failedRows: [] };

    interface Bucket { effectiveDate: string; session: MetalRateSession; rates: Map<string, MetalRateUpsertPayload>; }
    const bucketKey = (d: string, s: MetalRateSession) => `${d}|${s}`;
    const buckets = new Map<string, Bucket>();

    const history = await this.rates.getHistory(365);
    const seen = new Set<string>();
    for (const h of history) {
      seen.add(`${h.effectiveDate}|${h.session}|${h.purityCode}`);
    }

    for (const raw of rows) {
      const rec = {
        effectiveDate: this.pick(raw, mapping.effectiveDate).trim(),
        session: this.pick(raw, mapping.session).trim().toUpperCase(),
        purityCode: normalisePurityCode(this.pick(raw, mapping.purityCode)),
        ratePerGram: Number(this.pick(raw, mapping.ratePerGram)),
      };

      if (!rec.effectiveDate || (rec.session !== 'AM' && rec.session !== 'PM') || !rec.purityCode || !Number.isFinite(rec.ratePerGram)) {
        result.failed += 1;
        result.failedRows.push({ ...raw, _error: 'effectiveDate/session/purityCode/ratePerGram invalid' });
        continue;
      }

      const dupKey = `${rec.effectiveDate}|${rec.session}|${rec.purityCode}`;
      if (seen.has(dupKey)) {
        if (duplicateStrategy === 'abort') { result.aborted = true; break; }
        if (duplicateStrategy === 'skip') { result.skipped += 1; continue; }
      }

      const key = bucketKey(rec.effectiveDate, rec.session as MetalRateSession);
      let bucket = buckets.get(key);
      if (!bucket) {
        bucket = { effectiveDate: rec.effectiveDate, session: rec.session as MetalRateSession, rates: new Map() };
        buckets.set(key, bucket);
      }
      bucket.rates.set(rec.purityCode, { purityCode: rec.purityCode, ratePerGram: rec.ratePerGram });
      seen.add(dupKey);
    }

    for (const bucket of buckets.values()) {
      try {
        await this.rates.save({
          effectiveDate: bucket.effectiveDate,
          session: bucket.session,
          source: 'manual',
          rates: Array.from(bucket.rates.values()),
        });
        result.imported += bucket.rates.size;
      } catch (err: any) {
        result.failed += bucket.rates.size;
        for (const r of bucket.rates.values()) {
          result.failedRows.push({
            effectiveDate: bucket.effectiveDate,
            session: bucket.session,
            purityCode: r.purityCode,
            ratePerGram: String(r.ratePerGram),
            _error: String(err?.message ?? err),
          });
        }
      }
    }

    return result;
  }

  async exportRates(): Promise<Record<string, any>[]> {
    const rows = await this.rates.getHistory(365);
    return rows.map(r => ({
      effectiveDate: r.effectiveDate,
      session: r.session,
      purityCode: r.purityCode,
      ratePerGram: r.ratePerGram,
    }));
  }

  triggerExportRates(filename = `metal-rates-${new Date().toISOString().slice(0, 10)}.csv`): Promise<void> {
    return this.exportRates().then(rows => exportToCSV(rows, filename));
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  triggerFailedRowsDownload(rows: Array<Record<string, any>>, filename: string): void {
    if (!rows.length) { return; }
    exportToCSV(rows, filename);
  }

  private pick(row: Record<string, string>, header: string | undefined): string {
    if (!header) { return ''; }
    return String(row[header] ?? '');
  }

  private applyMapping(row: Record<string, string>, mapping: CustomerMapping): CustomerMapping {
    return {
      firstName:    this.pick(row, mapping.firstName).trim(),
      lastName:     this.pick(row, mapping.lastName).trim(),
      phoneNumber:  this.pick(row, mapping.phoneNumber).trim(),
      email:        this.pick(row, mapping.email).trim(),
      gender:       this.pick(row, mapping.gender).trim(),
      dateOfBirth:  this.pick(row, mapping.dateOfBirth).trim(),
      address:      this.pick(row, mapping.address).trim(),
      city:         this.pick(row, mapping.city).trim(),
      state:        this.pick(row, mapping.state).trim(),
      stateCode:    this.pick(row, mapping.stateCode).trim(),
      gstin:        this.pick(row, mapping.gstin).trim(),
      pan:          this.pick(row, mapping.pan).trim(),
      remarks:      this.pick(row, mapping.remarks).trim(),
    };
  }

  private applyProductMapping(row: Record<string, string>, mapping: ProductMapping): any {
    const purityCodeRaw = this.pick(row, mapping.purityCode);
    const makingModeRaw = this.pick(row, mapping.makingMode);
    return {
      sku:                this.pick(row, mapping.sku).trim(),
      huid:               this.pick(row, mapping.huid).trim() || null,
      purityCode:         normalisePurityCode(purityCodeRaw),
      productDescription: this.pick(row, mapping.productDescription).trim(),
      grossWeight:        Number(this.pick(row, mapping.grossWeight)) || 0,
      netWeight:          Number(this.pick(row, mapping.netWeight)) || 0,
      stoneWeight:        Number(this.pick(row, mapping.stoneWeight)) || 0,
      stoneCharges:       Number(this.pick(row, mapping.stoneCharges)) || 0,
      makingMode:         normaliseMakingMode(makingModeRaw),
      makingValue:        Number(this.pick(row, mapping.makingValue)) || 0,
      wastagePercent:     Number(this.pick(row, mapping.wastagePercent)) || 0,
      costPrice:          Number(this.pick(row, mapping.costPrice)) || 0,
      tagPrice:           Number(this.pick(row, mapping.tagPrice)) || 0,
      hsnCode:            this.pick(row, mapping.hsnCode).trim() || '7113',
      masterCategoryId:   Number(this.pick(row, mapping.masterCategoryId)) || 1,
      subCategoryId:      Number(this.pick(row, mapping.subCategoryId)) || 1,
      productCategoryId:  Number(this.pick(row, mapping.productCategoryId)) || 1,
      imagePath:          null,
    };
  }
}

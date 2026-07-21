import { ChangeDetectorRef, Component, EventEmitter, HostListener, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideX, lucideLoader } from '@ng-icons/lucide';

import { HttpResponse } from '../../../../models/http-response';
import { LoggerService } from '../../../../../../Backend/Shared/logger.service';
import { MasterCategoryService } from '../master-categories/services/master-category.service';
import { ProductCategoryService } from '../product-categories/services/product-category.service';
import { SubCategoryService } from '../sub-categories/services/sub-category.service';

export type CategoryTab = 'master' | 'product' | 'sub';

@Component({
  selector: 'app-add-category-dialog',
  templateUrl: './add-category-dialog.component.html',
  styleUrls: ['./add-category-dialog.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgIcon],
  viewProviders: [provideIcons({ lucideX, lucideLoader })],
})
export class AddCategoryDialogComponent {

  @Input() open = false;
  @Input() tab: CategoryTab = 'master';

  @Output() closed = new EventEmitter<void>();
  @Output() refreshDataSource = new EventEmitter<boolean>();

  form: FormGroup;
  isLoading = false;
  response: HttpResponse = { status: 0, message: '' };
  private readonly cdRef = inject(ChangeDetectorRef);

  constructor(
    private fb: FormBuilder,
    private masterService: MasterCategoryService,
    private productService: ProductCategoryService,
    private subService: SubCategoryService,
    private logger: LoggerService,
  ) {
    this.form = this.fb.group({
      name:        ['', Validators.required],
      description: [''],
    });
  }

  get title(): string {
    switch (this.tab) {
      case 'master':  return 'Add master category';
      case 'product': return 'Add product category';
      case 'sub':     return 'Add sub-category';
    }
  }

  get placeholder(): string {
    switch (this.tab) {
      case 'master':  return 'e.g. Gold, Silver, Platinum';
      case 'product': return 'e.g. Ring, Necklace, Earrings';
      case 'sub':     return 'e.g. Traditional, Modern, Bridal';
    }
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.open && !this.isLoading) { this.requestClose(); }
  }

  requestClose() {
    this.closed.emit();
  }

  onOverlayClick(e: MouseEvent) {
    if ((e.target as HTMLElement)?.classList.contains('modal-overlay')) {
      this.requestClose();
    }
  }

  async submit() {
    if (!this.form.valid) { this.form.markAllAsTouched(); return; }
    const raw = this.form.value;
    this.isLoading = true;
    this.response = { status: 0, message: '' };
    this.logger.LogInfo(`addCategory(${this.tab}) Request Started.`);

    try {
      if (this.tab === 'master') {
        await this.masterService.addMasterCategory({
          masterCategoryName: raw.name,
          masterCategoryDescription: raw.description,
        });
      } else if (this.tab === 'product') {
        await this.productService.addProductCategory({
          productCategoryName: raw.name,
          productCategoryDescription: raw.description,
        });
      } else {
        await this.subService.addSubCategory({
          subCategoryName: raw.name,
          subCategoryDescription: raw.description,
        });
      }

      this.response = { status: 200, message: 'Category added.' };
      this.refreshDataSource.emit(true);
      this.form.reset();
      this.logger.LogInfo(`addCategory(${this.tab}) Request Completed.`);
    } catch (err: any) {
      this.response = { status: 500, message: typeof err === 'string' ? err : (err?.message ?? 'Failed to add category.') };
      this.logger.LogError(err, `addCategory(${this.tab})`);
    } finally {
      this.isLoading = false;
      this.cdRef.detectChanges();
    }
  }

  clearForm() {
    this.form.reset();
    this.response = { status: 0, message: '' };
    this.isLoading = false;
  }
}

import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideCoins,
  lucideGem,
  lucideSparkles,
  lucideTags,
  lucidePlus,
  lucideLoader,
} from '@ng-icons/lucide';

import { MasterCategoryService } from '../master-categories/services/master-category.service';
import { ProductCategoryService } from '../product-categories/services/product-category.service';
import { SubCategoryService } from '../sub-categories/services/sub-category.service';
import {
  MasterCategoriesModel,
  ProductCategoriesModel,
  SubCategoriesModel,
} from '../../models/categories-model';
import { LoggerService } from '../../../../../../Backend/Shared/logger.service';
import {
  AddCategoryDialogComponent,
  CategoryTab,
} from '../add-category-dialog/add-category-dialog.component';

interface CategoryCardVM {
  id: number | undefined;
  name: string;
  description: string;
  createdAt: Date | undefined;
}

@Component({
  selector: 'app-categories-page',
  templateUrl: './categories-page.component.html',
  styleUrls: ['./categories-page.component.scss'],
  standalone: true,
  imports: [CommonModule, NgIcon, AddCategoryDialogComponent],
  viewProviders: [
    provideIcons({
      lucideCoins,
      lucideGem,
      lucideSparkles,
      lucideTags,
      lucidePlus,
      lucideLoader,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriesPageComponent implements OnInit {

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly masterService = inject(MasterCategoryService);
  private readonly productService = inject(ProductCategoryService);
  private readonly subService = inject(SubCategoryService);
  private readonly logger = inject(LoggerService);
  private readonly destroyRef = inject(DestroyRef);

  readonly tab = signal<CategoryTab>('master');
  readonly dialogOpen = signal<boolean>(false);
  readonly isLoading = signal<boolean>(false);

  readonly master  = signal<MasterCategoriesModel[]>([]);
  readonly product = signal<ProductCategoriesModel[]>([]);
  readonly sub     = signal<SubCategoriesModel[]>([]);

  readonly cards = computed<CategoryCardVM[]>(() => {
    switch (this.tab()) {
      case 'master':
        return this.master().map(m => ({
          id: m.id,
          name: m.masterCategoryName,
          description: m.masterCategoryDescription,
          createdAt: m.createdAt,
        }));
      case 'product':
        return this.product().map(p => ({
          id: p.id,
          name: p.productCategoryName,
          description: p.productCategoryDescription,
          createdAt: p.createdAt,
        }));
      case 'sub':
        return this.sub().map(s => ({
          id: s.id,
          name: s.subCategoryName,
          description: s.subCategoryDescription,
          createdAt: s.createdAt,
        }));
    }
  });

  readonly count = computed(() => this.cards().length);

  readonly tabs: Array<{ id: CategoryTab; label: string; route: string; icon: string; heading: string; }> = [
    { id: 'master',  label: 'Master',  route: '/categories/master',  icon: 'lucideCoins',    heading: 'Master categories' },
    { id: 'product', label: 'Product', route: '/categories/product', icon: 'lucideGem',      heading: 'Product categories' },
    { id: 'sub',     label: 'Sub',     route: '/categories/sub',     icon: 'lucideSparkles', heading: 'Sub-categories' },
  ];

  get currentTabMeta() {
    return this.tabs.find(t => t.id === this.tab())!;
  }

  ngOnInit(): void {
    // Bind the active tab to the route data so /categories/master, /product, /sub each render this same page.
    this.route.data
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(data => {
        const next: CategoryTab = (data?.['tab'] as CategoryTab) ?? 'master';
        this.tab.set(next);
        this.loadForTab(next);
      });
  }

  goToTab(t: CategoryTab) {
    if (this.tab() === t) { return; }
    this.router.navigate(['/categories', t]);
  }

  openAdd() { this.dialogOpen.set(true); }
  closeAdd() { this.dialogOpen.set(false); }

  onAdded() {
    this.dialogOpen.set(false);
    this.loadForTab(this.tab());
  }

  refresh() { this.loadForTab(this.tab()); }

  private async loadForTab(t: CategoryTab) {
    this.isLoading.set(true);
    try {
      if (t === 'master') {
        const rows = await this.masterService.getMasterCategories();
        this.master.set(Array.isArray(rows) ? rows : []);
      } else if (t === 'product') {
        const rows = await this.productService.getProductCategories();
        this.product.set(Array.isArray(rows) ? rows : []);
      } else {
        const rows = await this.subService.getSubCategories();
        this.sub.set(Array.isArray(rows) ? rows : []);
      }
    } catch (err) {
      this.logger.LogError(err, `loadForTab(${t})`);
    } finally {
      this.isLoading.set(false);
    }
  }
}

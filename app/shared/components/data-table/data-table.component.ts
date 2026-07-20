import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  effect,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideSquareArrowOutUpRight,
  lucideBan,
  lucideChevronsLeft,
  lucideChevronLeft,
  lucideChevronRight,
  lucideChevronsRight,
  lucideChevronUp,
  lucideChevronDown,
  lucideChevronsUpDown,
  lucideInbox,
  lucideSearch,
  lucideShoppingCart,
} from '@ng-icons/lucide';
import { ColumnSchema } from '../../models/columnsSchema';
import { CartService } from '../../services/cart.service';
import { SkeletonLoaderComponent } from '../skeleton-loader/skeleton-loader.component';

type SortDirection = 'asc' | 'desc' | '';

@Component({
  selector: 'app-data-table',
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss'],
  standalone: true,
  imports: [CommonModule, NgIcon, SkeletonLoaderComponent],
  viewProviders: [
    provideIcons({
      lucideSquareArrowOutUpRight,
      lucideBan,
      lucideChevronsLeft,
      lucideChevronLeft,
      lucideChevronRight,
      lucideChevronsRight,
      lucideChevronUp,
      lucideChevronDown,
      lucideChevronsUpDown,
      lucideInbox,
      lucideSearch,
      lucideShoppingCart,
    }),
  ],
})
export class DataTableComponent<T extends Record<string, any>> implements OnDestroy {
  private cdr = inject(ChangeDetectorRef);
  private cartService = inject(CartService);

  private _rawData: T[] = [];
  public _tableData: T[] = [];
  public _totalRecords = 0;

  @Output() refreshDataSource = new EventEmitter<boolean>();
  @Output() searchQuery = new EventEmitter<string>();
  @Output() viewDetails = new EventEmitter<T>();
  @Output() deleteItem = new EventEmitter<T>();
  @Output() pageChangeEvent = new EventEmitter<any>();

  @Input() set tableData(data: T[]) {
    this._rawData = data ?? [];
    this.applySort();
  }

  @Input() set totalRecords(records: number) {
    this._totalRecords = records ?? 0;
    this.totalNumberOfPages = Math.max(1, Math.ceil(this._totalRecords / this.pageSize));
  }

  @Input() sortByColumn: string = '';
  @Input() entityText: string = '';
  @Input() showAddToCartButton: boolean = false;
  @Input() COLUMNS_SCHEMA: ColumnSchema[] = [];
  @Input() tableColumns: string[] = this.COLUMNS_SCHEMA.map((col) => col.key);

  pageSize: number = 5;
  readonly pageSizeOptions: number[] = [5, 10, 20];
  pageIndex: number = 0;
  currentPage: number = 1;
  totalNumberOfPages: number = 1;
  showLoader: boolean = false;
  currentSearchTerm = '';
  disableButtonForProducts: string[] = [];
  activeSort: string = '';
  sortDirection: SortDirection = '';

  private filterTimer: ReturnType<typeof setTimeout> | null = null;

  protected _isLoading = false;
  @Input() set isLoading(value: boolean) {
    this._isLoading = value;
  }

  constructor() {
    effect(() => {
      const items = this.cartService.getProducts()();
      this.disableButtonForProducts = [];
      items.forEach((element: any) => {
        this.disableButtonForProducts.push(element.productGuid);
      });
    });
  }

  ngOnDestroy(): void {
    if (this.filterTimer) {
      clearTimeout(this.filterTimer);
      this.filterTimer = null;
    }
  }

  startLoader() {
    this.showLoader = true;
  }

  stopLoader() {
    this.showLoader = false;
  }

  filterChanged(event: Event) {
    if (this.filterTimer) {
      clearTimeout(this.filterTimer);
    }
    const filterValue = (event.target as HTMLInputElement).value;
    this.filterTimer = setTimeout(() => {
      if ((!this.isOnlyWhitespace(filterValue) && this.currentSearchTerm != filterValue) || filterValue == '') {
        this.currentSearchTerm = filterValue;
        this.searchQuery.emit(filterValue);
        this.pageIndex = 0;
        this.currentPage = 1;
      }
    }, 300);
  }

  isOnlyWhitespace(str: string): boolean {
    return str.trim() === '';
  }

  goToViewDetails(item: T) {
    this.viewDetails.emit(item);
  }

  openDeletePopUpForItem(item: T) {
    this.deleteItem.emit(item);
  }

  addToCart(product: any) {
    this.cartService.addToCart(product);
  }

  onSort(column: ColumnSchema) {
    if (column.key === 'actions' || column.key === 'image') {
      return;
    }
    if (this.activeSort !== column.key) {
      this.activeSort = column.key;
      this.sortDirection = 'asc';
    } else if (this.sortDirection === 'asc') {
      this.sortDirection = 'desc';
    } else if (this.sortDirection === 'desc') {
      this.sortDirection = '';
      this.activeSort = '';
    } else {
      this.sortDirection = 'asc';
    }
    this.applySort();
  }

  sortIcon(column: ColumnSchema): string {
    if (this.activeSort !== column.key) {
      return 'lucideChevronsUpDown';
    }
    return this.sortDirection === 'asc' ? 'lucideChevronUp' : 'lucideChevronDown';
  }

  private applySort() {
    if (!this.activeSort || !this.sortDirection) {
      this._tableData = [...this._rawData];
      this.cdr.markForCheck();
      return;
    }
    const key = this.activeSort;
    const dir = this.sortDirection === 'asc' ? 1 : -1;
    this._tableData = [...this._rawData].sort((a, b) => {
      const av = a?.[key];
      const bv = b?.[key];
      if (av == null && bv == null) return 0;
      if (av == null) return -1 * dir;
      if (bv == null) return 1 * dir;
      if (typeof av === 'number' && typeof bv === 'number') {
        return (av - bv) * dir;
      }
      return String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' }) * dir;
    });
    this.cdr.markForCheck();
  }

  changePageSize(event: Event) {
    const value = Number((event.target as HTMLSelectElement).value);
    this.pageSize = value;
    this.pageIndex = 0;
    this.currentPage = 1;
    this.totalNumberOfPages = Math.max(1, Math.ceil(this._totalRecords / this.pageSize));
    this.emitPageChange();
  }

  goToPage(newIndex: number) {
    const max = Math.max(0, this.totalNumberOfPages - 1);
    const clamped = Math.min(Math.max(0, newIndex), max);
    if (clamped === this.pageIndex) return;
    this.pageIndex = clamped;
    this.currentPage = clamped + 1;
    this.emitPageChange();
  }

  private emitPageChange() {
    this.pageChangeEvent.emit({
      pageIndex: this.pageIndex,
      pageSize: this.pageSize,
      length: this._totalRecords,
      searchQuery: this.currentSearchTerm,
    });
  }

  hasData(): boolean {
    return this._tableData != null && this._tableData.length > 0;
  }

  getRangeDisplayText(): string {
    const initialText = `Displaying ${this.entityText}`;
    const length = this._totalRecords;
    if (length === 0 || this.pageSize === 0) {
      return `${initialText} 0 of ${length}`;
    }
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex < length ? Math.min(startIndex + this.pageSize, length) : startIndex + this.pageSize;
    return `${initialText} (${startIndex + 1} to ${endIndex}) of ${length}`;
  }

  skeletonRows(): number[] {
    return Array.from({ length: this.pageSize }, (_, i) => i);
  }
}

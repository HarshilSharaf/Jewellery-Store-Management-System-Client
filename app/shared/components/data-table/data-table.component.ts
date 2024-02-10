import {
  AfterViewChecked,
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import Swal from 'sweetalert2';
import { ColumnSchema } from '../../models/columnsSchema';
import { Router } from '@angular/router';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-data-table',
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss'],
})
export class DataTableComponent<T> implements OnInit,AfterViewInit {
  public _tableData: MatTableDataSource<T> = new MatTableDataSource();
  public _totalRecords = 0;
  private _paginator:any

// ----------------------The paginator and sort needed to be set in following manner -----------------
// ----------------------as it was undefined when set as usual---------------------------------------
// ----------------------Find More Info On the following link: --------------------------------------
// --------------------- https://stackoverflow.com/a/62021629/18480147 ------------------------------

  @ViewChild(MatPaginator, { static: false })
  set paginator(value: MatPaginator) {
    if (this._tableData) {
      value._intl.getRangeLabel = this.getRangeDisplayText;
      this.currentPage = value.pageIndex + 1;
      this.totalNumberOfPages = value.getNumberOfPages();
      this._paginator = value
      this.cdr.detectChanges()
    }
  }

  @ViewChild(MatSort, { static: false })
  set sort(value: MatSort) {
    if (this._tableData) {
      this._tableData.sort = value;
    }
  }

  @Output() refreshDataSource = new EventEmitter<boolean>();
  @Output() searchQuery = new EventEmitter<string>();
  @Output() viewDetails = new EventEmitter<T>();
  @Output() deleteItem = new EventEmitter<T>();
  @Output() pageChangeEvent = new EventEmitter<T>();

  @Input() set tableData(data: T[]) {
    this._tableData = new MatTableDataSource<T>(data);
  }

  @Input() set totalRecords(records: number) {
    this._totalRecords = records;
  }
  @Input() sortByColumn: string = '';
  @Input() entityText: string = '';

  @Input() showAddToCartButton: boolean = false;
  // @Input() goToViewDetailsFn: ((item: T) => void) | undefined;
  // @Input() openDeletePopUpForItemFn: ((item: T) => void) | undefined;

  @Input() COLUMNS_SCHEMA: ColumnSchema[] = [];
  @Input() tableColumns: string[] = this.COLUMNS_SCHEMA.map((col) => col.key);

  currentPage: number = 0;
  totalNumberOfPages: number = 0;
  showLoader: boolean = false;
  currentSearchTerm = ''
  disableButtonForProducts: string[] = [];

  protected _isLoading = false;
  @Input() set isLoading(value: boolean)
  {
    this._isLoading = value;
  }


  constructor(
    private cdr: ChangeDetectorRef,
    private cartService: CartService
  ) {}

  ngAfterViewInit(): void {
    // set value of paginator after complete initialization
    // as it was not updating the paginator pageIndex value to 0 when 
    // search string is not empty
    this._tableData.paginator = this._paginator
  }

  ngOnInit(): void {
    this.getCartItems();
  }

  startLoader() {
    this.showLoader = true;
  }

  stopLoader() {
    this.showLoader = false;
  }

  filterChanged(event: Event) {
    setTimeout(() => {
      const filterValue = (event.target as HTMLInputElement).value;
      if(!this.isOnlyWhitespace(filterValue) && this.currentSearchTerm != filterValue || filterValue == '' )
      {
        this.currentSearchTerm = filterValue
        this.searchQuery.emit(filterValue)
        this._paginator.pageIndex = 0
      }
    }, 500); //delay sending request to server for 500ms
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

  onPageChange(event: any) {
    this.currentPage = event.pageIndex + 1;
    event.searchQuery = this.currentSearchTerm
    this.pageChangeEvent.emit(event);
  }

  getCartItems() {
    this.cartService.getProducts().subscribe((data) => {
      //empty the current array to enable buttons which are removed from carts
      this.disableButtonForProducts = [];
      data.forEach((element: any) => {
        this.disableButtonForProducts.push(element.productGuid);
      });
    });
  }

  addToCart(product: any) {
    this.cartService.addToCart(product);
  }

  getRangeDisplayText = (page: number, pageSize: number, length: number) => {
    const initialText = `Displaying ${this.entityText}`; // Customize this line
    if (length == 0 || pageSize == 0) {
      return `${initialText} 0 of ${length}`;
    }
    length = Math.max(length, 0);
    const startIndex = page * pageSize;
    const endIndex =
      startIndex < length
        ? Math.min(startIndex + pageSize, length)
        : startIndex + pageSize;
    return `${initialText} (${startIndex + 1} to ${endIndex}) of ${length}`; // Customize this line
  };
}

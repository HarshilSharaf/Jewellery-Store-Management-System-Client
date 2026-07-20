import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideChevronsLeft,
  lucideChevronLeft,
  lucideChevronRight,
  lucideChevronsRight,
} from '@ng-icons/lucide';

export interface SimplePageEvent {
  pageIndex: number;
  pageSize: number;
  length: number;
}

@Component({
  selector: 'app-simple-paginator',
  templateUrl: './simple-paginator.component.html',
  styleUrls: ['./simple-paginator.component.scss'],
  standalone: true,
  imports: [CommonModule, NgIcon],
  viewProviders: [
    provideIcons({
      lucideChevronsLeft,
      lucideChevronLeft,
      lucideChevronRight,
      lucideChevronsRight,
    }),
  ],
})
export class SimplePaginatorComponent {
  @Input() length = 0;
  @Input() pageSize = 5;
  @Input() pageIndex = 0;
  @Input() pageSizeOptions: number[] = [5, 10, 20];

  @Output() page = new EventEmitter<SimplePageEvent>();

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.length / this.pageSize));
  }

  get rangeLabel(): string {
    if (this.length === 0 || this.pageSize === 0) {
      return `0 of ${this.length}`;
    }
    const start = this.pageIndex * this.pageSize;
    const end = Math.min(start + this.pageSize, this.length);
    return `${start + 1} to ${end} of ${this.length}`;
  }

  goTo(newIndex: number) {
    const max = this.totalPages - 1;
    const clamped = Math.min(Math.max(0, newIndex), max);
    if (clamped === this.pageIndex) return;
    this.pageIndex = clamped;
    this.emit();
  }

  onPageSizeChange(event: Event) {
    const value = Number((event.target as HTMLSelectElement).value);
    this.pageSize = value;
    this.pageIndex = 0;
    this.emit();
  }

  private emit() {
    this.page.emit({
      pageIndex: this.pageIndex,
      pageSize: this.pageSize,
      length: this.length,
    });
  }
}

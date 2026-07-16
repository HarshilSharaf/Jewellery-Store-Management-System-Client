import { Component, OnInit } from '@angular/core';

import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { MasterCategoriesComponent } from '../master-categories/master-categories.component';
import { SubCategoriesComponent } from '../sub-categories/sub-categories.component';
import { ProductCategoriesComponent } from '../product-categories/product-categories.component';

@Component({
  selector: 'app-categories-page',
  templateUrl: './categories-page.component.html',
  styleUrls: ['./categories-page.component.scss'],
  standalone: true,
  imports: [
    PageHeaderComponent,
    MasterCategoriesComponent,
    SubCategoriesComponent,
    ProductCategoriesComponent
]
})
export class CategoriesPageComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}

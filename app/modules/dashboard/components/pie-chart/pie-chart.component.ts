import { Component, Input, OnInit } from '@angular/core';

import Chart from 'chart.js/auto';
import { TopProductCategoriesModel } from '../../models/top-product-categories-model';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-pie-chart',
  templateUrl: './pie-chart.component.html',
  styleUrls: ['./pie-chart.component.scss'],
  standalone: true,
  imports: [SkeletonLoaderComponent]
})
export class PieChartComponent implements OnInit {
  public chart: any;
  public _topSellingProducts:TopProductCategoriesModel[] = []
  @Input() set topSellingProducts(data:TopProductCategoriesModel[]) {
    this._topSellingProducts = [...data]
    if(this._topSellingProducts.length)
    {
      this.createChart();
    }
  }

  constructor() { }

  ngOnInit(): void {
  }

  createChart() {

    this.chart = new Chart('pieChart', {
      type: 'pie', //this denotes tha type of chart

      data: {
        labels: [
          ...this._topSellingProducts.map(
            (product: TopProductCategoriesModel) =>
              product.productCategoryName + ` (${product.percentage}%)`
          ),
        ],
        datasets: [
          {
            label: 'Total Weight (In gms)',
            data: [
              ...this._topSellingProducts.map(
                (product: TopProductCategoriesModel) => product.total_weight
              ),
            ],
            backgroundColor: [
              '#7C8CF8',
              '#F88C9C',
              '#5EC6C6',
              '#F8C85C',
              '#B8C4FF',
            ],
            borderWidth: 2,
            borderColor: '#FFFFFF',
            hoverOffset: 6,
            hoverBorderColor: '#2D3142'
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }
}

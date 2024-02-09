import { Component, Input, OnInit } from '@angular/core';
import Chart from 'chart.js/auto';
import { TopProductCategoriesModel } from '../../models/top-product-categories-model';

@Component({
  selector: 'app-pie-chart',
  templateUrl: './pie-chart.component.html',
  styleUrls: ['./pie-chart.component.scss']
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
              'rgb(255, 99, 132)',
              'rgb(54, 162, 235)',
              'rgb(255, 205, 86)',
              'rgb(255, 205, 186)',
              'rgb(255, 205, 152)',
            ],
            hoverOffset: 4,
            hoverBorderColor: "black"
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

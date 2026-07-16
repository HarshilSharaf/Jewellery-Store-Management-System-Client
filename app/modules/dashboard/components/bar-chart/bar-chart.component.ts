import { Component, Input, OnInit } from '@angular/core';

import Chart from 'chart.js/auto';
import { MonthlySalesAndLabourModel } from '../../models/sales-and-labour-model';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-bar-chart',
  templateUrl: './bar-chart.component.html',
  styleUrls: ['./bar-chart.component.scss'],
  standalone: true,
  imports: [SkeletonLoaderComponent]
})
export class BarChartComponent implements OnInit {
  public chart: any;
  public _monthlySalesAndLabour:MonthlySalesAndLabourModel[] = []
  @Input() set monthlySalesAndLabour(data:MonthlySalesAndLabourModel[]) {
    this._monthlySalesAndLabour = [...data]
    if(this._monthlySalesAndLabour.length)
    {
      this.createChart();
    }
  }
  constructor() { }

  ngOnInit(): void {
  }

  createChart() {
    this.chart = new Chart("barChart", {
      type: 'bar', //this denotes tha type of chart

      data: {// values on X-Axis
        labels: [
          ...this._monthlySalesAndLabour.map((monthYearData:MonthlySalesAndLabourModel) => monthYearData.month_year)
        ],
        datasets: [
          {
            label: "Sales",
            data: [
              ...this._monthlySalesAndLabour.map((salesData:MonthlySalesAndLabourModel) => salesData.sales)
            ],
            backgroundColor: '#7C8CF8',
            borderRadius: 6,
            borderSkipped: false
          },
          {
            label: "Labour",
            data: [
              ...this._monthlySalesAndLabour.map((labourData:MonthlySalesAndLabourModel) => labourData.labour)
            ],
            backgroundColor: '#5EC6C6',
            borderRadius: 6,
            borderSkipped: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      }

    });
  }

}

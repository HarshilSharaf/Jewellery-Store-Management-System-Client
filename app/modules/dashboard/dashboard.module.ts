import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { MainComponent } from './components/main/main.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { BarChartComponent } from './components/bar-chart/bar-chart.component';
import { PieChartComponent } from './components/pie-chart/pie-chart.component';
import { RecentOrdersComponent } from './components/recent-orders/recent-orders.component';

@NgModule({
  declarations: [
    MainComponent,
    BarChartComponent,
    PieChartComponent,
    RecentOrdersComponent
  ],
  imports: [
    CommonModule,
    // AppModule,
    SharedModule,
    DashboardRoutingModule
  ]
})
export class DashboardModule { }

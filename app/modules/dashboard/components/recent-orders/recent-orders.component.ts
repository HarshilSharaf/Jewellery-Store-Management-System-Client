import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-recent-orders',
  templateUrl: './recent-orders.component.html',
  styleUrls: ['./recent-orders.component.scss'],
  standalone: true,
  imports: [CommonModule, SkeletonLoaderComponent]
})
export class RecentOrdersComponent implements OnInit {

  public orderData = []

  public _recentOrders: any

  protected skeletonRows = 5;

  @Input() set recentOrders(data:any) {
    this._recentOrders = [...data]
  }
  constructor(public router:Router) { }

  ngOnInit(): void {
  }


  goToViewDetails(guid: string) {
    this.router.navigate([`orders/view-order-details/${guid}`]); 
  }

}

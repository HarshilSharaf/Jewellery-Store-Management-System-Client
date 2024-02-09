import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-recent-orders',
  templateUrl: './recent-orders.component.html',
  styleUrls: ['./recent-orders.component.scss']
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

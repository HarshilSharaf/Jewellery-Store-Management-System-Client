import { AfterViewInit, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { CartSideBarService } from '../../services/cart-side-bar.service';

@Component({
  selector: 'app-cart-side-bar',
  templateUrl: './cart-side-bar.component.html',
  styleUrls: ['./cart-side-bar.component.scss']
})
export class CartSideBarComponent implements OnInit, AfterViewInit {
  @ViewChild('cartSideBar') cartSideBar!: any

  constructor(private cartSidebarservice: CartSideBarService, public offcanvasService: NgbOffcanvas) { }

  ngOnInit(): void {
  }

  toggle(content: TemplateRef<any>, status: boolean) {

    // this condition will prevent the cart menu from opening abruptly when changing the routes
    if (this.offcanvasService.hasOpenOffcanvas() && !status) {
      this.offcanvasService.dismiss()
    }

    if (!this.offcanvasService.hasOpenOffcanvas() && status) {
      this.offcanvasService.open(content, { position: 'end' }).result.then((closeReason) => {
        //set the value to false when the offcanvas is closed
        this.cartSidebarservice.toggleSideBar.next(false)
      },
        (dismissReason) => {
          //set the value to false when the offcanvas is dismissed (when clicked on backdrop)
          this.cartSidebarservice.toggleSideBar.next(false)
        }
      )
    }
  }

  ngAfterViewInit(): void {
    this.cartSidebarservice.getCartSideBarStatus().subscribe((status) => {
      this.toggle(this.cartSideBar, status)
    })
  }


}

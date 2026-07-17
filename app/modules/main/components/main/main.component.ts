import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SideBarService } from '../../../../shared/services/sidebar.service';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';
import { FooterComponent } from '../../../../shared/components/footer/footer.component';
import { CartSideBarComponent } from '../../../../shared/components/cart-side-bar/cart-side-bar.component';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, SidebarComponent, FooterComponent, CartSideBarComponent]
})
export class MainComponent {

  // Reactive class map: previously this was a plain method whose output
  // never updated the DOM after boot because the sidebar-service state
  // lives in signals but the read went through a plain function call.
  readonly wrapperClasses = computed(() => ({
    'pinned-sidebar': this.appService.isSidebarPinned(),
    'toggeled-sidebar': this.appService.isSidebarToggeled(),
  }));

  constructor(private appService: SideBarService) { }

  toggleSidebar() {
    this.appService.toggleSidebar();
  }
}

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

import { RailComponent } from './rail/rail.component';
import { TopBarComponent } from './top-bar.component';
import { CartSideBarComponent } from '../cart-side-bar/cart-side-bar.component';

@Component({
  selector: 'app-shell',
  templateUrl: './app-shell.component.html',
  styleUrls: ['./app-shell.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterOutlet, RailComponent, TopBarComponent, CartSideBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent {}

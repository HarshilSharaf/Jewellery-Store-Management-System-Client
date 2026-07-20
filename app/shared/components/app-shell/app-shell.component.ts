import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

import { RailComponent } from './rail/rail.component';
import { TopBarComponent } from './top-bar.component';
import { CartSideBarComponent } from '../cart-side-bar/cart-side-bar.component';
import { CommandPaletteComponent } from '../command-palette/command-palette.component';
import { AppDialogComponent } from '../app-dialog/app-dialog.component';
import { AppToastComponent } from '../app-toast/app-toast.component';

@Component({
  selector: 'app-shell',
  templateUrl: './app-shell.component.html',
  styleUrls: ['./app-shell.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RailComponent,
    TopBarComponent,
    CartSideBarComponent,
    CommandPaletteComponent,
    AppDialogComponent,
    AppToastComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent {}

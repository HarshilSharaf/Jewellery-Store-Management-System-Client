import { Component } from '@angular/core';
import { AppShellComponent } from '../../../../shared/components/app-shell/app-shell.component';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
  standalone: true,
  imports: [AppShellComponent],
})
export class MainComponent {}

import { Component } from '@angular/core';
import { StepperComponent } from './components/stepper/stepper.component';

@Component({
  selector: 'app-prepare-order',
  templateUrl: './prepare-order.component.html',
  styleUrl: './prepare-order.component.scss',
  standalone: true,
  imports: [StepperComponent],
})
export class PrepareOrderComponent {}

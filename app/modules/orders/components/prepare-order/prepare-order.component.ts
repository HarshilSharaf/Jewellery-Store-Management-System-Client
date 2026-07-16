import { BreakpointObserver } from '@angular/cdk/layout';
import { StepperOrientation } from '@angular/cdk/stepper';
import { Component, OnInit } from '@angular/core';

import { FormBuilder, Validators } from '@angular/forms';
import { Observable, map } from 'rxjs';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { StepperComponent } from './components/stepper/stepper.component';

@Component({
  selector: 'app-prepare-order',
  templateUrl: './prepare-order.component.html',
  styleUrls: ['./prepare-order.component.scss'],
  standalone: true,
  imports: [PageHeaderComponent, StepperComponent]
})
export class PrepareOrderComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}

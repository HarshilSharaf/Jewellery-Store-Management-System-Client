import { BreakpointObserver } from '@angular/cdk/layout';
import { StepperOrientation } from '@angular/cdk/stepper';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Observable, map } from 'rxjs';

@Component({
  selector: 'app-prepare-order',
  templateUrl: './prepare-order.component.html',
  styleUrls: ['./prepare-order.component.scss']
})
export class PrepareOrderComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}

import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InvoiceDataModel } from '../../models/invoice-data-model';

@Component({
  selector: 'app-print-invoice',
  templateUrl: './print-invoice.component.html',
  styleUrls: ['./print-invoice.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class PrintInvoiceComponent implements OnInit {

public _InvoiceData!: InvoiceDataModel
@Input() set InvoiceData(data:any) {
  this._InvoiceData = {...data}
}


  constructor() {
  }


  ngOnInit(): void { 
    
  }

}

import { Component, Input, OnInit } from '@angular/core';
import { InvoiceDataModel } from '../../models/invoice-data-model';

@Component({
  selector: 'app-print-invoice',
  templateUrl: './print-invoice.component.html',
  styleUrls: ['./print-invoice.component.scss']
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

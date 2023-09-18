import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { HttpResponse } from '../../../../models/http-response';
import { PaymentsDataModel, PaymentType } from '../../models/payments-data-model';
import { OrderService } from '../../services/order.service';
import { LoggerService } from '../../../../../../Backend/Shared/logger.service';

@Component({
  selector: 'app-order-payments',
  templateUrl: './order-payments.component.html',
  styleUrls: ['./order-payments.component.scss']
})
export class OrderPaymentsComponent implements OnInit {

  _paymentsData:PaymentsDataModel[] = []
  public recordPaymentResponse: HttpResponse = { status: 0, message: '' }

  @Input() set paymentsData(data:PaymentsDataModel[]) {
    this._paymentsData = [...data]
  }

  @Input() orderGuid:string = ''
  @Input() isPaymentDone:boolean = false

  @Output() refreshPaymentsData = new EventEmitter<boolean>();
  recordPaymentForm: FormGroup
  recordPaymentFormInitialValues: unknown

  recordPaymentSubscription = new Subscription()

  constructor(
    private formBuilder: FormBuilder,
    private orderService: OrderService,
    private loggerService: LoggerService
  ) {
    this.recordPaymentForm = this.formBuilder.group({
      amount: [0, Validators.required],
      paymentType: [PaymentType.CASH, Validators.required],
      paymentDate: [this.formatDate(new Date())],
      remarks: [''],
    });
    this.recordPaymentFormInitialValues = this.recordPaymentForm.value;
  }

  ngOnInit(): void {

  }

  clearAndCloseForm() {
    this.recordPaymentForm.reset(this.recordPaymentFormInitialValues)
    this.recordPaymentResponse = { status: 0, message: '' }
  }

  clearForm() {
    this.recordPaymentForm.reset(this.recordPaymentFormInitialValues)
  }

  recordPayment() {
    this.loggerService.LogInfo("recordPayment() Request Started.")

    const paymentData =  {
      orderGuid: this.orderGuid,
      paymentAmount: this.recordPaymentForm.get('amount')?.value,
      paymentType: this.recordPaymentForm.get('paymentType')?.value,
      paymentDate: this.recordPaymentForm.get('paymentDate')?.value,
      remarks: this.recordPaymentForm.get('remarks')?.value
    }
    this.recordPaymentSubscription = this.orderService.recordPayment(paymentData).subscribe({
      next: (response) => {
      
        if (response.length == 0 || !response[0]?.message) {
          const paymentResponse:HttpResponse = {
            status: 200,
            message: "Successfully Recorded Payment!" 
          }

          this.recordPaymentResponse = {...paymentResponse}
          
          this.refreshPaymentsData.emit(true);
          this.clearForm()
        }

        else {
          const paymentResponse:HttpResponse = {
            status: 500,
            message: response[0]?.message
          }
          this.recordPaymentResponse = {...paymentResponse}
        }
        this.loggerService.LogInfo("recordPayment() Request Completed.") 
      },
      error: (error) => {
        const paymentResponse:HttpResponse = {
          status: 500,
          message: error
        }
        this.recordPaymentResponse = {...paymentResponse}
        this.loggerService.LogError(error, "recordPayment()")
      }
    })

  }

  private formatDate(date: Date) {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
  }

}

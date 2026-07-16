import { Component, EventEmitter, OnInit, OnDestroy, Output } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpResponse } from '../../../../../../models/http-response';
import { ProductCategoryService } from '../../services/product-category.service';
import { LoggerService } from '../../../../../../../../Backend/Shared/logger.service';

@Component({
  selector: 'app-add-product-category-form',
  templateUrl: './add-product-category-form.component.html',
  styleUrls: ['./add-product-category-form.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class AddProductCategoryFormComponent implements OnInit,OnDestroy {

  public addProductCategoryResponse: HttpResponse = { status: 0, message: '' }
  @Output() refreshDataEvent = new EventEmitter<boolean>()

  productCategoryForm: FormGroup
  
  constructor(
    private formBuilder: FormBuilder,
    private productCategoryService: ProductCategoryService,
    private loggerService: LoggerService
  ) {
    this.productCategoryForm = this.formBuilder.group({
      productCategoryName: ['', Validators.required],
      productCategoryDescription: [''],
    });
  }

  ngOnDestroy(): void {
    // No subscriptions to unsubscribe from
  }

  ngOnInit(): void {
  }

  clearForm() {
    this.productCategoryForm.reset()
    this.addProductCategoryResponse = { status: 0, message: '' }
  }

  submitForm() {
    var addProductCategoryFormData:Record<string,string> = {}
    Object.keys(this.productCategoryForm.controls).forEach(formControlName => {
      addProductCategoryFormData[formControlName]= this.productCategoryForm.get(formControlName)?.value;
    });
    
    this.loggerService.LogInfo("addProductCategory() Request Started.")
    this.productCategoryService.addProductCategory(addProductCategoryFormData)
      .then((response) => {
        this.refreshDataEvent.emit(true)
        this.addProductCategoryResponse.status = 200
        this.addProductCategoryResponse.message = "Product Category Added Successfully!"
        this.loggerService.LogInfo("addProductCategory() Request Completed.")
      })
      .catch((error: any) => {
        this.loggerService.LogError(error, "addProductCategory()")
        this.addProductCategoryResponse.status = 500
        this.addProductCategoryResponse.message = error
      })
  }

}

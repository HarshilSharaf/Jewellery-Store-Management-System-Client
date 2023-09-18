import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { HttpResponse } from 'src/app/models/http-response';
import { ProductCategoryService } from '../../services/product-category.service';
import { LoggerService } from 'src/app/shared/services/logger.service';

@Component({
  selector: 'app-add-product-category-form',
  templateUrl: './add-product-category-form.component.html',
  styleUrls: ['./add-product-category-form.component.scss']
})
export class AddProductCategoryFormComponent implements OnInit {

  private productCategoryServiceSubscription: Subscription = new Subscription;
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
    console.log("Add product category form destroyed!!")
    this.productCategoryServiceSubscription?.unsubscribe();
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
    this.productCategoryServiceSubscription = this.productCategoryService.addProductCategory(addProductCategoryFormData).subscribe({
      next: (response) => {
        this.refreshDataEvent.emit(true)
        this.addProductCategoryResponse.status = 200
        this.addProductCategoryResponse.message = "Product Category Added Successfully!"
        this.loggerService.LogInfo("addProductCategory() Request Completed.")
      },
      error: (error) => {
        this.loggerService.LogError(error, "addProductCategory()")
        this.addProductCategoryResponse.status = 500
        this.addProductCategoryResponse.message = error
      }
    })
  }

}

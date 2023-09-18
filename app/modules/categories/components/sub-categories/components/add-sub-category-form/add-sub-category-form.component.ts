import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { HttpResponse } from '../../../../../../models/http-response';
import { SubCategoryService } from '../../services/sub-category.service';
import { LoggerService } from '../../../../../../../../Backend/Shared/logger.service';

@Component({
  selector: 'app-add-sub-category-form',
  templateUrl: './add-sub-category-form.component.html',
  styleUrls: ['./add-sub-category-form.component.scss']
})
export class AddSubCategoryFormComponent implements OnInit {
  private subCategoryServiceSubscription: Subscription = new Subscription;
  public addSubCategoryResponse: HttpResponse = { status: 0, message: '' }
  @Output() refreshDataEvent = new EventEmitter<boolean>()

  subCategoryForm: FormGroup

  constructor(
    private formBuilder: FormBuilder,
    private subCategoryService: SubCategoryService,
    private loggerService: LoggerService
  ) {
    this.subCategoryForm = this.formBuilder.group({
      subCategoryName: ['', Validators.required],
      subCategoryDescription: [''],
    });
  }

  ngOnDestroy(): void {
    this.subCategoryServiceSubscription?.unsubscribe();
  }

  ngOnInit(): void {
  }

  clearForm() {
    this.subCategoryForm.reset()
    this.addSubCategoryResponse = { status: 0, message: '' }
  }

  submitForm() {
    var addSubCategoryFormData:Record<string,string> = {}
    Object.keys(this.subCategoryForm.controls).forEach(formControlName => {
      addSubCategoryFormData[formControlName]= this.subCategoryForm.get(formControlName)?.value;
    });
    
    this.loggerService.LogInfo("addSubCategory() Request Started.")
    this.subCategoryServiceSubscription = this.subCategoryService.addSubCategory(addSubCategoryFormData).subscribe({
      next: (response) => {
        this.refreshDataEvent.emit(true)
        this.addSubCategoryResponse.status = 200
        this.addSubCategoryResponse.message = "Sub Category Added Successfully!"
        this.loggerService.LogInfo("addSubCategory() Request Completed.")
      },
      error: (error) => {
        this.loggerService.LogError(error, "addSubCategory()")
        this.addSubCategoryResponse.status = 500
        this.addSubCategoryResponse.message = error
      }
    })
  }


}

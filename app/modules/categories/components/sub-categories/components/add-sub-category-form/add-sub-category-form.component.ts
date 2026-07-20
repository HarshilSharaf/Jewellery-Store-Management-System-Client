import { Component, EventEmitter, OnInit, OnDestroy, Output } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpResponse } from '../../../../../../models/http-response';
import { SubCategoryService } from '../../services/sub-category.service';
import { LoggerService } from '../../../../../../../../Backend/Shared/logger.service';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucidePlus } from '@ng-icons/lucide';

@Component({
  selector: 'app-add-sub-category-form',
  templateUrl: './add-sub-category-form.component.html',
  styleUrls: ['./add-sub-category-form.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgIcon],
  viewProviders: [provideIcons({ lucidePlus })],
})
export class AddSubCategoryFormComponent implements OnInit,OnDestroy {
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
    // No subscriptions to unsubscribe from
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
    this.subCategoryService.addSubCategory(addSubCategoryFormData)
      .then((response) => {
        this.refreshDataEvent.emit(true)
        this.addSubCategoryResponse.status = 200
        this.addSubCategoryResponse.message = "Sub Category Added Successfully!"
        this.loggerService.LogInfo("addSubCategory() Request Completed.")
      })
      .catch((error: any) => {
        this.loggerService.LogError(error, "addSubCategory()")
        this.addSubCategoryResponse.status = 500
        this.addSubCategoryResponse.message = error
      })
  }


}

import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { HttpResponse } from '../../../../../../models/http-response';
import { MasterCategoryService } from '../../services/master-category.service';
import { LoggerService } from '../../../../../../../../Backend/Shared/logger.service';

@Component({
  selector: 'app-add-master-category-form',
  templateUrl: './add-master-category-form.component.html',
  styleUrls: ['./add-master-category-form.component.scss']
})
export class AddMasterCategoryFormComponent implements OnInit, OnDestroy {

  private masterCategoryServiceSubscription: Subscription = new Subscription;
  public addMasterCategoryResponse: HttpResponse = { status: 0, message: '' }
  @Output() refreshDataEvent = new EventEmitter<boolean>()

  masterCategoryForm: FormGroup

  constructor(private formBuilder: FormBuilder,
    private masterCategoryService: MasterCategoryService,
    private loggerService: LoggerService
  ) {
    this.masterCategoryForm = this.formBuilder.group({
      "masterCategoryName": ["", Validators.required],
      "masterCategoryDescription": [""]
    })
  }

  ngOnDestroy(): void {
    this.masterCategoryServiceSubscription?.unsubscribe();
  }

  ngOnInit(): void {
  }

  clearForm() {
    this.masterCategoryForm.reset()
    this.addMasterCategoryResponse = { status: 0, message: '' }
  }

  submitForm() {
    var addMasterCategoryFormData:Record<string,string> = {}
    Object.keys(this.masterCategoryForm.controls).forEach(formControlName => {
      addMasterCategoryFormData[formControlName]= this.masterCategoryForm.get(formControlName)?.value;
    });
    
    this.loggerService.LogInfo("addMasterCategory() Request Started.")
    this.masterCategoryServiceSubscription = this.masterCategoryService.addMasterCategory(addMasterCategoryFormData).subscribe({
      next: (response) => {
        this.refreshDataEvent.emit(true)
        this.addMasterCategoryResponse.status = 200
        this.addMasterCategoryResponse.message = "Master Category Added Successfully!"
        this.loggerService.LogInfo("addMasterCategory() Request Completed.")
      },
      error: (error) => {
        this.loggerService.LogError(error, "addMasterCategory()")
        this.addMasterCategoryResponse.status = 500
        this.addMasterCategoryResponse.message = error
      }
    })
  }
}

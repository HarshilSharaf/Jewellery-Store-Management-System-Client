import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft,
  lucideHammer,
  lucidePlus,
  lucideTrash2,
  lucideScale,
  lucideCheck,
  lucideLoader,
} from '@ng-icons/lucide';

import { LoggerService } from '../../../../../../Backend/Shared/logger.service';
import { StoreService } from '../../../../../../Backend/Shared/store.service';
import { KarigarService } from '../../../../shared/services/Karigar/karigar.service';
import { PuritiesService } from '../../../../shared/services/Purities/purities.service';
import { Karigar, KarigarIssuedStone } from '../../../../interfaces/Karigar/karigar';
import { Purity } from '../../../../interfaces/Shared/purity';

@Component({
  selector: 'app-issue-job-page',
  templateUrl: './issue-job-page.component.html',
  styleUrls: ['./issue-job-page.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgIcon],
  viewProviders: [
    provideIcons({
      lucideArrowLeft,
      lucideHammer,
      lucidePlus,
      lucideTrash2,
      lucideScale,
      lucideCheck,
      lucideLoader,
    }),
  ],
})
export class IssueJobPageComponent implements OnInit {

  readonly karigars = signal<Karigar[]>([]);
  readonly purities = signal<Purity[]>([]);
  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  form: FormGroup;

  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(KarigarService);
  private readonly puritiesService = inject(PuritiesService);
  private readonly storeService = inject(StoreService);
  private readonly loggerService = inject(LoggerService);

  constructor() {
    this.form = this.fb.group({
      karigarGuid: ['', Validators.required],
      issueDate: [this.today(), Validators.required],
      issuedGrossWeight: [0, [Validators.required, Validators.min(0.001)]],
      issuedPurityCode: ['916', Validators.required],
      stones: this.fb.array([]),
      description: [''],
      expectedReturnDate: [this.defaultReturn()],
    });
  }

  get stonesArray(): FormArray {
    return this.form.get('stones') as FormArray;
  }

  ngOnInit(): void {
    this.loadReferenceData();
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      if (params['karigarGuid']) {
        this.form.patchValue({ karigarGuid: params['karigarGuid'] });
      }
    });
  }

  private async loadReferenceData(): Promise<void> {
    try {
      const [kResult, purities]: any[] = await Promise.all([
        this.service.getAllKarigars(1000, 1, ''),
        this.puritiesService.getPurities(),
      ]);
      const kRows = Array.isArray(kResult) ? kResult : [];
      const list = kRows.filter((r: any) => r?.karigarGuid) as Karigar[];
      this.karigars.set(list);
      this.purities.set(Array.isArray(purities) ? purities : []);
    } catch (error) {
      this.loggerService.LogError(error, 'IssueJobPage.loadReferenceData');
    }
  }

  addStone(): void {
    this.stonesArray.push(this.fb.group({
      stoneType: ['', Validators.required],
      weight: [0, [Validators.required, Validators.min(0)]],
      value: [0, [Validators.required, Validators.min(0)]],
    }));
  }

  removeStone(index: number): void {
    this.stonesArray.removeAt(index);
  }

  goBack(): void {
    this.router.navigate(['/karigar']);
  }

  async submitForm(): Promise<void> {
    if (!this.form.valid || this.saving()) return;
    this.errorMessage.set(null);
    this.saving.set(true);
    try {
      const auth: any = await this.storeService.get('authData');
      const value = this.form.value;
      const stones: KarigarIssuedStone[] = (value.stones ?? []).map((s: any) => ({
        stoneType: s.stoneType,
        weight: Number(s.weight),
        value: Number(s.value),
      }));
      const result: any = await this.service.issueJob({
        karigarGuid: value.karigarGuid,
        issueDate: value.issueDate,
        issuedGrossWeight: Number(value.issuedGrossWeight),
        issuedPurityCode: value.issuedPurityCode ?? null,
        issuedStones: stones,
        expectedReturnDate: value.expectedReturnDate ?? null,
        description: value.description ?? null,
        actorUserId: auth?.uid ?? null,
      });
      const row = Array.isArray(result) ? result.find((r: any) => r?.jobGuid) : null;
      const newGuid = row?.jobGuid ?? null;
      this.saving.set(false);
      if (newGuid) {
        Swal.fire({ title: 'Job issued', icon: 'success', timer: 900, showConfirmButton: false });
        this.router.navigate(['/karigar', 'jobs', newGuid]);
      } else {
        this.router.navigate(['/karigar']);
      }
    } catch (error) {
      this.saving.set(false);
      const msg = (error as any)?.message ?? String(error);
      this.errorMessage.set(msg);
      this.loggerService.LogError(error, 'IssueJobPage.submitForm');
    }
  }

  private today(): string {
    return this.formatDate(new Date());
  }

  private defaultReturn(): string {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return this.formatDate(d);
  }

  private formatDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}

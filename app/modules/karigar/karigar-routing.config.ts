import { Routes } from '@angular/router';
import { KarigarPageComponent } from './components/karigar-page/karigar-page.component';
import { KarigarDetailComponent } from './components/karigar-detail/karigar-detail.component';
import { IssueJobPageComponent } from './components/issue-job-page/issue-job-page.component';
import { JobCardDetailComponent } from './components/job-card-detail/job-card-detail.component';

export const karigarRoutes: Routes = [
  {
    path: '',
    component: KarigarPageComponent,
  },
  {
    path: 'jobs/new',
    component: IssueJobPageComponent,
  },
  {
    path: 'jobs/:jobGuid',
    component: JobCardDetailComponent,
  },
  {
    path: 'karigars/:karigarGuid',
    component: KarigarDetailComponent,
  },
];

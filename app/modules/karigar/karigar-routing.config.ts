import { Routes } from '@angular/router';

export const karigarRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/karigar-page/karigar-page.component').then(m => m.KarigarPageComponent),
  },
  {
    path: 'jobs/new',
    loadComponent: () => import('./components/issue-job-page/issue-job-page.component').then(m => m.IssueJobPageComponent),
  },
  {
    path: 'jobs/:jobGuid',
    loadComponent: () => import('./components/job-card-detail/job-card-detail.component').then(m => m.JobCardDetailComponent),
  },
  {
    path: 'karigars/:karigarGuid',
    loadComponent: () => import('./components/karigar-detail/karigar-detail.component').then(m => m.KarigarDetailComponent),
  },
];

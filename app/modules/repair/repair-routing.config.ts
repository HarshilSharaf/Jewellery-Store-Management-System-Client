import { Routes } from '@angular/router';

export const repairRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/repair-page/repair-page.component').then(m => m.RepairPageComponent),
  },
  { path: 'new', redirectTo: '', pathMatch: 'full' },
  {
    path: ':ticketGuid',
    loadComponent: () => import('./components/ticket-detail-page/ticket-detail-page.component').then(m => m.TicketDetailPageComponent),
  },
  { path: '**', redirectTo: '' },
];

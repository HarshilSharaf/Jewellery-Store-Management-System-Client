import { Routes } from '@angular/router';
import { RepairPageComponent } from './components/repair-page/repair-page.component';
import { CreateTicketPageComponent } from './components/create-ticket-page/create-ticket-page.component';
import { TicketDetailPageComponent } from './components/ticket-detail-page/ticket-detail-page.component';

export const repairRoutes: Routes = [
  {
    path: '',
    component: RepairPageComponent,
  },
  {
    path: 'new',
    component: CreateTicketPageComponent,
  },
  {
    path: ':ticketGuid',
    component: TicketDetailPageComponent,
  },
];

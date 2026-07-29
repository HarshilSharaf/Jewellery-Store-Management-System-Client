import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideChartLine,
  lucideReceiptText,
  lucidePackage,
  lucideFileJson,
  lucideArrowRight,
  lucideTriangleAlert,
} from '@ng-icons/lucide';

interface ReportTile {
  title: string;
  description: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-reports-landing',
  templateUrl: './reports-landing.component.html',
  styleUrls: ['./reports-landing.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterLink, NgIcon],
  viewProviders: [
    provideIcons({ lucideChartLine, lucideReceiptText, lucidePackage, lucideFileJson, lucideArrowRight, lucideTriangleAlert }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsLandingComponent {

  readonly tiles: ReportTile[] = [
    {
      title: 'Day book',
      description: 'Daily cash / bank / UPI collection rollup, per day.',
      icon: 'lucideChartLine',
      route: '/reports/day-book',
    },
    {
      title: 'Sales register',
      description: 'Invoice-level ledger with GST split for CA review.',
      icon: 'lucideReceiptText',
      route: '/reports/sales-register',
    },
    {
      title: 'Stock summary by purity',
      description: 'Grams + tag valuation grouped by purity code.',
      icon: 'lucidePackage',
      route: '/reports/stock-summary',
    },
    {
      title: 'Low stock by category',
      description: 'Category combinations running below a unit threshold.',
      icon: 'lucideTriangleAlert',
      route: '/reports/low-stock',
    },
    {
      title: 'GSTR-1 export',
      description: 'Month-wise JSON ready for CA upload to the portal.',
      icon: 'lucideFileJson',
      route: '/reports/gstr1',
    },
  ];
}

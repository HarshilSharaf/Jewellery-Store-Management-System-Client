import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowUp, lucideArrowDown } from '@ng-icons/lucide';

@Component({
  selector: 'app-info-card',
  templateUrl: './info-card.component.html',
  styleUrls: ['./info-card.component.scss'],
  standalone: true,
  imports: [CommonModule, NgIcon],
  viewProviders: [provideIcons({ lucideArrowUp, lucideArrowDown })],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InfoCardComponent {

  cardTitle!: string;
  cardValue!: string;
  cardIcon!: string;
  cardIconImage: string = '';
  percentageIncrease: number = 0;
  // Rebuild the prefix on each cardData set so re-binding doesn't produce
  // "Since Since last 6 months" concatenation on route revisit.
  monthsString = '';

  @Input() set cardData(data: any) {
    this.cardTitle = data.cardTitle;
    this.cardValue = data.cardValue;
    this.cardIcon = data.cardIcon;
    this.cardIconImage = data.cardIconImage;
    this.percentageIncrease = data.percentageIncrease;
    this.monthsString = `Since ${data.monthsString}`;
  }
}

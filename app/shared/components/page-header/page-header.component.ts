import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';


@Component({
  selector: 'app-page-header',
  templateUrl: './page-header.component.html',
  styleUrls: ['./page-header.component.scss'],
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PageHeaderComponent {

  _pageName: string = '';

  @Input() set pageName(title: string) {
    this._pageName = title;
  }

  constructor(private location: Location) {}

  goBack() {
    this.location.back();
  }

}

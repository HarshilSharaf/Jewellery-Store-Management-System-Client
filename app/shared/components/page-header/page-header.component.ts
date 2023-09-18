import { Location } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-page-header',
  templateUrl: './page-header.component.html',
  styleUrls: ['./page-header.component.scss']
})
export class PageHeaderComponent implements OnInit {

  _pageName: string = '';

  @Input() set pageName(title: string) {
    this._pageName = title;
  }

  constructor(private location: Location) {}

  ngOnInit(): void {}

  goBack() {
    this.location.back();
  }

}

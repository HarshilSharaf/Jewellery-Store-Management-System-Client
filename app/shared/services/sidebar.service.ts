import { Injectable } from '@angular/core';
import { signal, Signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SideBarService {

  readonly isSidebarPinned = signal<boolean>(false);
  readonly isSidebarToggeled = signal<boolean>(false);

  constructor() { }

  toggleSidebar() {
    this.isSidebarToggeled.update(value => !value);
  }

  toggleSidebarPin() {
    this.isSidebarPinned.update(value => !value);
  }

  getSidebarStat() {
    return {
      isSidebarPinned: this.isSidebarPinned(),
      isSidebarToggeled: this.isSidebarToggeled()
    }
  }

}

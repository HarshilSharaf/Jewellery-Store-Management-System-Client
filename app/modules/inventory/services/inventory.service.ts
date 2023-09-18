import { Injectable } from '@angular/core';
import { DbInventoryService } from 'Backend/Inventory/db-inventory.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {

  constructor(private dbInventoryService:DbInventoryService) { }

  getTotalStock(): Observable<any> {
    return this.dbInventoryService.getTotalStock()
  }

  getTotalStockOfMasterCategory(mid:number): Observable<any> {
    return this.dbInventoryService.getTotalStockOfMasterCategory(mid)
  }

}

import { Injectable } from '@angular/core';
import { DbInventoryService } from 'Backend/Inventory/db-inventory.service';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {

  constructor(private dbInventoryService:DbInventoryService) { }

  getTotalStock(): Promise<any> {
    return this.dbInventoryService.getTotalStock()
  }

  getTotalStockOfMasterCategory(mid:number): Promise<any> {
    return this.dbInventoryService.getTotalStockOfMasterCategory(mid)
  }

}

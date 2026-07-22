import { Injectable } from '@angular/core';
import { DbBridgeService } from '../../../shared/services/Db/db-bridge.service';

@Injectable({ providedIn: 'root' })
export class InventoryService {

  constructor(private db: DbBridgeService) { }

  getTotalStock(): Promise<any> {
    return this.db.query('call get_total_stock();');
  }

  getTotalStockOfMasterCategory(mid: number): Promise<any> {
    return this.db.execute('call get_total_stock_of_master_category(?);', [mid]);
  }
}

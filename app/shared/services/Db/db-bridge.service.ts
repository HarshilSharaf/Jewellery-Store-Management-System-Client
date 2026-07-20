import { Injectable } from '@angular/core';

/**
 * Thin renderer-side facade over `window.electronAPI.db` that reproduces
 * the parent Backend/Shared/database.service.ts `prepareResponseData`
 * flatten behaviour, so client-side services (which bypass the parent
 * Backend TS during the Phase 1 rebuild) return the same flattened
 * shape callers already expect: [firstResultSet..., secondResultSet...],
 * with the trailing OkPacket dropped.
 */
@Injectable({ providedIn: 'root' })
export class DbBridgeService {

  private get api(): any {
    const w = (typeof window !== 'undefined' ? (window as any) : {});
    return w?.electronAPI?.db;
  }

  private flatten(raw: any): any[] {
    if (!raw) { return []; }
    if (!Array.isArray(raw)) { return raw; }
    // Drop the trailing OkPacket like the parent Backend service does.
    const sets = raw.slice(0, -1);
    let out: any[] = [];
    for (const s of sets) {
      if (Array.isArray(s)) { out = out.concat(s); }
    }
    return out;
  }

  async execute(sql: string, params: any[] = [], options?: any): Promise<any[]> {
    const raw = await this.api.execute(sql, params, options);
    return this.flatten(raw);
  }

  async query(sql: string, options?: any): Promise<any[]> {
    const raw = await this.api.query(sql, options);
    return this.flatten(raw);
  }
}

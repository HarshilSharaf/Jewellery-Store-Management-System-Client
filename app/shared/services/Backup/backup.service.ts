import { Injectable, signal } from '@angular/core';
import {
  CreateBackupPayload,
  CreateBackupResult,
  DeleteBackupPayload,
  ListBackupsEntry,
  ListBackupsPayload,
  RestoreBackupPayload,
} from '../../../interfaces/Backup/backup';

/**
 * Renderer-side wrapper for K's backup module. All heavy lifting (spawn
 * mysqldump, AES-256-GCM encryption, restore piping) happens in the
 * Electron main process behind the `backup:*` IPC channels registered in
 * `src-electron/main.js`. This service only shapes the payloads.
 */
@Injectable({ providedIn: 'root' })
export class BackupService {

  readonly backups = signal<ListBackupsEntry[]>([]);
  readonly busy = signal<boolean>(false);

  private get api(): any {
    const w = (typeof window !== 'undefined' ? (window as any) : {});
    return w?.electronAPI?.backup;
  }

  private get dialogApi(): any {
    const w = (typeof window !== 'undefined' ? (window as any) : {});
    return w?.electronAPI?.dialog;
  }

  async create(payload: CreateBackupPayload): Promise<CreateBackupResult> {
    if (!this.api?.create) { throw new Error('backup.create IPC unavailable'); }
    this.busy.set(true);
    try {
      const resp = await this.api.create(payload);
      if (resp && resp.ok === false) { throw new Error(resp.error || 'backup.create failed'); }
      return (resp && resp.result) ? (resp.result as CreateBackupResult) : (resp as CreateBackupResult);
    } finally {
      this.busy.set(false);
    }
  }

  async restore(payload: RestoreBackupPayload): Promise<void> {
    if (!this.api?.restore) { throw new Error('backup.restore IPC unavailable'); }
    this.busy.set(true);
    try {
      const resp = await this.api.restore(payload);
      if (resp && resp.ok === false) { throw new Error(resp.error || 'backup.restore failed'); }
    } finally {
      this.busy.set(false);
    }
  }

  async list(targetDir: string | null): Promise<ListBackupsEntry[]> {
    if (!this.api?.list) { this.backups.set([]); return []; }
    try {
      const payload: any = { backupDir: targetDir || null };
      const resp = await this.api.list(payload);
      let list: ListBackupsEntry[] = [];
      if (Array.isArray(resp)) {
        list = resp as ListBackupsEntry[];
      } else if (resp && Array.isArray(resp.entries)) {
        list = resp.entries as ListBackupsEntry[];
      }
      this.backups.set(list);
      return list;
    } catch {
      this.backups.set([]);
      return [];
    }
  }

  async delete(archivePath: string, actorType?: string): Promise<void> {
    if (!this.api?.delete) { throw new Error('backup.delete IPC unavailable'); }
    const payload: any = { archivePath, actorType };
    const resp = await this.api.delete(payload);
    if (resp && resp.ok === false) { throw new Error(resp.error || 'backup.delete failed'); }
  }

  async pickDirectory(defaultPath?: string): Promise<string | null> {
    if (!this.dialogApi?.chooseDirectory) { return null; }
    try {
      const result = await this.dialogApi.chooseDirectory({ defaultPath: defaultPath ?? null });
      if (!result) { return null; }
      if (typeof result === 'string') { return result; }
      if (result.canceled) { return null; }
      if (Array.isArray(result.filePaths) && result.filePaths.length) {
        return result.filePaths[0] as string;
      }
      return null;
    } catch {
      return null;
    }
  }
}

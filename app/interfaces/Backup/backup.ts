export interface BackupConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export interface CreateBackupPayload extends BackupConfig {
  passphrase: string;
  targetDir: string;
}

export interface CreateBackupResult {
  path: string;
  sizeBytes: number;
  createdAt: string;
  filename: string;
}

export interface RestoreBackupPayload extends BackupConfig {
  passphrase: string;
  archivePath: string;
}

export interface ListBackupsPayload {
  targetDir: string;
}

export interface ListBackupsEntry {
  filename: string;
  path: string;
  sizeBytes: number;
  createdAt: string;
}

export interface DeleteBackupPayload {
  archivePath: string;
}

export interface CreateBackupPayload {
  passphrase: string;
  targetDir: string;
}

export interface CreateBackupResult {
  path: string;
  sizeBytes: number;
  createdAt: string;
  filename: string;
}

export interface RestoreBackupPayload {
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

export interface DownloadOptions {
  onProgress?: (progress: number) => void;
}

export interface UpdateHandler {
  downloadUpdate(args: { url: string; destPath: string; options?: DownloadOptions }): Promise<void>;
  verifyFileHash(args: { filePath: string; expectedHash: string }): Promise<boolean>;
}

export interface ZipHandler {
  createZipFromDirectory(args: { dirPath: string; zipPath: string }): Promise<{ zipSize: number }>;
  extractZip(args: { zipFilePath: string; targetPath: string }): Promise<void>;
}

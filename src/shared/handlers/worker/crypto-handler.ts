export interface CryptoHandler {
  calculateFileHash(filePath: string): Promise<string>;
  calculateDirectoryHash(dirPath: string): Promise<string>;
  calculateDirectorySize(dirPath: string): Promise<number>;
  createHash(args: { algorithm: string; data: string | Buffer }): Promise<string>;
}

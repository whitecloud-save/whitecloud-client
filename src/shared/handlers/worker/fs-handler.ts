export interface FileStats {
  isFile: boolean;
  isDirectory: boolean;
  size: number;
  mtime: Date;
  ctime: Date;
}

export interface FsHandler {
  readFile(filePath: string): Promise<Uint8Array>;
  writeFile(args: { path: string; data: Uint8Array | string }): Promise<void>;
  deleteFile(filePath: string): Promise<void>;
  exists(filePath: string): Promise<boolean>;
  readdir(dirPath: string): Promise<string[]>;
  readdirRecursive(dirPath: string): Promise<string[]>;
  mkdir(args: { path: string; options?: { recursive?: boolean } }): Promise<void>;
  deleteDir(args: { path: string; options?: { recursive?: boolean } }): Promise<void>;
  stat(filePath: string): Promise<FileStats>;
  lstat(filePath: string): Promise<FileStats>;
}

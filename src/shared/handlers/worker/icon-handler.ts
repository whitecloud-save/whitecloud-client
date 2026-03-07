export interface IconHandler {
  extractFileIcon(request: { exePath: string; targetPath: string }): Promise<Uint8Array>;
}

export interface ShellHandler {
  openPath(path: string): Promise<void>;
  openExternal(url: string): Promise<void>;
}

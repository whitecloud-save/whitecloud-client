export interface AppHandler {
  getVersion(body: void): Promise<string>;
  getLoginItemSettings(body: void): Promise<{ openAtLogin: boolean }>;
  setLoginItemSettings(settings: { openAtLogin: boolean }): Promise<void>;
  isPackaged(): Promise<boolean>;
  getAppPath(name: string): Promise<string>;
  getResourcesPath(): Promise<string>;
  startApplication(body: void): Promise<{
    module: string;
    path: {
      appData: string;
      userData: string;
      documents: string;
      cwd: string;
    };
    hostname: string;
    data: unknown;
    winId: number;
  }>;
}

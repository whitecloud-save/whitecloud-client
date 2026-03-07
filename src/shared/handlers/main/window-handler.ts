export interface WindowHandler {
  createGameGuideWindow(gameId: string, title: string): Promise<number>;
  closeGameGuideWindow(windowId: number): Promise<void>;
  setWindowTop(windowId: number, top: boolean): Promise<void>;
}

export interface ProcessHandler {
  startGame(args: { exePath: string; cwd?: string }): Promise<void>;
  startGameWithLE(args: { lePath: string; profile: string; exePath: string }): Promise<void>;
  listProcesses(body: void): Promise<any>;
}

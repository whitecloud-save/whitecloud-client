import {Route} from '@sora-soft/framework';
import {spawn} from 'child_process';
import binding from '@whitecloud-save/binding-addon';

export class ProcessHandler extends Route {
  // @Route.method
  // async startGame(args: { exePath: string; cwd?: string }): Promise<void> {
  //   return new Promise((resolve, reject) => {
  //     const proc = spawn(args.exePath, [], {
  //       detached: true,
  //       cwd: args.cwd,
  //       stdio: 'ignore',
  //     });

  //     proc.on('error', reject);
  //     proc.unref();
  //     resolve();
  //   });
  // }

  // @Route.method
  // async startGameWithLE(args: { lePath: string; profile: string; exePath: string }): Promise<void> {
  //   return new Promise((resolve, reject) => {
  //     const proc = spawn(args.lePath, [args.profile, args.exePath], {
  //       detached: true,
  //       stdio: 'ignore',
  //     });

  //     proc.on('error', reject);
  //     proc.unref();
  //     resolve();
  //   });
  // }

  @Route.method
  async listProcesses(body: void) {
    const list = binding.listProcesses();
    return list;
  }

  @Route.method
  async spawn(args: {exe: string, params?: string[], cwd?: string}) {
    const proc = spawn(args.exe, args.params || [], {
      cwd: args.cwd,
      detached: true,
      stdio: 'ignore',
    });
    proc.unref();
    return {};
  }
}

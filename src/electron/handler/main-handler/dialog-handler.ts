import {Route} from '@sora-soft/framework';
import {dialog} from 'electron';

export interface IFileDialogResult {
  canceled: boolean;
  filePaths: string[];
}

export class DialogHandler extends Route {
  @Route.method
  async showOpenDialog(options: Electron.OpenDialogOptions): Promise<IFileDialogResult> {
    const result = await dialog.showOpenDialog(options);
    return {
      canceled: result.canceled,
      filePaths: result.filePaths,
    };
  }
}

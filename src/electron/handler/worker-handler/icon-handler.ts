import {Route} from '@sora-soft/framework';
import fileIcon from 'extract-file-icon';
import fs from 'fs/promises';

export class IconHandler extends Route {
  @Route.method
  async extractFileIcon(request: { exePath: string; targetPath: string }) {
    const data = fileIcon(request.exePath, 32);
    await fs.writeFile(request.targetPath, data as NodeJS.ArrayBufferView);
    return data;
  }
}

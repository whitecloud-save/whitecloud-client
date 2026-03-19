import {Route} from '@sora-soft/framework';
import fileIcon from 'extract-file-icon';
import fs from 'fs';
import path from 'path';

export class IconHandler extends Route {
  @Route.method
  async extractFileIcon(request: { exePath: string; targetPath: string }) {
    const data = fileIcon(request.exePath, 32);
    if (!data)
      return null;

    await fs.promises.mkdir(path.dirname(request.targetPath), {recursive: true});
    await fs.promises.writeFile(request.targetPath, data as NodeJS.ArrayBufferView);
    return data;
  }
}

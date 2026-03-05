import {Route} from '@sora-soft/framework';
import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import {mkdirp} from 'mkdirp';

export class ZipHandler extends Route {
  @Route.method
  async createZipFromDirectory(args: { dirPath: string; zipPath: string }) {
    const { dirPath, zipPath } = args;
    const zip = new JSZip();

    const addDirectoryToZip = async (currentPath: string, zipFolder: JSZip) => {
      const entries = await fs.promises.readdir(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);

        if (entry.isDirectory()) {
          const folder = zipFolder.folder(entry.name);
          await addDirectoryToZip(fullPath, folder!);
        } else {
          const stream = fs.createReadStream(fullPath);
          const chunks: Buffer[] = [];

          await new Promise<void>((resolve, reject) => {
            stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
            stream.on('error', reject);
            stream.on('end', () => resolve());
          });

          zipFolder.file(entry.name, Buffer.concat(chunks));
        }
      }
    };

    await addDirectoryToZip(dirPath, zip);

    const zipData = await zip.generateAsync({
      type: 'nodebuffer',
      streamFiles: true,
    });

    await mkdirp(path.dirname(zipPath));
    await fs.promises.writeFile(zipPath, zipData);

    const stat = await fs.promises.stat(zipPath);
    return {
      zipSize: stat.size,
    };
  }

  @Route.method
  async extractZip(args: { zipFilePath: string; targetPath: string }): Promise<void> {
    const { zipFilePath, targetPath } = args;

    const zipData = await fs.promises.readFile(zipFilePath);
    const zip = await JSZip.loadAsync(zipData);

    await fs.promises.rm(targetPath, {recursive: true, force: true});
    await mkdirp(targetPath);

    for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
      if (!zipEntry.dir) {
        const filePath = path.join(targetPath, relativePath);
        await mkdirp(path.dirname(filePath));

        const content = await zipEntry.async('nodebuffer');
        await fs.promises.writeFile(filePath, content);
      }
    }
  }
}

import {Route} from '@sora-soft/framework';
import fs from 'fs';
import path from 'path';
import {mkdirp} from 'mkdirp';
import * as fflate from 'fflate';

export class ZipHandler extends Route {
  @Route.method
  async createZipFromDirectory(args: { dirPath: string; zipPath: string }) {
    const { dirPath, zipPath } = args;

    await mkdirp(path.dirname(zipPath));
    const outputStream = fs.createWriteStream(zipPath);

    const zip = new fflate.Zip();

    zip.ondata = (err, data, final) => {
      if (err) {
        outputStream.destroy(err);
        return;
      }
      outputStream.write(data);
      if (final) {
        outputStream.end();
      }
    };

    const addDirectoryToZip = async (currentPath: string, relativeDir: string) => {
      const entries = await fs.promises.readdir(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        const zipEntryPath = path.join(relativeDir, entry.name);

        if (entry.isDirectory()) {
          const folder = new fflate.ZipPassThrough(zipEntryPath + '/');
          zip.add(folder);
          folder.push(new Uint8Array(0), true);

          await addDirectoryToZip(fullPath, zipEntryPath);
        } else {
          const zipFile = new fflate.ZipDeflate(zipEntryPath);
          zip.add(zipFile);

          const readStream = fs.createReadStream(fullPath);

          await new Promise<void>((resolve, reject) => {
            readStream.on('data', (chunk) => {
              zipFile.push(new Uint8Array(chunk as Buffer));
            });

            readStream.on('end', () => {
              zipFile.push(new Uint8Array(0), true);
              resolve();
            });

            readStream.on('error', (err) => {
              readStream.destroy();
              reject(err);
            });
          });
        }
      }
    };

    await addDirectoryToZip(dirPath, '');

    zip.end();

    await new Promise<void>((resolve, reject) => {
      outputStream.on('finish', resolve);
      outputStream.on('error', reject);
    });

    const stat = await fs.promises.stat(zipPath);
    return {
      zipSize: stat.size,
    };
  }

  @Route.method
  async extractZip(args: { zipFilePath: string; targetPath: string }) {
    const { zipFilePath, targetPath } = args;

    await fs.promises.rm(targetPath, { recursive: true, force: true });
    await mkdirp(targetPath);

    const unzipper = new fflate.Unzip();

    const fileWritePromises: Promise<unknown>[] = [];

    unzipper.onfile = async (file) => {
      const filePath = path.join(targetPath, file.name);

      if (file.name.endsWith('/')) {
        fileWritePromises.push(mkdirp(filePath));
      } else {
        await mkdirp(path.dirname(filePath));
        const writeStream = fs.createWriteStream(filePath);

        file.ondata = (err, data, final) => {
          if (err) {
            writeStream.destroy(err);
            return;
          }
          writeStream.write(data);
          if (final) {
            writeStream.end();
          }
        };

        const promise = (async () => {

          await new Promise<void>((resolve, reject) => {
            writeStream.on('finish', resolve);
            writeStream.on('error', reject);
          });
        })();
        fileWritePromises.push(promise);
        file.start();
      }
    };

    const readStream = fs.createReadStream(zipFilePath);

    try {
      await new Promise<void>((resolve, reject) => {
        readStream.on('data', (chunk) => {
          unzipper.push(new Uint8Array(chunk as Buffer));
        });

        readStream.on('end', () => {
          unzipper.push(new Uint8Array(0), true);
          resolve();
        });

        readStream.on('error', reject);
      });

      await Promise.all(fileWritePromises);
    } catch (error) {
      readStream.destroy();
      throw error;
    }

    return {};
  }
}

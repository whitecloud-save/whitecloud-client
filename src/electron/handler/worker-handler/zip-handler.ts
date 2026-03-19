import {Connector, Notify, Request, Route} from '@sora-soft/framework';
import fs from 'fs';
import path from 'path';
import {mkdirp} from 'mkdirp';
import * as fflate from 'fflate';

export class ZipHandler extends Route {
  @Route.method
  async createZipFromDirectory(args: {dirPath: string; zipPath: string},  request: Request, connector: Connector) {
    const {dirPath, zipPath} = args;

    await mkdirp(path.dirname(zipPath));
    const outputStream = fs.createWriteStream(zipPath);
    const finalPromise = new Promise<void>((resolve, reject) => {
      outputStream.on('close', resolve);
      outputStream.on('error', reject);
    });

    const zip = new fflate.Zip();
    zip.ondata = (err, chunk, final) => {
      if (err) {
        outputStream.destroy();
        throw err;
      }
      outputStream.write(Buffer.from(chunk));
      if (final) {
        outputStream.end();
      }
    };

    const entries = await fs.promises.readdir(dirPath, {withFileTypes: true, recursive: true});
    let handled = 0;

    const notifyCallback = () => {
      const callbackId = request.getHeader('callback-id');
      if (callbackId) {
        const notify = new Notify({
          method: 'rpc-callback',
          service: 'electron',
          headers: {
            'callback-id': callbackId,
          },
          payload: {
            total: entries.length,
            handled,
          },
        });
        connector.sendNotify(notify);
      }
    }

    for (const entry of entries) {
      const fullPath = path.join(entry.parentPath, entry.name);
      const zipEntryPath = path.relative(dirPath, fullPath);

      if (entry.isFile()) {
        const zipFile = new fflate.ZipPassThrough(zipEntryPath);
        zip.add(zipFile);

        await new Promise<void>((resolve, reject) => {
          const fileStream = fs.createReadStream(fullPath);
          fileStream.on('data', (chunk) => zipFile.push(chunk as Buffer));
          fileStream.on('end', () => {
            zipFile.push(new Uint8Array(0), true); // 标记该文件结束

            handled ++;
            notifyCallback();
            resolve();
          });
          fileStream.on('error', reject);
        });
      } else {
        handled ++;
        notifyCallback();
      }
    }

    zip.end();
    await finalPromise;
    const stat = await fs.promises.stat(zipPath);
    return {
      zipSize: stat.size,
    };
  }

  @Route.method
  async extractZip(args: { zipFilePath: string; targetPath: string }) {
    const {zipFilePath, targetPath} = args;

    await fs.promises.rm(targetPath, { recursive: true, force: true });
    await mkdirp(targetPath);

    const unzipper = new fflate.Unzip();
    unzipper.register(fflate.UnzipInflate);

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

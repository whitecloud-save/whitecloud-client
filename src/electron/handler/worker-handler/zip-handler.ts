import {Route} from '@sora-soft/framework';
import fs from 'fs';
import path from 'path';
import {mkdirp} from 'mkdirp';
import * as fflate from 'fflate';

export class ZipHandler extends Route {
  @Route.method
  async createZipFromDirectory(args: {dirPath: string; zipPath: string}) {
    const {dirPath, zipPath} = args;

    await mkdirp(path.dirname(zipPath));
    const outputStream = fs.createWriteStream(zipPath);
    const finalPromise = new Promise<void>((resolve, reject) => {
      outputStream.on('close', resolve);
      outputStream.on('error', reject);
    });

    console.log(zipPath);

    const zip = new fflate.Zip();
    zip.ondata = (err, chunk, final) => {
      // console.log('zip ondata, final', final);
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
    for (const entry of entries) {
      const fullPath = path.join(entry.parentPath, entry.name);
      const zipEntryPath = path.relative(dirPath, fullPath);

      if (entry.isFile()) {
        console.log(zipEntryPath);
        // const readStream = fs.createReadStream(fullPath);
        // const zipContent = new fflate.ZipDeflate(zipEntryPath, {level: 9});
        // zip.add(zipContent);

        // readStream.on('data', (chunk) => {
        //   zipContent.push(chunk as Buffer);
        // });

        // await new Promise<void>((resolve, reject) => {
        //   readStream.on('end', resolve);
        //   readStream.on('error', reject);
        // });

        const zipFile = new fflate.ZipPassThrough(zipEntryPath);
        zip.add(zipFile);

        // 使用传统的 ReadStream 配合 on('data')
        // 这是最底层的对接方式，避开 pipeline 可能存在的兼容性问题
        await new Promise<void>((resolve, reject) => {
          const fileStream = fs.createReadStream(fullPath);
          fileStream.on('data', (chunk) => zipFile.push(chunk as Buffer));
          fileStream.on('end', () => {
            zipFile.push(new Uint8Array(0), true); // 标记该文件结束
            resolve();
          });
          fileStream.on('error', reject);
        });
      }
    }

    console.log('zip end');
    zip.end();


    await finalPromise;

    console.log('stat');
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

import {Route} from '@sora-soft/framework';
import axios from 'axios';
import fs from 'fs';
import got from 'got';
import {chunkFromAsync} from 'chunk-data';

// export interface IReqOssUpload {
//   region: string;
//   bucket: string;
//   callback: string;
//   filename: string;
//   accessKeyId: string;
//   accessKeySecret: string;
//   securityToken: string;
//   expiration: string;

//   filePath: string;
// }

export interface IReqOssUpload {
  url: string;
  callback: string;
  filename: string;

  saveFilePath: string;
}

export class OssHandler extends Route {
  @Route.method
  async download(url: string) {
    const res = await axios.get(url, {responseType: 'arraybuffer'});
    return res.data as Uint8Array;
              // .then(async (response) => {
              //   await workerAPI.fs.mkdir({path: PathUtil.dirname(this.filePath), options: {recursive: true}});
              //   await workerAPI.fs.writeFile({path: this.filePath, data: Buffer.from(response.data)});
              //   resolve();
              // }).catch(e => reject(e));
    // const data = fileIcon(request.exePath, 32);
    // await fs.writeFile(request.targetPath, data as NodeJS.ArrayBufferView);
    // return data;
  }

  @Route.method
  async uploadSave(body: IReqOssUpload) {
    console.log(body.callback);
    const fileStream = fs.createReadStream(body.saveFilePath);
    const stat = await fs.promises.stat(body.saveFilePath);

    await got.put(body.url, {
      body: chunkFromAsync(fileStream, 65_536),
      headers: {
        'Content-Type': 'application/x-zip-compressed',
        'Content-Length': stat.size.toString(),
        'x-oss-callback': body.callback,
      }
    })
    .on('uploadProgress', progress => {
      console.log(progress);
    });
    // const stat = await fs.promises.stat(body.saveFilePath);

    // await axios.put(body.url, fileStream, {
    //   headers: {
    //     'Content-Type': 'application/x-zip-compressed',
    //     'Content-Length': stat.size,
    //     'x-oss-callback': body.callback,
    //   },
    //   onUploadProgress: (e) => {
    //     console.log(`进度: ${(e.loaded / (e.total || 1) * 100).toFixed(2)}%`);
    //   },
    // });

    console.log('uploaded');
    return {};
  //    const client = new OSS({
  //     region: body.region,
  //     accessKeyId: body.accessKeyId,
  //     accessKeySecret: body.accessKeySecret,
  //     stsToken: body.securityToken,
  //     bucket: body.bucket,
  //   });

  //   await client.multipartUpload(body.filename, body.filePath, {
  //     parallel: 4,
  //     headers: {
  //       'x-oss-callback': body.callback,
  //     },
  //     progress: (p: number) => console.log(`进度: ${p * 100}%`)
  //   });
  }
}

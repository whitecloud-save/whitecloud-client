export interface IReqOssUpload {
  url: string;
  callback: string;
  filename: string;
  saveFilePath: string;
}

export interface OssHandler {
  download(url: string): Promise<Uint8Array>;
  uploadSave(body: IReqOssUpload): Promise<void>;
}

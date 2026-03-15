import {contextBridge, ipcRenderer, webUtils} from 'electron';

let workerMessagePort: MessagePort | null = null;
let workerProtReadyResolve: ((port: MessagePort) => void) | null = null;
const workerPortReadyPromise = new Promise<MessagePort>((resolve) => {
  workerProtReadyResolve = resolve;
});

let mainMessagePort: MessagePort | null = null;
let mainProtReadyResolve: ((port: MessagePort) => void) | null = null;
const mainPortReadyPromise = new Promise<MessagePort>((resolve) => {
  mainProtReadyResolve = resolve;
});


ipcRenderer.on('worker-port-init', (event) => {
  workerMessagePort = event.ports[0];
  workerMessagePort.start();
  workerProtReadyResolve?.(workerMessagePort);
});

ipcRenderer.on('main-port-init', (event) => {
  mainMessagePort = event.ports[0];
  mainMessagePort.start();
  mainProtReadyResolve?.(mainMessagePort);
});

contextBridge.exposeInMainWorld('workerChannel', {
  async ready(): Promise<void> {
    await workerPortReadyPromise;
  },

  postMessage(data: any): void {
    if (!workerMessagePort) {
      throw new Error('WorkerMessagePort is not ready');
    }
    workerMessagePort.postMessage(data);
  },

  onMessage(callback: (data: any) => void): void {
    if (!workerMessagePort) {
      throw new Error('WorkerMessagePort is not ready');
    }
    workerMessagePort.onmessage = (event) => {
      callback(event.data);
    };
  },

});

contextBridge.exposeInMainWorld('mainChannel', {
  async ready(): Promise<void> {
    await mainPortReadyPromise;
  },

  postMessage(data: any): void {
    if (!mainMessagePort) {
      throw new Error('MainMessagePort is not ready');
    }
    mainMessagePort.postMessage(data);
  },

  onMessage(callback: (data: any) => void): void {
    if (!mainMessagePort) {
      throw new Error('MainMessagePort is not ready');
    }
    mainMessagePort.onmessage = (event) => {
      callback(event.data);
    };
  },
});

contextBridge.exposeInMainWorld('electron', {
  getFilePath: (file: File) => {
    // webUtils.getPathForFile 是专门用于解决隔离环境下获取路径的工具
    return webUtils.getPathForFile(file);
  }
})

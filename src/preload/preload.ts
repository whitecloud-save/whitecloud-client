import {contextBridge, ipcRenderer} from 'electron';

let messagePort: MessagePort | null = null;
let portReadyResolve: ((port: MessagePort) => void) | null = null;
const portReadyPromise = new Promise<MessagePort>((resolve) => {
  portReadyResolve = resolve;
});

ipcRenderer.on('port-to-renderer', (event) => {
  messagePort = event.ports[0];
  messagePort.start();
  portReadyResolve?.(messagePort);
});

contextBridge.exposeInMainWorld('workerChannel', {
  async ready(): Promise<void> {
    await portReadyPromise;
  },

  postMessage(data: any): void {
    console.log('postMessage', data);
    if (!messagePort) {
      throw new Error('MessagePort is not ready');
    }
    messagePort.postMessage(data);
  },

  onMessage(callback: (data: any) => void): void {
    if (!messagePort) {
      throw new Error('MessagePort is not ready');
    }
    messagePort.onmessage = (event) => {
      callback(event.data);
    };
  },
});

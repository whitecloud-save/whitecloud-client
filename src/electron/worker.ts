import {Route} from "@sora-soft/framework";
import {ElectronMessageListener} from './lib/ElectronMessageListener.js';
import {WorkerHandler} from './handler/worker-handler.js';

process.parentPort.on('message', async (event) => {
  if (event.data.command === 'init-port') {
    const handler = new WorkerHandler();
    const listener = new ElectronMessageListener(event.ports[0], Route.callback(handler));
    await listener.startListen();
  }
});

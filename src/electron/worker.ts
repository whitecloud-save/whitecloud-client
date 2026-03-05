import {Connector, IRawReqPacket, Route} from "@sora-soft/framework";
import {ElectronMessageListener} from './lib/electron-message-listener.js';
import {FsHandler} from './handler/worker-handler/fs-handler.js';
import {ZipHandler} from './handler/worker-handler/zip-handler.js';
import {CryptoHandler} from './handler/worker-handler/crypto-handler.js';
import {DatabaseHandler} from './handler/worker-handler/database-handler.js';
import {ProcessHandler} from './handler/worker-handler/process-handler.js';
import {IconHandler} from './handler/worker-handler/icon-handler.js';
import {UpdateHandler} from './handler/worker-handler/update-handler.js';

let currentListener: ElectronMessageListener | null = null;
let databaseHandler: DatabaseHandler | null = null;

const MessageRoute = {
  callback(handlers: Record<string, Route>): (data: IRawReqPacket<unknown>, session: string | undefined, connector: Connector) => Promise<any> {
    return async (packet: any, session, connector) => {
      const service = packet.service;
      const handler = handlers[service];

      if (!handler) {
        throw new Error(`Unknown service: ${service}`);
      }

      const routeCallback = Route.callback(handler);
      return routeCallback(packet, session, connector);
    };
  }
};

process.parentPort.on('message', async (event) => {
  if (event.data.command === 'init-port') {
    const dbPath = event.data.dbPath;

    if (currentListener) {
      try {
        await currentListener.close();
      } catch (err) {
        console.error('Failed to shutdown old listener:', err);
      }
    }

    if (!databaseHandler) {
      databaseHandler = new DatabaseHandler();
      await databaseHandler.initDatabase(dbPath);
    }

    const fsHandler = new FsHandler();
    const zipHandler = new ZipHandler();
    const cryptoHandler = new CryptoHandler();
    const processHandler = new ProcessHandler();
    const iconHandler = new IconHandler();
    const updateHandler = new UpdateHandler();

    currentListener = new ElectronMessageListener(
      event.ports[0],
      MessageRoute.callback({
        'fs': fsHandler,
        'zip': zipHandler,
        'crypto': cryptoHandler,
        'db': databaseHandler,
        'process': processHandler,
        'icon': iconHandler,
        'update': updateHandler,
      })
    );
    await currentListener.startListen();
  }
});

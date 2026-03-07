import {Connector, IRawReqPacket, Route} from "@sora-soft/framework";
import {ElectronMessageListener} from './lib/electron-message-listener.js';
import {FsHandler} from './handler/worker-handler/fs-handler.js';
import {ZipHandler} from './handler/worker-handler/zip-handler.js';
import {CryptoHandler} from './handler/worker-handler/crypto-handler.js';
import {DatabaseHandler} from './handler/worker-handler/database-handler.js';
import {ProcessHandler} from './handler/worker-handler/process-handler.js';
import {IconHandler} from './handler/worker-handler/icon-handler.js';
import {UpdateHandler} from './handler/worker-handler/update-handler.js';
import {DataSource} from 'typeorm';
import {LocalGameDB} from './database/game.js';
import {SaveDB} from './database/save.js';
import {GameHistoryDB} from './database/game-history.js';
import {GameGuideDB} from './database/game-guide.js';
import {GameActivityDB} from './database/game-activity.js';
import {OssHandler} from './handler/worker-handler/oss-handler.js';

let currentListener: ElectronMessageListener | null = null;
let dataSource: DataSource | null = null;

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

    if (!dataSource) {
      dataSource = new DataSource({
        type: 'sqlite',
        database: dbPath,
        entities: [LocalGameDB, SaveDB, GameHistoryDB, GameGuideDB, GameActivityDB],
        synchronize: true,
      });
      await dataSource.initialize();
    }

    if (currentListener) {
      try {
        await currentListener.close();
      } catch (err) {
        console.error('Failed to shutdown old listener:', err);
      }
    }

    currentListener = new ElectronMessageListener(
      event.ports[0],
      MessageRoute.callback({
        fs: new FsHandler(),
        zip: new ZipHandler(),
        crypto: new CryptoHandler(),
        db: new DatabaseHandler(dataSource),
        process: new ProcessHandler(),
        icon: new IconHandler(),
        update: new UpdateHandler(),
        oss: new OssHandler(),
      })
    );
    await currentListener.startListen();
  }
});

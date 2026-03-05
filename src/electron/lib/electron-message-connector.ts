import {Connector, Context, IListenerInfo, IRawNetPacket} from '@sora-soft/framework';
import {type MessagePortMain} from 'electron/main';
import { unpack, pack } from 'msgpackr';

export class ElectronMessageConnector extends Connector {
  constructor(port: MessagePortMain) {
    super({
      ping: {
        enabled: false,
      },
    });

    this.port_ = port;
    port.on('message', (event) => {
      this.handleIncomeMessage(unpack(event.data), undefined, this);
    });
  }

  isAvailable(): boolean {
    return true;
  }

  get protocol(): string {
    return 'message';
  }

  protected async connect(target: IListenerInfo, context: Context): Promise<void> {
    this.port_.start();
  }

  protected async disconnect(): Promise<void> {
    this.port_.close();
  }

  async send<RequestPayload>(request: IRawNetPacket<RequestPayload>): Promise<void> {
    this.port_.postMessage(pack(request));
  }

  async sendRaw(request: Object): Promise<void> {
    this.port_.postMessage(pack(request));
  }

  private port_: MessagePortMain;
}

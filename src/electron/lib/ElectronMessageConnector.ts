import {Connector, Context, IListenerInfo, IRawNetPacket} from '@sora-soft/framework';
import {type MessagePortMain} from 'electron/main';

export class ElectronMessageConnector extends Connector {
  constructor(port: MessagePortMain) {
    super({
      ping: {
        enabled: false,
      },
    });

    this.port_ = port;
    port.on('message', (event) => {
      console.log('on message');
      console.log(event.data);
      this.handleIncomeMessage(event.data, undefined, this);
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
    this.port_.postMessage(request);
  }

  async sendRaw(request: Object): Promise<void> {
    this.port_.postMessage(request);
  }

  private port_: MessagePortMain;
}

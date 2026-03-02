import {Context, IListenerInfo, Listener, ListenerCallback} from "@sora-soft/framework";
import {MessagePortMain} from 'electron';
import {ElectronMessageConnector} from './ElectronMessageConnector.js';

export class ElectronMessageListener extends Listener {
  constructor(port: MessagePortMain, callback: ListenerCallback) {
    super(callback);
    this.messagePort_ = port;

    port.start();
    this.newConnector('', new ElectronMessageConnector(port));
  }

  protected async listen(context: Context): Promise<IListenerInfo> {
    if (!this.messagePort_) {
      throw new Error('message port is null');
    }

    return this.metaData;
  }

  protected shutdown(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  get metaData(): IListenerInfo {
    return {
      protocol: 'message',
      endpoint: '',
      labels: this.labels,
    };
  }

  get version(): string {
    return '0.0.0';
  }

  private messagePort_?: MessagePortMain;
}

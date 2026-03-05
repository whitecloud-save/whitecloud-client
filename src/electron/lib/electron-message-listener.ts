import {Context, IListenerInfo, Listener, ListenerCallback} from "@sora-soft/framework";
import {ElectronMessageConnector} from './electron-message-connector.js';
import {MessagePortMain} from 'electron';

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

  protected async shutdown(): Promise<void> {
    if (this.messagePort_) {
      this.messagePort_.close();
      this.messagePort_ = undefined;
    }
  }

  public async close(): Promise<void> {
    await this.shutdown();
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

import {Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {ServiceName, UserErrorCode} from './api';
import {ConvertRouteMethod, IRemoteHandler, ServerService, ServerState} from './server.service';
import {APP_CONFIG} from '../../../environments/environment';
import {ErrorLevel} from '../../library/error/ErrorUtil';
import {Observable, Subject} from 'rxjs';
import {TokenService} from './token.service';
import {UserError} from '../../library/error/UserError';
import {ServerError} from '../../library/error/ServerError';
import {NetError} from '../../library/error/NetError';
import {ConnectionState, ConnectionStateService} from '../connection-state.service';
import {Waiter} from '../../library/waiter';

export type IRawNetPacket<T = unknown> = IRawReqPacket<T> | IRawResPacket<unknown> | IRawOperationPacket;

export enum OPCode {
  REQUEST = 1,
  RESPONSE = 2,
  NOTIFY = 3,
  OPERATION = 4,
}

export interface IRawReqPacket<T = unknown> {
  opcode: OPCode.REQUEST | OPCode.NOTIFY;
  method: string;
  service: string;
  headers: {
    [key: string]: any;
  };
  payload: T;
}

export interface IRawOperationPacket {
  opcode: OPCode.OPERATION;
  command: string;
  args: any;
}

export interface IPayloadError {
  code: string;
  message: string;
  level: ErrorLevel;
  name: string;
}

export interface IRawResPacket<T = unknown> {
  opcode: OPCode.RESPONSE;
  headers: {
    [key: string]: any;
  };
  payload: IResPayloadPacket<T>;
}

export interface IResPayloadPacket<T = unknown> {
  error: IPayloadError | null;
  result: T | null;
}

const ReconnectDelays = [1000, 2000, 5000, 10000];

@Injectable({
  providedIn: 'root',
})
export class WebsocketServerService extends ServerService {
  constructor(
    private router: Router,
    private token: TokenService,
    private connectionStateService: ConnectionStateService,
  ) {
    super();
    this.client_ = null;
    this.connect();
  }

  protected createNotifyObserver<T>(name: string): Observable<T> {
    const subject = new Subject<T>();
    this.notifyPool_.set(name, subject as Subject<unknown>);
    const observable = new Observable<T>(observer => {
      const sub = subject.subscribe(observer);
      return () => {
        sub.unsubscribe();
      };
    });
    return observable;
  }

  protected createApi<Handler extends IRemoteHandler>(name: ServiceName): ConvertRouteMethod<Handler> {
    return new Proxy({} as any, {
      get: (target, prop: string, receiver) => {
        return async (body: unknown) => {
          console.log(prop);
          const client = await this.connect();
          const waiter = this.waiter_.wait(1000 * 10);
          const packet: IRawReqPacket = {
            opcode: OPCode.REQUEST,
            method: prop,
            service: name,
            headers: {
              'rpc-id': waiter.id,
              'rpc-authorization': this.token.token,
              'authorization': `sora-session ${this.token.token}`,
            },
            payload: body || {},
          };
          client.send(JSON.stringify(packet));
          return waiter.promise;
        };
      },
    });
  }

  private async connect(delay: number = 0): Promise<WebSocket> {
    if (this.clientPromise_)
      return this.clientPromise_;

    this.$state.next(ServerState.CONNECTING);

    let url = APP_CONFIG.websocketEndpoint;
    if (url.startsWith('/')) {
      url = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}${url}`;
    }

    this.clientPromise_ = new Promise(async (resolve) => {
      if (delay)
        await new Promise((resolve) => setTimeout(resolve, delay));

      const client = this.client_ = new WebSocket(url);
      this.connectionStateService.setConnectState(ConnectionState.Connecting);

      client.onopen = () => {
        resolve(client);
        this.$state.next(ServerState.CONNECTED);
        this.connectionStateService.setConnectState(ConnectionState.OK);
        this.currentReconnectIndex_ = 0;

        client.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data.toString()) as IRawNetPacket;
            this.handleIncomeMessage(message);
          } catch (err) {
            console.error('解析消息失败:', err);
          }
        };
      };

      client.onclose = (event) => {
        this.handleDisconnect(event.code, event.reason);
      }
    });

    return this.clientPromise_;
  }

  private handleDisconnect(code: number, reason: string) {
    console.log('WebSocket 断开连接:', code, reason);
    this.client_ = null;

    for (const [rpcId, waiter] of this.waiter_.getAll()) {
      this.waiter_.emitError(rpcId, new NetError('连接已断开'));
    }

    this.$state.next(ServerState.DISCONNECTED);
    this.connectionStateService.setConnectState(ConnectionState.Error, reason || '未知错误');
    this.scheduleReconnect();
  }

  private disconnect() {
    if (this.client_) {
      this.client_.close(1000, '手动断开');
    }

    this.connectionStateService.setConnectState(ConnectionState.Initial);
  }

  private handleIncomeMessage(message: IRawNetPacket) {
    switch(message.opcode) {
      case OPCode.OPERATION: {
        this.handleCommand(message);
        break;
      }
      case OPCode.RESPONSE: {
        this.handleResponse(message);
        break;
      }
      case OPCode.NOTIFY: {
        const subject = this.notifyPool_.get(message.method);
        subject?.next(message.payload);
        break;
      }
    }
  }

  private handleResponse(message: IRawResPacket) {
    const rpcId = message.headers['rpc-id'];
    const waiter = this.waiter_.get(rpcId);

    if (!waiter)
      return;

    this.waiter_.remove(rpcId);

    if (message.payload.error) {
      let error: Error | null = null;
      switch (message.payload.error.level) {
        case ErrorLevel.EXPECTED:
          error = new UserError(message.payload.error.code as UserErrorCode, message.payload.error.message);
          break;
        default:
          error = new ServerError(message.payload.error.code);
      }
      waiter.reject(error);
    } else {
      waiter.resolve(message.payload.result);
    }
  }

  private handleCommand(message: IRawOperationPacket) {
    switch(message.command) {
      case 'ping': {
        this.sendOperation('pong', message.args);
        break;
      }
      case 'close': {
        this.disconnect();
        break;
      }
    }
  }

  private sendOperation(command: string, args: any) {
    if (this.client_ && this.client_.readyState === WebSocket.OPEN) {
      const packet: IRawOperationPacket = {
        opcode: OPCode.OPERATION,
        command,
        args,
      };
      this.client_.send(JSON.stringify(packet));
    }
  }

  private scheduleReconnect() {
    const delay = this.calculateReconnectDelay();
    console.log(`将在 ${delay}ms 后尝试重连...`);

    this.$state.next(ServerState.DISCONNECTED);
    this.clientPromise_ = undefined;
    this.currentReconnectIndex_++;
    return this.connect(delay);
  }

  private calculateReconnectDelay(): number {
    const delays = ReconnectDelays;
    const maxIndex = delays.length - 1;
    const index = Math.min(this.currentReconnectIndex_, maxIndex);
    return delays[index];
  }

  // private clearReconnect() {
  //   if (this.reconnectTimeout_) {
  //     clearTimeout(this.reconnectTimeout_);
  //     this.reconnectTimeout_ = null;
  //   }
  // }

  private client_: WebSocket | null;
  private currentReconnectIndex_: number = 0;
  private notifyPool_: Map<string, Subject<unknown>> = new Map();
  private waiter_: Waiter<any> = new Waiter<any>();
  private clientPromise_?: Promise<WebSocket>;
}

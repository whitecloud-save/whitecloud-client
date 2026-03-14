import {pack, unpack} from 'msgpackr';
import {Waiter} from '../waiter';
import {Observable, Subject} from 'rxjs';

export type IRawNetPacket<T = unknown> = IRawReqPacket<T> | IRawResPacket<unknown> | IRawOperationPacket;

export interface IRemoteHandler {}
type TypeOfClassMethod<T, M extends keyof T> = T[M] extends (...args: any) => any ? T[M] : never;
export type ConvertRouteMethod<T extends IRemoteHandler> = {
  [K in keyof T]: (body: Parameters<TypeOfClassMethod<T, K>>[0], callback?: Function) => ReturnType<TypeOfClassMethod<T, K>>;
};

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
  level: number;
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

export interface IWorkerChannel {
  ready(): Promise<void>;
  postMessage(data: any): void;
  onMessage(callback: (data: any) => void): void;
}

export class Client {
  private waiter_: Waiter<any> = new Waiter<any>();
  private notifyPool_: Map<string, Subject<IRawReqPacket<unknown>>> = new Map();
  private channel_: IWorkerChannel;

  constructor(channel: IWorkerChannel) {
    this.channel_ = channel;
    this.callbackId_ = 0;
    this.callbackMap_ = new Map();

    this.channel_.ready().then(() => {
      this.channel_.onMessage((message: Uint8Array) => {
        this.handleIncomeMessage(unpack(message));
      });
    });

    this.createNotifyObserver('rpc-callback').subscribe((body) => {
      const callbackId = body.headers['callback-id'];
      if (!callbackId)
        return;
      const callback = this.callbackMap_.get(callbackId);
      if (!callback) {
        console.log('callback not found');
        return;
      }
      callback(body.payload);
    });

  }

  protected createNotifyObserver<T>(name: string): Observable<IRawReqPacket<T>> {
    const subject = new Subject<IRawReqPacket<T>>();
    this.notifyPool_.set(name, subject as Subject<IRawReqPacket<unknown>>);
    const observable = new Observable<IRawReqPacket<T>>(observer => {
      const sub = subject.subscribe(observer);
      return () => {
        sub.unsubscribe();
      };
    });
    return observable;
  }

  createApi<Handler extends IRemoteHandler>(service: string = 'electron'): ConvertRouteMethod<Handler> {
    return new Proxy({} as any, {
      get: (target, prop: string, receiver) => {
        return async (body: unknown, callback?: Function) => {
          await this.channel_.ready();

          const waiter = this.waiter_.wait();
          const callbackId = callback ? ++this.callbackId_ : undefined;
          if (callback && callbackId) {
            this.callbackMap_.set(callbackId, callback);
          }

          const packet: IRawReqPacket = {
            opcode: OPCode.REQUEST,
            method: prop,
            service: service,
            headers: {
              'rpc-id': waiter.id,
              'callback-id': callbackId,
            },
            payload: body || {},
          };
          this.channel_.postMessage(pack(packet));
          return waiter.promise;
        };
      },
    });
  }

  private handleIncomeMessage(message: IRawNetPacket) {
    switch(message.opcode) {
      case OPCode.OPERATION: {
        break;
      }
      case OPCode.RESPONSE: {
        this.handleResponse(message);
        break;
      }
      case OPCode.NOTIFY: {
        const subject = this.notifyPool_.get(message.method);
        subject?.next(message);
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
      const error = new Error(message.payload.error.message);
      waiter.reject(error);
    } else {
      waiter.resolve(message.payload.result);
    }
  }

  private callbackId_: number;
  private callbackMap_: Map<number, Function>;
}

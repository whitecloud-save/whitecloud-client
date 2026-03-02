import {Waiter} from './waiter';

export type IRawNetPacket<T = unknown> = IRawReqPacket<T> | IRawResPacket<unknown> | IRawOperationPacket;

export interface IRemoteHandler {}
type TypeOfClassMethod<T, M extends keyof T> = T[M] extends (...args: any) => any ? T[M] : never;
export type ConvertRouteMethod<T extends IRemoteHandler> = {
  [K in keyof T]: (body: Parameters<TypeOfClassMethod<T, K>>[0]) => ReturnType<TypeOfClassMethod<T, K>>;
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

type NotifyCallback<T> = (notify: T) => void;

export class Client {
  private waiter_: Waiter<any> = new Waiter<any>();
  private notifyPool_: Map<string, NotifyCallback<unknown>> = new Map();
  private channel_: IWorkerChannel;

  constructor(channel: IWorkerChannel) {
    this.channel_ = channel;

    this.channel_.onMessage((message: IRawNetPacket) => {
      this.handleIncomeMessage(message);
    });
  }

  createApi<Handler extends IRemoteHandler>(): ConvertRouteMethod<Handler> {
    return new Proxy({} as any, {
      get: (target, prop: string, receiver) => {
        return async (body: unknown) => {
          const waiter = this.waiter_.wait(1000 * 10);
          const packet: IRawReqPacket = {
            opcode: OPCode.REQUEST,
            method: prop,
            service: 'electron',
            headers: {
              'rpc-id': waiter.id,
            },
            payload: body || {},
          };
          this.channel_.postMessage(packet);
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
        const notifyMessage = message as any;
        const callback = this.notifyPool_.get(notifyMessage.method);
        if (callback) {
          callback(notifyMessage.payload);
        }
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
}

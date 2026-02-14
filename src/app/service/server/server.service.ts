import {BehaviorSubject, Observable} from 'rxjs';
import {ErrorLevel} from '../../library/error/ErrorUtil';
import {AuthHandler, BusinessHandler, PaymentHandler, RestfulHandler, ServiceName} from './api';

// tslint:disable-next-line
export interface IRemoteHandler {}
type ThenArg<T> = T extends PromiseLike<infer U> ? U : T;
type TypeOfClassMethod<T, M extends keyof T> = T[M] extends (...args: any) => any ? T[M] : never;
export type ConvertRouteMethod<T extends IRemoteHandler> = {
  [K in keyof T]: (body: Parameters<TypeOfClassMethod<T, K>>[0]) => ReturnType<TypeOfClassMethod<T, K>>;
};
export type ConvertRouteNotify<T extends IRemoteHandler> = {
  [K in keyof T]: () => Observable<Parameters<TypeOfClassMethod<T, K>>[0]>;
}

export interface IResNetResponse<T> {
  error: {
    code: string;
    message: string;
    level: ErrorLevel;
    name: string;
  };
  result: T;
}

export enum ServerState {
  DISCONNECTED,
  CONNECTING,
  CONNECTED,
}

export abstract class ServerService {
  restful: ConvertRouteMethod<RestfulHandler>;
  auth: ConvertRouteMethod<AuthHandler>;
  business: ConvertRouteMethod<BusinessHandler>;
  payment: ConvertRouteMethod<PaymentHandler>;

  $state = new BehaviorSubject(ServerState.DISCONNECTED);

  constructor() {
    this.restful = this.createApi(ServiceName.Restful);
    this.auth = this.createApi(ServiceName.Auth);
    this.business = this.createApi(ServiceName.Business);
    this.payment = this.createApi(ServiceName.Payment);
  }

  protected abstract createApi<Handler extends IRemoteHandler>(name: ServiceName): ConvertRouteMethod<Handler>;

  public notify<T extends IRemoteHandler>(): ConvertRouteNotify<T> {
    return new Proxy({} as ConvertRouteNotify<T>, {
      get: (target, prop: string) => {
        return () => {
          return this.createNotifyObserver(prop);
        };
      },
    });
  }
  protected abstract createNotifyObserver<T>(name: string): Observable<T>;
}

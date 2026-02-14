import {Injectable} from '@angular/core';
import {ServerService, ServerState} from './server/server.service';
import {TokenService} from './server/token.service';
import {UserError} from '../library/error/UserError';
import {AccountLoginType, AccountVIP, ClientNotifyHandler, UserErrorCode, INotifyStorageUpdate, INotifyVipUpdate, INotifyPaymentSuccess} from './server/api';
import {BehaviorSubject} from 'rxjs';
import {NzMessageService} from 'ng-zorro-antd/message';
import {NzModalService} from 'ng-zorro-antd/modal';
import {APP_CONFIG} from '../../environments/environment';
import {UnixTime} from '../library/utility';
import {ConnectionState, ConnectionStateService} from './connection-state.service';
import {ErrorHandlingUtil} from './error-handling-util';

export interface IStorageInfo {
  usedSpace: number;
  totalSpace: number;
}

export interface IUserInfo {
  id: number;
  nickname?: string;
  avatar?: string;
  vipInfo?: AccountVIP;
  storageInfo?: IStorageInfo;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  public logged: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public userInfo: IUserInfo | null = null;
  public storageUpdate: BehaviorSubject<INotifyStorageUpdate | null> = new BehaviorSubject<INotifyStorageUpdate | null>(null);

  constructor(
    private server: ServerService,
    private token: TokenService,
    private message: NzMessageService,
    private modal: NzModalService,
    private errorHandlingUtil: ErrorHandlingUtil,
  ) {
    server.$state.subscribe((state) => {
      switch(state) {
        case ServerState.CONNECTED: {
          if (this.logged.getValue()) {
            this.reconnectLogin().catch(err => {});
          } else {
            this.fetchUserInfo().catch(err => {});
          }
          break;
        }
        case ServerState.DISCONNECTED:
        case ServerState.CONNECTING: {
          this.disconnectLogout();
          break;
        }
      }
    });

    this.server.notify<ClientNotifyHandler>().notifyUserInfoUpdate().subscribe((notify) => {
      if (!this.userInfo)
        return;
      if (notify.nickname) {
        this.userInfo.nickname = notify.nickname;
      }
      if (notify.avatar) {
        this.userInfo.avatar = notify.avatar;
      }
    });

    this.server.notify<ClientNotifyHandler>().notifyStorageUpdate().subscribe((notify) => {
      if (!this.userInfo)
        return;
      if (this.userInfo.storageInfo) {
        this.userInfo.storageInfo.usedSpace = notify.usedSpace;
        this.userInfo.storageInfo.totalSpace = notify.totalSpace;
      }
      this.storageUpdate.next(notify);
    });

    this.server.notify<ClientNotifyHandler>().notifyVipUpdate().subscribe((notify: INotifyVipUpdate) => {
      if (!this.userInfo)
        return;
      if (!this.userInfo.vipInfo) {
        this.userInfo.vipInfo = {
          accountId: this.userInfo.id,
          level: 0,
          space: 0,
          expireTime: 0,
        };
      }
      this.userInfo.vipInfo.level = notify.level;
      this.userInfo.vipInfo.expireTime = notify.expireTime;
    });

    this.server.notify<ClientNotifyHandler>().notifyPaymentSuccess().subscribe((notify: INotifyPaymentSuccess) => {
      this.message.success('支付成功');
      this.modal.closeAll();
    });
  }

  async reconnectLogin() {
    const res = await this.server.auth.reconnectLogin();
    this.setLogin(res.account, res.authorization.token, res.authorization.expireAt, res.vip, res.storage);
  }

  async onAppStartup() {
    // console.log('onAppStartup');
    // await this.fetchUserInfo();
  }

  get avatarUrl() {
    return this.userInfo?.avatar;
  }

  private setLogin(info: IUserInfo, token: string, expireAt: number, vipInfo?: AccountVIP, storageInfo?: IStorageInfo) {
    this.userInfo = info;
    if (vipInfo) {
      this.userInfo.vipInfo = vipInfo;
    }
    if (storageInfo) {
      this.userInfo.storageInfo = storageInfo;
    }
    this.token.setToken(token, expireAt);
    if (!this.logged.getValue())
      this.logged.next(true);
  }

  private setLogout() {
    this.disconnectLogout();
    localStorage.removeItem('auto-login');
  }

  private disconnectLogout() {
    this.userInfo = null;
    this.logged.next(false);
  }

  isOnline() {
    return this.logged.getValue();
  }

  async login(username: string, password: string) {
    return this.server.auth.login({
      username,
      password,
      type: AccountLoginType.Email,
    })
      .then((res) => {
        this.message.success('登录成功');
        this.setLogin(res.account, res.authorization.token, res.authorization.expireAt, res.vip, res.storage);
      })
      .catch((err) => {
        this.errorHandlingUtil.handleManualError(err, '登录失败');
        throw err;
      });
  }

  async logout() {
    if (!this.logged.getValue()) {
      return;
    }
    await this.server.auth.logout();
    this.setLogout();
  }

  autoLogin() {
    const autoLoginStorage = localStorage.getItem('auto-login');
    if (!autoLoginStorage)
      return;
    const autoLogin = JSON.parse(autoLoginStorage) as {username: string; password: string};
    this.login(autoLogin.username, autoLogin.password).catch(() => {
    });
  }

  async fetchUserInfo() {
    const result = await this.server.auth.info();
    this.userInfo = result.account;
    if (result.vip) {
      this.userInfo.vipInfo = result.vip;
    }
    if (result.storage) {
      this.userInfo.storageInfo = result.storage;
      this.storageUpdate.next(result.storage);
    }
    if (!this.logged.getValue()) {
      await this.reconnectLogin();
    }
    if (!this.logged.getValue())
      this.logged.next(true);
  }

  getStorageUsed(): number {
    if (this.userInfo?.storageInfo) {
      return this.userInfo.storageInfo.usedSpace;
    }
    return 0;
  }

  getStorageMax(): number {
    if (this.userInfo?.storageInfo) {
      return this.userInfo.storageInfo.totalSpace;
    }
    return 0;
  }

  isVip(): boolean {
    return !!(this.userInfo?.vipInfo && this.userInfo.vipInfo.level > 0 && this.userInfo.vipInfo.expireTime > UnixTime.now());
  }

  getVipExpireTime(): number {
    return (this.userInfo?.vipInfo?.expireTime || 0) * 1000;
  }
}

import {Injectable} from '@angular/core';
import {ServerService, ServerState} from './server/server.service';
import {TokenService} from './server/token.service';
import {AccountLoginType, AccountVIP, ClientNotifyHandler, UserErrorCode, INotifyStorageUpdate, INotifyVipUpdate, INotifyPaymentSuccess, VIPLevel} from './server/api';
import {BehaviorSubject} from 'rxjs';
import {interval, switchMap} from 'rxjs';
import {NzMessageService} from 'ng-zorro-antd/message';
import {NzModalService} from 'ng-zorro-antd/modal';
import {NodeTime, UnixTime, Utility} from '../library/utility';
import { BaseError } from '../library/error/BaseError';
import {Logger} from 'app/library/logger';
import {GameService} from './game.service';

export interface IStorageInfo {
  usedSpace: bigint;
  totalSpace: bigint;
}

export interface IAccountVIP extends Omit<AccountVIP, 'space'> {
  space: bigint;
}

export interface IUserInfo {
  id: number;
  nickname?: string;
  avatar?: string;
  vipInfo?: IAccountVIP;
  storageInfo?: IStorageInfo;
}


@Injectable({
  providedIn: 'root',
})
export class UserService {
  public logged: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public userInfo: IUserInfo | null = null;
  public storageUpdate: BehaviorSubject<IStorageInfo | null> = new BehaviorSubject<IStorageInfo | null>(null);

  constructor(
    private server: ServerService,
    private token: TokenService,
    private message: NzMessageService,
    private modal: NzModalService,
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
        this.userInfo.storageInfo.usedSpace = BigInt(notify.usedSpace);
        this.userInfo.storageInfo.totalSpace = BigInt(notify.totalSpace);
      }
      this.storageUpdate.next(this.userInfo.storageInfo || null);
    });

    this.server.notify<ClientNotifyHandler>().notifyVipUpdate().subscribe((notify: INotifyVipUpdate) => {
      if (!this.userInfo)
        return;
      if (!this.userInfo.vipInfo) {
        this.userInfo.vipInfo = {
          accountId: this.userInfo.id,
          level: 0,
          space: 0n,
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

    interval(NodeTime.minute(2)).subscribe(() => {
      if (this.logged.getValue()) {
        this.fetchUserInfo().catch(err => {
          if (err instanceof BaseError) {
            if (err.code === UserErrorCode.ERR_NOT_LOGIN) {
              this.setLogout();
            }
          }
        });
      }
    });
  }

  async reconnectLogin() {
    const res = await this.server.auth.reconnectLogin();
    this.setLogin(res.account, res.authorization.token, res.authorization.expireAt, res.vip, {
      usedSpace: BigInt(res.storage.usedSpace),
      totalSpace: BigInt(res.storage.totalSpace),
    });
  }

  get avatarUrl() {
    return this.userInfo?.avatar;
  }

  private setLogin(info: IUserInfo, token: string, expireAt: number, vipInfo?: AccountVIP, storageInfo?: IStorageInfo) {
    Logger.setAccountId(info.id);
    this.userInfo = info;
    if (vipInfo) {
      this.userInfo.vipInfo = {
        ...vipInfo,
        space: BigInt(vipInfo.space),
      };
    }
    if (storageInfo) {
      this.userInfo.storageInfo = storageInfo;
    }
    this.token.setToken(token, expireAt);
    if (!this.logged.getValue()) {
      this.logged.next(true);
    }
  }

  private setLogout() {
    this.disconnectLogout();
    localStorage.removeItem('auto-login');
    Logger.setAccountId(undefined);
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
      password: Utility.passwordHash(password),
      type: AccountLoginType.Email,
    })
      .then((res) => {
        this.message.success('登录成功');
        this.setLogin(res.account, res.authorization.token, res.authorization.expireAt, res.vip, {
          usedSpace: BigInt(res.storage.usedSpace),
          totalSpace: BigInt(res.storage.totalSpace),
        });
      })
      .catch((err) => {
        // this.errorHandlingUtil.handleManualError(err, '登录失败');
        throw err;
      });
  }

  async logout() {
    if (!this.logged.getValue()) {
      return;
    }
    await this.server.auth.logout().catch((err) => {
      if (err instanceof BaseError) {
        if (err.code === UserErrorCode.ERR_NOT_LOGIN)
          return;
      }
      throw err;
    });
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
    if (!this.userInfo) {
      this.userInfo = result.account;
    } else {
      this.userInfo.nickname = result.account.nickname;
      if (!this.userInfo.avatar || !result.account.avatar) {
        this.userInfo.avatar = result.account.avatar;
      } else {
        const origin = new URL(this.userInfo.avatar);
        const response = new URL(result.account.avatar);

        if (origin.pathname !== response.pathname) {
          this.userInfo.avatar = result.account.avatar;
        }
      }
    }
    if (result.vip) {
      this.userInfo.vipInfo = {
        ...result.vip,
        space: BigInt(result.vip.space)
      };
    }
    if (result.storage) {
      this.userInfo.storageInfo = {
        usedSpace: BigInt(result.storage.usedSpace),
        totalSpace: BigInt(result.storage.totalSpace),
      };
      this.storageUpdate.next(this.userInfo.storageInfo);
    }
    if (!this.logged.getValue()) {
      await this.reconnectLogin();
    }
    if (!this.logged.getValue())
      this.logged.next(true);
  }

  getStorageUsed() {
    if (this.userInfo?.storageInfo) {
      return this.userInfo.storageInfo.usedSpace;
    }
    return 0n;
  }

  getStorageMax() {
    if (this.userInfo?.storageInfo) {
      return this.userInfo.storageInfo.totalSpace;
    }
    return 0n;
  }

  isVip() {
    return !!(this.userInfo?.vipInfo && this.userInfo.vipInfo.level > 0 && this.userInfo.vipInfo.expireTime > UnixTime.now());
  }

  getVipLevel() {
    return this.getVipExpireTime() > UnixTime.now() ? this.userInfo!.vipInfo!.level : VIPLevel.None;
  }

  getVipExpireTime() {
    return (this.userInfo?.vipInfo?.expireTime || 0) * 1000;
  }
}

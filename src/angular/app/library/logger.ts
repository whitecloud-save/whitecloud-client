import SlsTracker from '@aliyun-sls/web-track-browser'
import {mainAPI} from './api/main-api';
import {UnixTime} from './utility';
import moment from 'moment';
import {v4} from 'uuid';

export class Logger {
  static async init() {
    this.version_ = await mainAPI.app.getVersion();
    const deviceId = localStorage.getItem('app:device');
    this.deviceId_ = deviceId || v4();
    localStorage.setItem('app:device', this.deviceId_);

    const opts = {
      host: 'cn-shanghai.log.aliyuncs.com', // 所在地域的服务入口。例如cn-hangzhou.log.aliyuncs.com
      project: 'whitecloud', // Project名称。
      logstore: 'client', // Logstore名称。
      time: 10, // 发送日志的时间间隔，默认是10秒。
      count: 10, // 发送日志的数量大小，默认是10条。
      topic: 'electron-angular',// 自定义日志主题。
    };

    this.tracker_ = new SlsTracker(opts)  // 创建SlsTracker对象
  }

  static setAccountId(value?: number) {
    this.accountId_ = value;
  }

  static addLog(event: string, content: any) {
    if (!this.tracker_)
      return;

    this.tracker_.send({
      event,
      version: this.version_,
      content,
      accountId: this.accountId_,
      time: moment().format('YYYY-MM-DD HH:mm:ss'),
      timestamp: UnixTime.now(),
      device: this.deviceId_,
    });
  }

  private static tracker_: SlsTracker;
  private static version_: string;
  private static accountId_?: number;
  private static deviceId_?: string;
}

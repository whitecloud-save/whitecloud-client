import {Injectable} from '@angular/core';
import {NzNotificationService} from 'ng-zorro-antd/notification';
import {BaseError} from '../library/error/BaseError';

@Injectable({
  providedIn: 'root',
})
export class ErrorHandlingUtil {
  private lastErrorNotificationTime = 0;
  private readonly NOTIFICATION_DEBOUNCE_MS = 5000;

  constructor(private notification: NzNotificationService) {}

  handleManualError(err: unknown, title: string = '操作失败') {
    let message = '未知错误';

    if (err instanceof BaseError) {
      message = err.showMessage;
    } else if (err instanceof Error) {
      message = err.message;
    } else if (typeof err === 'string') {
      message = err;
    }

    this.notification.create('error', title, message, {
      nzDuration: 0,
    });
  }

  async handleAutoError(err: unknown, title: string = '自动操作失败') {
    let message = '未知错误';

    if (err instanceof BaseError) {
      message = err.showMessage;
    } else if (err instanceof Error) {
      message = err.message;
    } else if (typeof err === 'string') {
      message = err;
    }

    this.notification.create('error', title, message, {
      nzDuration: 0,
    });

    await this.showSystemNotification(title, message);
  }

  private async showSystemNotification(title: string, message: string): Promise<void> {
    const now = Date.now();
    if (now - this.lastErrorNotificationTime < this.NOTIFICATION_DEBOUNCE_MS) {
      return;
    }
    this.lastErrorNotificationTime = now;

    try {
      if (typeof window !== 'undefined' && (window as any).electronAPI) {
        await (window as any).electronAPI.invoke('show-system-notification', {
          title,
          message,
        });
      }
    } catch (error) {
      console.error('Failed to show system notification:', error);
    }
  }
}

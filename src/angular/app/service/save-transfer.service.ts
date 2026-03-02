import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { NzNotificationService } from 'ng-zorro-antd/notification';

export interface SaveTransferState {
  isTransferring: boolean;
  type: 'upload' | 'download' | null;
  saveId: string | null;
  gameId: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class SaveTransferService {
  private state_: BehaviorSubject<SaveTransferState> = new BehaviorSubject<SaveTransferState>({
    isTransferring: false,
    type: null,
    saveId: null,
    gameId: null,
  });

  private notificationId: string | null = null;

  constructor(private notification: NzNotificationService) {}

  get state$(): Observable<SaveTransferState> {
    return this.state_.asObservable();
  }

  get currentState(): SaveTransferState {
    return this.state_.getValue();
  }

  get isTransferring(): boolean {
    return this.state_.getValue().isTransferring;
  }

  startTransfer(type: 'upload' | 'download', saveId: string, gameId: string, saveRemark?: string): void {
    this.state_.next({
      isTransferring: true,
      type,
      saveId,
      gameId,
    });
  }

  endTransfer(): void {
    if (this.notificationId) {
      this.notification.remove(this.notificationId);
      this.notificationId = null;
    }
    this.state_.next({
      isTransferring: false,
      type: null,
      saveId: null,
      gameId: null,
    });
  }

  showProgressNotification(title: string, type: 'upload' | 'download'): void {
    const content = `正在${type === 'upload' ? '上传' : '下载'}存档...`;

    this.notificationId = this.notification.info(title, content, {
      nzDuration: 0,
      nzKey: `save-transfer-${type}`,
    }).messageId;
  }
}

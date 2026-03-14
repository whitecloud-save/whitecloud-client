import { Injectable, TemplateRef } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { NzNotificationRef, NzNotificationService } from 'ng-zorro-antd/notification';
import {BaseError} from 'app/library/error/BaseError';
import {ErrorCode} from 'app/library/error/ErrorCode';

export interface SaveTransferState {
  isTransferring: boolean;
  type: 'upload' | 'download' | null;
  saveId: string | null;
  gameId: string | null;
}

export enum SaveProgressType {
  Upload,
  Download
}

const SaveProgressTypeString = {
  [SaveProgressType.Download]: '下载',
  [SaveProgressType.Upload]: '上传',
}

export class SaveProgressNotification {
  constructor(
    title: string,
    icon: string | undefined,
    type: SaveProgressType,
    content: TemplateRef<{}>,
    service: NzNotificationService,
  ) {
    this.service_ = service;
    this.progress_ = new BehaviorSubject(0);
    this.content_ = content;

    this.title_ = title;
    this.icon_ = icon;
    this.type_ = type;
  }

  start() {
    this.timer_ = setTimeout(() => {
      this.ref_ = this.createNotify();
    }, 1000);
  }

  update(percent: number) {
    this.progress_.next(percent);
  }

  show() {
    this.ref_ = this.createNotify();
  }

  close() {
    if (this.timer_)
      clearTimeout(this.timer_);

    if (this.ref_)
      this.service_.remove(this.ref_.messageId);

    this._afterClosed.next();
    this._afterClosed.complete();
  }

  afterClosed(): Observable<void> {
    return this._afterClosed.asObservable();
  }

  private createNotify() {
    return this.service_.template(this.content_, {
      nzDuration: 0,
      nzData: {
        progress$: this.progress_,
        title: this.title_,
        type: SaveProgressTypeString[this.type_],
        icon: this.icon_,
      },
      nzStyle: {
        padding: '0'
      },
    });
  }

  private ref_?: NzNotificationRef;
  private content_: TemplateRef<{}>;
  private service_: NzNotificationService;
  private timer_?: NodeJS.Timeout;
  private progress_: Subject<number>;
  private title_: string;
  private icon_?: string;
  private type_: SaveProgressType;

  private readonly _afterClosed = new Subject<void>();
}

@Injectable({
  providedIn: 'root',
})
export class SaveTransferService {
  constructor(
    private notification: NzNotificationService
  ) {
    this.transferRef_ = new BehaviorSubject(0);
    this.notifications_ = [];
  }

  setContentTemplate(template: TemplateRef<{}>) {
    this.contentTemplate_ = template;
  }

  startSaveTransfer(title: string, icon: string | undefined, type: SaveProgressType) {
    if (!this.contentTemplate_)
      throw new BaseError(ErrorCode.ERR_CONTENT_TEMPLATE_NOT_FOUND, 'should call SaveTransferService.setContentTemplate first');

    const notification = new SaveProgressNotification(title, icon, type, this.contentTemplate_, this.notification);
    const ref = this.transferRef_.value;
    this.transferRef_.next(ref + 1);
    this.notifications_.push(notification);

    notification.afterClosed().subscribe(() => {
      this.notifications_.splice(this.notifications_.indexOf(notification), 1);
      const ref = this.transferRef_.value;
      this.transferRef_.next(ref - 1);
    });

    return notification;
  }

  transferRefObservable() {
    return this.transferRef_.asObservable();
  }

  showAll() {
    for(const notification of this.notifications_) {
      notification.show();
    }
  }

  private transferRef_: BehaviorSubject<number>;
  private notifications_: SaveProgressNotification[];
  private contentTemplate_?: TemplateRef<{}>;
}

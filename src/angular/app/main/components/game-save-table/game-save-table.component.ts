import {AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild} from '@angular/core';
import {Save, SaveState} from '../../../entity/save';
import {Game} from '../../../entity/game';
import {Utility} from '../../../library/utility';
import {Subject, Subscription, debounceTime, takeUntil} from 'rxjs';
import {NzTableComponent} from 'ng-zorro-antd/table';
import {IconService} from '../../../service/icon.service';
import {NzModalService} from 'ng-zorro-antd/modal';
import {NzMessageService} from 'ng-zorro-antd/message';
import {DialogService} from '../../../service/dialog.service';
import {RemoteSave} from '../../../entity/remote-save';
import {GameService} from '../../../service/game.service';
import {UserService} from '../../../service/user.service';
import {ErrorHandlingUtil} from '../../../service/error-handling-util';
import {SaveTransferService} from '../../../service/save-transfer.service';

@Component({
  selector: 'app-game-save-table',
  templateUrl: './game-save-table.component.html',
  styleUrl: './game-save-table.component.scss',
})
export class GameSaveTableComponent implements AfterViewInit, OnDestroy {
  @Input()
  list!: (Save | RemoteSave)[];

  @Input()
  game!: Game;

  @ViewChild('container')
  container!: ElementRef;

  @ViewChild('dataTable')
  table!: NzTableComponent<any>;

  pageSize = 0;
  loading = true;
  isTransferring = false;
  private resizeSub_?: Subscription;
  private destroy$ = new Subject<void>();

  constructor(
    public iconService: IconService,
    public userService: UserService,
    private modal: NzModalService,
    private message: NzMessageService,
    private dialogService: DialogService,
    private gameService: GameService,
    private errorHandlingUtil: ErrorHandlingUtil,
    private saveTransferService: SaveTransferService,
  ) {}

  ngAfterViewInit() {
    this.resizeSub_ = Utility.resizeObservable(this.container.nativeElement).pipe(
      debounceTime(100),
    ).subscribe(() => {
      this.loading = false;
      this.pageSize = Math.floor((this.container.nativeElement.offsetHeight - 115) / 56);
    });

    this.saveTransferService.state$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.isTransferring = state.isTransferring;
      });
  }

  ngOnDestroy(): void {
    this.resizeSub_?.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }

  isCurrentSave(save: Save | RemoteSave): boolean {
    if (!(save instanceof Save)) {
      return false;
    }
    const currentSave = this.game.getCurrentSave();
    return currentSave !== null && save.id === currentSave.id;
  }

  isLocal(save: Save | RemoteSave): save is Save {
    return save instanceof Save;
  }

  isStateCurrent(save: Save | RemoteSave): boolean {
    if (!(save instanceof Save)) {
      return false;
    }
    return save.state === SaveState.Current;
  }

  starSave(save: Save) {
    save.star()
      .then(() => save.save(true))
      .catch((err) => {
        this.errorHandlingUtil.handleManualError(err, '收藏存档失败');
      });
  }

  rollbackSave(save: Save) {
    this.modal.confirm({
      nzTitle: '确认回滚存档？',
      nzContent: '将会清空该游戏的存档目录，并使用该存档备份进行覆盖，该操作不可撤销，请确认当前存档目录已经备份',
      nzOkText: '回滚',
      nzOnOk: () => {
        save.rollback()
          .then(() => {
            this.message.success('回滚成功');
          })
          .catch((err) => {
            this.errorHandlingUtil.handleManualError(err, '回滚存档失败');
          });
      },
    });
  }

  deleteSave(save: Save) {
    if (save.ossPath) {
      this.deleteRemoteSave(save);
    } else {
      this.modal.confirm({
        nzTitle: '确认删除存档？',
        nzContent: '删除存档后无法恢复',
        nzOkText: '删除',
        nzOkDanger: true,
        nzOnOk: () => {
          save.delete()
            .then(() => {
              this.message.success('删除成功');
            })
            .catch((err) => {
              this.errorHandlingUtil.handleManualError(err, '删除存档失败');
            });
        },
      });
    }
  }

  uploadSave(save: Save) {
    save.game.uploadSave(save);
  }

  downloadSave(save: RemoteSave | Save) {
    this.gameService.downloadSave(save);
  }

  deleteRemoteSave(save: RemoteSave | Save) {
    this.modal.confirm({
      nzTitle: '确认删除云端存档？',
      nzContent: '删除云端存档后将会同步到所有登录该账号的客户端并且无法恢复',
      nzOkText: '删除',
      nzOkDanger: true,
      nzOnOk: () => {
        this.gameService.deleteRemoteSave(save)
          .then(() => {
            this.message.success('删除成功');
          })
          .catch((err) => {
            this.errorHandlingUtil.handleManualError(err, '删除云端存档失败');
          });
      },
    });
  }

  async editSave(save: Save) {
    this.dialogService.openSaveRemarkEditorDialog(save);
  }

  saveSortFn(a: Save, b: Save) {
    return a.createTime - b.createTime;
  }
}

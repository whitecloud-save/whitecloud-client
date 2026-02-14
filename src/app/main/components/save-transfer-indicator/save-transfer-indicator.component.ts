import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { SaveTransferService } from '../../../service/save-transfer.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { IconService } from '../../../service/icon.service';
import { IconDefinition } from '@fortawesome/fontawesome-common-types';
import {GameService} from '../../../service/game.service';

@Component({
  selector: 'app-save-transfer-indicator',
  templateUrl: './save-transfer-indicator.component.html',
  styleUrl: './save-transfer-indicator.component.scss',
})
export class SaveTransferIndicatorComponent implements OnInit, OnDestroy {
  isTransferring = false;
  transferType: 'upload' | 'download' | null = null;
  gameName: string | null = null;


  private destroy$ = new Subject<void>();

  constructor(
    private saveTransferService: SaveTransferService,
    private gameService: GameService,
    public iconService: IconService,
  ) {}

  ngOnInit(): void {
    this.saveTransferService.state$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        console.log(state);
        this.isTransferring = state.isTransferring;
        this.transferType = state.type;
        if (state.gameId) {
          const game = this.gameService.getGame(state.gameId);
          if (game)
            this.gameName = game.name;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get icon(): IconDefinition {
    if (this.transferType === 'upload') {
      return this.iconService.solid.faCloudArrowUp;
    }
    return this.iconService.solid.faCloudArrowDown;
  }

  get tooltipContent(): string {
    const typeText = this.transferType === 'upload' ? '上传' : '下载';
    if (this.gameName) {
      return `正在${typeText}存档: ${this.gameName}`;
    }
    return `正在${typeText}存档...`;
  }

  showDetails(): void {
    this.saveTransferService.showProgressNotification(this.gameName || '', this.transferType || 'upload');
    // const typeText = this.transferType === 'upload' ? '上传' : '下载';
    // const title = `正在${typeText}存档`;
    // let content = '';

    // if (this.gameName) {
    //   content = `存档名称: ${this.gameName}`;
    // } else {
    //   content = '正在处理中...';
    // }

    // this.notification.info(title, content, {
    //   nzDuration: 5000,
    // });
  }
}

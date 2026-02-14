import {Component, Input, OnChanges, SimpleChanges, OnDestroy} from '@angular/core';
import {GameActivityService, GameActivity, UploadFailedActivity} from '../../../service/game-activity.service';
import {ChangeDetectorRef} from '@angular/core';
import {IconService} from '../../../service/icon.service';
import {GamePageService} from '../../pages/game/game-page.service';
import {Subscription} from 'rxjs';
import {UserService} from '../../../service/user.service';
import {UserErrorCode} from '../../../service/server/api';
import {DialogService} from '../../../service/dialog.service';

@Component({
  selector: 'app-game-activity-timeline',
  templateUrl: './game-activity-timeline.component.html',
  styleUrl: './game-activity-timeline.component.scss',
})
export class GameActivityTimelineComponent implements OnChanges, OnDestroy {
  @Input() gameId!: string;
  activities: GameActivity[] = [];
  displayedActivities: GameActivity[] = [];
  readonly PAGE_SIZE = 5;

  private activityUpdateSub?: Subscription;

  constructor(
    private gameActivityService: GameActivityService,
    private cdr: ChangeDetectorRef,
    public iconService: IconService,
    private gamePageService: GamePageService,
    public userService: UserService,
    private dialogService: DialogService,
  ) {}

  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    if (changes['gameId'] && this.gameId) {
      await this.loadActivities();
      this.subscribeToActivityUpdates();
    }
  }

  ngOnDestroy(): void {
    if (this.activityUpdateSub) {
      this.activityUpdateSub.unsubscribe();
    }
  }

  private subscribeToActivityUpdates(): void {
    if (this.activityUpdateSub) {
      this.activityUpdateSub.unsubscribe();
    }

    this.gamePageService.game.subscribe((game) => {
      if (game) {
        this.activityUpdateSub = game.activityUpdate$.subscribe((updatedGameId) => {
          if (updatedGameId === this.gameId) {
            this.loadActivities();
          }
        });
      }
    });
  }

  async refresh(): Promise<void> {
    await this.loadActivities();
  }

  private async loadActivities(): Promise<void> {
    try {
      this.activities = await this.gameActivityService.getCombinedActivities(this.gameId);
      this.displayedActivities = this.activities.slice(0, this.PAGE_SIZE);
      this.cdr.detectChanges();
    } catch (error) {
      this.activities = [];
      this.displayedActivities = [];
      this.cdr.detectChanges();
    }
  }

  loadMore(): void {
    const currentLength = this.displayedActivities.length;
    const newActivities = this.activities.slice(currentLength, currentLength + this.PAGE_SIZE);
    this.displayedActivities = [...this.displayedActivities, ...newActivities];
    this.cdr.detectChanges();
  }

  get canLoadMore(): boolean {
    return this.displayedActivities.length < this.activities.length;
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }

  shouldShowUpgrade(activity: GameActivity) {
    if (!activity.data)
      return false;
    const decoded = JSON.parse(activity.data);
    if (decoded.reason && [UserErrorCode.ERR_SPACE_NOT_ENOUGH, UserErrorCode.ERR_FILE_SPACE_LIMIT].includes(decoded.reason)) {
      return true;
    }
    return false;
    // return (activity as UploadFailedActivity).reason === UserErrorCode.ERR_SPACE_NOT_ENOUGH || (activity as UploadFailedActivity).reason === UserErrorCode.ERR_FILE_SPACE_LIMIT
  }

  openVipDialog() {
    this.dialogService.openVipBenefitDialog();
  }
}

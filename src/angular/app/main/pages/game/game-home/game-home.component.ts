import {Component, OnDestroy, ViewChild} from '@angular/core';
import {GamePageService} from '../game-page.service';
import {IconService} from '../../../../service/icon.service';
import {Game, GameState} from '../../../../entity/game';
import {Subscription} from 'rxjs';
import {GameActivityTimelineComponent} from '../../../components/game-activity-timeline/game-activity-timeline.component';
import {NzModalService} from 'ng-zorro-antd/modal';
import {UserService} from '../../../../service/user.service';

@Component({
  selector: 'app-game-home',
  templateUrl: './game-home.component.html',
  styleUrl: './game-home.component.scss',
})
export class GameHomeComponent implements OnDestroy {
  GameState = GameState;
  game!: Game;
  previousState!: GameState;

  @ViewChild(GameActivityTimelineComponent)
  activityTimeline!: GameActivityTimelineComponent;

  constructor(
    public userService: UserService,
    public gamePageService: GamePageService,
    public iconService: IconService,
    private modal: NzModalService,
  ) {
    this.gameSub = this.gamePageService.game.subscribe((game) => {
      if (game) {
        this.game = game;
        this.watchGameState();
      }
    });
  }

  ngOnDestroy(): void {
    this.gameSub.unsubscribe();
    if (this.stateSub) {
      this.stateSub.unsubscribe();
    }
  }

  get availableSaveCount(): number {
    return this.game?.saves.filter(s => s.available).length ?? 0;
  }

  backupSave() {
    this.game.zipSave(true);
  }

  private watchGameState() {
    if (this.stateSub) {
      this.stateSub.unsubscribe();
    }

    this.stateSub = this.game.state.subscribe(async (state) => {
      if (this.previousState === GameState.Running && state === GameState.Checked) {
        await this.activityTimeline.refresh();
      }
      this.previousState = state;
    });
  }

  private gameSub: Subscription;
  private stateSub?: Subscription;
}


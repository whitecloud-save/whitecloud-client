import {Component, OnDestroy, OnInit} from '@angular/core';
import {GamePageService} from './game-page.service';
import {MainNavService} from '../../../service/main-nav.service';
import {HeaderType, MainService} from '../../main.service';
import {Subscription} from 'rxjs';
import {Game, GameState} from '../../../entity/game';
import {IconService} from '../../../service/icon.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrl: './game.component.scss',
  providers: [GamePageService],
})
export class GameComponent implements OnInit, OnDestroy {

  private gameSub_?: Subscription;
  GameState = GameState;
  private game_?: Game;

  constructor(
    public gamePageService: GamePageService,
    public mainNavService: MainNavService,
    public mainService: MainService,
    public iconService: IconService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    setTimeout(() => {
      this.mainNavService.gameNavOpen = true;
    });
    this.gamePageService.game.subscribe((game) => {
      if (game) {
        this.game_ = game;
        this.mainService.setHeader({
          type: HeaderType.GameDetail,
          data: game,
        });
      }
    });
  }

  ngOnDestroy(): void {
    if (this.gameSub_)
      this.gameSub_.unsubscribe();
  }

  navigateToSetting() {
    if (!this.game_)
      return;

    if (this.game_.useCustomSaveBackupLimit) {
      this.router.navigate(['main', 'game', this.game_.id]);
    } else {
      this.router.navigate(['main', 'setting']);
    }

  }
}

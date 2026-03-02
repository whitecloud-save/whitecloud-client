import {Component, OnDestroy} from '@angular/core';
import {Game} from '../../../../entity/game';
import {GamePageService} from '../game-page.service';
import {IconService} from '../../../../service/icon.service';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-game-save',
  templateUrl: './game-save.component.html',
  styleUrl: './game-save.component.scss',
})
export class GameSaveComponent implements OnDestroy {
  game!: Game;
  onlyShowStared = false;

  constructor(
    public gamePageService: GamePageService,
    public iconService: IconService,
  ) {
    this.gameSub = this.gamePageService.game.subscribe((game) => {
      if (game)
        this.game = game;
    });
  }

  ngOnDestroy(): void {
    this.gameSub.unsubscribe();
  }

  private gameSub: Subscription;
}

import {Component} from '@angular/core';
import {GameService} from '../../../service/game.service';
import {HeaderType, MainService} from '../../main.service';
import {Game} from '../../../entity/game';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  movingGame: Game | null = null;
  enteredGame: Game | null = null;

  constructor(
    public gameService: GameService,
    public mainService: MainService,
  ) {
    mainService.setHeader({
      type: HeaderType.Home,
    });
  }

  drop(event: any) {

    this.gameService.swapGameOrder(this.enteredGame!, this.movingGame!);
    // this.items[event.previousContainer.data.index] = event.container.data.item;
    // this.items[event.container.data.index] = event.previousContainer.data.item;
    // console.log(event);
    this.enteredGame = null;
    this.movingGame = null;
  }

  enter(event: any, game: Game) {
    this.enteredGame = game;
  }

  dragStarted(event: any, game: Game) {
    // console.log(event);
    this.movingGame = game;
  }

  isEmpty() {
    return !this.gameService.games.getValue().length && !this.gameService.remoteGames.getValue().length;
  }
}

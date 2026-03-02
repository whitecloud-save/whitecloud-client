import {Component, Input} from '@angular/core';
import {GameState} from '../../../entity/game';

@Component({
  selector: 'app-game-state',
  templateUrl: './game-state.component.html',
  styleUrl: './game-state.component.scss',
})
export class GameStateComponent {
  GameState = GameState;

  @Input()
  state!: GameState | null;

  @Input()
  isNet: boolean | null = false;
}

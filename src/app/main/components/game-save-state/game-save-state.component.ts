import {Component, Input} from '@angular/core';
import {SaveState} from '../../../entity/save';

@Component({
  selector: 'app-game-save-state',
  templateUrl: './game-save-state.component.html',
  styleUrl: './game-save-state.component.scss',
})
export class GameSaveStateComponent {
  SaveState = SaveState;

  @Input()
  state!: SaveState;
}

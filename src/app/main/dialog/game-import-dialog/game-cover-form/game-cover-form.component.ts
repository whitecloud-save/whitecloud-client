import {Component} from '@angular/core';
import {GameImportService} from '../game-import.service';

@Component({
  selector: 'app-game-cover-form',
  templateUrl: './game-cover-form.component.html',
  styleUrl: './game-cover-form.component.scss',
})
export class GameCoverFormComponent {

  constructor(
    public gameImportService: GameImportService,
  ) {}
}

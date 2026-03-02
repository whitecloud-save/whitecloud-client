import {Component} from '@angular/core';
import {GameImportService} from '../game-import.service';

@Component({
  selector: 'app-game-exe-selector',
  templateUrl: './game-exe-selector.component.html',
  styleUrl: './game-exe-selector.component.scss',
})
export class GameExeSelectorComponent {
  constructor(
    public gameImportService: GameImportService,
  ) {}
}

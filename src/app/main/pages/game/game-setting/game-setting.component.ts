import {Component} from '@angular/core';
import {UntypedFormGroup} from '@angular/forms';
import {GamePageService} from '../game-page.service';

@Component({
  selector: 'app-game-setting',
  templateUrl: './game-setting.component.html',
  styleUrl: './game-setting.component.scss',
})
export class GameSettingComponent {
  basicForm!: UntypedFormGroup;
  exeSelections: string[];
  preGamePath: string;

  constructor(
    public gamePageService: GamePageService,
  ) {
    this.exeSelections = [];
    this.preGamePath = '';
  }
}

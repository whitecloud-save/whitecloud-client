import {Component, Inject} from '@angular/core';
import {FormControl} from '@angular/forms';
import {debounceTime} from 'rxjs';
import {GuideGameId} from '../../main';
import {GameGuideDB} from '../../../shared/database/game-guide';
import {workerAPI} from 'app/library/api/worker-api';
import {mainAPI} from 'app/library/api/main-api';

@Component({
  selector: 'app-root',
  templateUrl: './game-guide.component.html',
  styleUrl: './game-guide.component.scss',
})
export class GameGuideComponent {
  guide!: GameGuideDB;
  contextControl = new FormControl();
  topWindowControl = new FormControl(false);

  constructor(
    @Inject(GuideGameId) gameId: string,
  ) {
    this.load(gameId);
    this.contextControl.valueChanges.pipe(
      debounceTime(500),
    ).subscribe((value) => {
      this.guide.content = value;
      workerAPI.db.saveGameGuide(this.guide);
    });

    this.topWindowControl.valueChanges.pipe(
      debounceTime(500),
    ).subscribe(async (value) => {
      if (value === null)
        return;
      this.guide.alwaysTop = value;
      mainAPI.window.setWindowTop(value);
    });
  }

  async load(gameId: string) {
    const id = gameId;
    let guide = await workerAPI.db.findGameGuide(id);
    if (!guide) {
      guide = new GameGuideDB({
        gameId: id,
        content: '',
        alwaysTop: false,
      });
    }

    this.guide = guide;
    this.contextControl.setValue(this.guide.content);
    this.topWindowControl.setValue(this.guide.alwaysTop);
    mainAPI.window.setWindowTop(this.guide.alwaysTop);
  }
}

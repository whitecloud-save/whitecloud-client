import {Component, Inject} from '@angular/core';
import {AppDataSource} from '../library/database';
import {GameGuideDB} from '../database/game-guide';
import {FormControl} from '@angular/forms';
import {debounceTime} from 'rxjs';
import {GuideGameId} from '../../main';
import {ipcRenderer} from 'electron';

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
      AppDataSource.manager.save(this.guide);
    });

    this.topWindowControl.valueChanges.pipe(
      debounceTime(500),
    ).subscribe(async (value) => {
      if (value === null)
        return;
      this.guide.alwaysTop = value;
      AppDataSource.manager.save(this.guide);
      await ipcRenderer.invoke('setTop', value);
    });
  }

  async load(gameId: string) {
    const id = gameId;
    let guide = await AppDataSource.manager.findOne(GameGuideDB, {
      where: {
        gameId: id,
      },
    });

    if (!guide) {
      const guideRepo = AppDataSource.getRepository(GameGuideDB);
      guide = guideRepo.create({
        gameId: id,
        content: '',
        alwaysTop: false,
      });
    }

    this.guide = guide;
    this.contextControl.setValue(this.guide.content);
    this.topWindowControl.setValue(this.guide.alwaysTop);
    // await ipcRenderer.invoke('setTop', this.guide.alwaysTop);
  }
}

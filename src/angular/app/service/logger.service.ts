import {Injectable} from '@angular/core';
import {UserService} from './user.service';
import {GameService} from './game.service';
import {Logger} from 'app/library/logger';
import moment from 'moment';

@Injectable({
  providedIn: 'root',
})
export class LoggerService {
  constructor(
    private userService: UserService,
    private gameService: GameService,
  ) {

  }

  init() {
    this.userService.logged.subscribe((logged) => {
      if (logged) {
        Logger.addLog('account-login', {
          vip: this.userService.getVipLevel(),
          vipExpireTime: moment(this.userService.getVipExpireTime()).format('YYYY-MM-DD HH:mm:ss')
        });
      } else {
        Logger.addLog('account-logout', {});
      }
    });

    this.gameService.games.subscribe((list) => {
      Logger.addLog('game-list-modified', {game_count: list.length});
    });
  }
}

import {Injectable} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {catchError, map, of} from 'rxjs';
import {GameService} from '../../../service/game.service';
import {BaseError} from '../../../library/error/BaseError';
import {ErrorCode} from '../../../library/error/ErrorCode';

@Injectable({
  providedIn: null,
})
export class GamePageService {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private gameService: GameService,
  ) {}

  get game() {
    return this.route.params.pipe(
      map((params) => {
        const id = params['id'] as string;
        if (!id) {
          throw new BaseError(ErrorCode.ERR_GAME_NOT_FOUND);
        }
        const game = this.gameService.getGame(id);
        if (!game) {
          throw new BaseError(ErrorCode.ERR_GAME_NOT_FOUND);
        }
        return game;
      }),
      catchError((err: BaseError) => {
        switch(err.code) {
          case ErrorCode.ERR_GAME_NOT_FOUND:
            this.router.navigate(['/main/home']);
            break;
        }
        return of(null);
      })
    );
  }
}

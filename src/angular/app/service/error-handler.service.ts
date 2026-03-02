import {Injectable, ErrorHandler} from '@angular/core';
import {NzMessageService} from 'ng-zorro-antd/message';
import {BaseError} from '../library/error/BaseError';

@Injectable({
  providedIn: 'root',
})
export class ErrorHandlerService implements ErrorHandler {

  constructor(
    private message: NzMessageService,
  ) {}

  public handle(err: Error) {

    // console.trace();
    console.log(err);
    if (err instanceof BaseError) {
      this.message.error(err.showMessage);
    } else {
      // this.message.error(err.message);
    }
  }

  public handleError(err: Error) {
    this.handle(err);
  }
}

import {BaseError} from './BaseError';

class TimeoutError extends BaseError {
  constructor(code: string) {
    super(code, 'ERR_TIMEOUT');
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

export {TimeoutError};

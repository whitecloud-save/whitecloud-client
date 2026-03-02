import {BaseError} from './BaseError';

class ServerError extends BaseError {
  constructor(code: string) {
    super(code, 'ERR_SERVER');
    Object.setPrototypeOf(this, ServerError.prototype);
  }
}

export {ServerError};

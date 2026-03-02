import {BaseError} from './BaseError';

class NetError extends BaseError {
  constructor(message: string) {
    super('ERR_NET', message);
    Object.setPrototypeOf(this, NetError.prototype);
  }
}

export {NetError};

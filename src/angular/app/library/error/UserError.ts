import {BaseError} from './BaseError';

class UserError extends BaseError {
  constructor(code: string, message: string) {
    super(code, code);
    Object.setPrototypeOf(this, UserError.prototype);
  }
}

export {UserError};

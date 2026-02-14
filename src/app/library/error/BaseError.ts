import {ErrorString} from './ErrorString';

class BaseError extends Error {
  constructor(code: string, message?: string, args?: any) {
    super(message);
    this.code = code;
    this.message = message || '';
    this.args = args;
    Object.setPrototypeOf(this, BaseError.prototype);
  }

  get showMessage() {
    const errString = ErrorString[this.code];
    switch (typeof errString) {
      case 'string':
        return errString;
      case 'undefined':
        return this.code;
      case 'function':
        return errString(this.args);
      case 'number':
      case 'bigint':
      case 'boolean':
      case 'symbol':
      case 'object':
        return this.code;
    }
  }

  public code: string;
  public args: any;
}

export {BaseError};

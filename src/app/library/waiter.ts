import {TimeoutError} from './error/TimeoutError';

class Waiter<T> {
  constructor() {
    this.pool_ = new Map();
    this.id_ = 0;
  }

  wait(ttlMs?: number) {
    if (this.id_ >= Number.MAX_SAFE_INTEGER) {
      this.id_ = 0;
    }
    const id = ++this.id_;
    let timer: NodeJS.Timeout;
    if (ttlMs) {
      timer = setTimeout(() => {
        if (this.pool_.has(id)) {
          const info = this.pool_.get(id);
          if (!info)
            return;
          info.reject(new TimeoutError('ERR_TIMEOUT'));
        }
      }, ttlMs);
    }
    return {
      id,
      promise: new Promise<T>((resolve, reject) => {
        this.pool_.set(id, {resolve, reject, timer});
      }),
    };
  }

  emit(id: number, result: T) {
    if (this.pool_.has(id)) {
      const info = this.pool_.get(id);
      if (!info)
        return;
      if (info.timer)
        clearTimeout(info.timer);
      this.pool_.delete(id);
      info.resolve(result);
    }
    if (!this.pool_.size && this.allStoppedCallback_) {
      if (this.stopTimeoutTimer_) {
        clearTimeout(this.stopTimeoutTimer_);
      }
      this.allStoppedCallback_();
    }
  }

  emitError(id: number, error: Error) {
    if (this.pool_.has(id)) {
      const info = this.pool_.get(id);
      if (!info)
        return;
      clearTimeout(info.timer);
      this.pool_.delete(id);
      info.reject(error);
    }
  }

  clear() {
    for (const [_, info] of this.pool_.entries()) {
      if (info.timer) {
        clearTimeout(info.timer);
      }
    }
    this.pool_.clear();
  }

  get(id: number) {
    return this.pool_.get(id);
  }

  remove(id: number) {
    const info = this.pool_.get(id);
    if (info && info.timer) {
      clearTimeout(info.timer);
    }
    return this.pool_.delete(id);
  }

  getAll() {
    return this.pool_.entries();
  }

  async waitForAll(ttlMS?: number) {
    if (!this.pool_.size)
      return;

    const promise = new Promise<void>((resolve) => {
      this.allStoppedCallback_ = resolve;
    });
    if (ttlMS) {
      this.stopTimeoutTimer_ = setTimeout(() => {
        if (this.allStoppedCallback_)
          this.allStoppedCallback_();
      }, ttlMS);
    }
    return promise;
  }

  private pool_: Map<number, {resolve: (value: T) => void; reject: (error: Error) => void; timer: NodeJS.Timeout}>;
  private allStoppedCallback_?: () => void;
  private stopTimeoutTimer_?: NodeJS.Timeout;
  private id_: number;
}

export {Waiter};

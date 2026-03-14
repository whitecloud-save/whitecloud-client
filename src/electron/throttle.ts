export class Throttle<T extends (...args: any[]) => any> {
  constructor(fun: T, time: number) {
    this.fun_ = fun;
    this.time_ = time;
  }

  call(...args: Parameters<T>) {
    if (!this.timer_) {
      this.timer_ = setTimeout(() => {
        if (this.lastArgs_)
          this.fun_(...this.lastArgs_);

        this.timer_ = undefined;
      }, this.time_);
    }

    this.lastArgs_ = args;
  }

  private fun_: T;
  private time_: number;
  private lastArgs_?: Parameters<T>;
  private timer_?: NodeJS.Timeout;
}

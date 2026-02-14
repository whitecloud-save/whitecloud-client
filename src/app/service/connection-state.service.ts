import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';

export enum ConnectionState {
  Initial = 'initial',
  OK = 'ok',
  Requesting = 'requesting',
  Connecting = 'connecting',
  Error = 'error',
}

export interface ConnectionStatus {
  state: ConnectionState;
  errorMessage?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ConnectionStateService {
  private $status = new BehaviorSubject<ConnectionStatus>({state: ConnectionState.Initial});
  private activeRequests_ = 0;
  private state_: ConnectionState = ConnectionState.Initial;
  private errorMessage_?: string;

  get status(): Observable<ConnectionStatus> {
    return this.$status;
  }

  get currentStatus(): ConnectionStatus {
    return this.$status.value;
  }

  startRequest(updateState = true) {
    if (updateState) {
      this.activeRequests_++;
    }
  }

  endRequest(updateState = true) {
    if (updateState) {
      this.activeRequests_--;
      if (this.activeRequests_ < 0) {
        this.activeRequests_ = 0;
      }
    }
  }

  setConnectState(state: ConnectionState, message?: string) {
    this.state_ = state;
    this.errorMessage_ = message;

    this.updateStatus();

    // const current = this.$status.getValue();
    // if (current.state === state)
    //   return;
    // this.$status.next({
    //   state: state,
    //   errorMessage: message,
    // });
  }

  private updateStatus() {
    let state = this.state_;
    if (this.activeRequests_) {
      state = ConnectionState.Requesting;
    }

    if (this.currentStatus.state === state)
      return;

    this.$status.next({
      state,
      errorMessage: this.errorMessage_,
    });
  }
}

import {Component, OnDestroy} from '@angular/core';
import {Subscription} from 'rxjs';
import {ConnectionState, ConnectionStatus, ConnectionStateService} from '../../../service/connection-state.service';

@Component({
  selector: 'app-connection-indicator',
  templateUrl: './connection-indicator.component.html',
  styleUrl: './connection-indicator.component.scss',
})
export class ConnectionIndicatorComponent implements OnDestroy {
  ConnectionState = ConnectionState;
  connectionStatus: ConnectionStatus = {state: ConnectionState.Initial};

  private readonly colorMap: Record<ConnectionState, string> = {
    [ConnectionState.Initial]: '#8c8c8c',
    [ConnectionState.OK]: '#52c41a',
    [ConnectionState.Requesting]: '#1890ff',
    [ConnectionState.Connecting]: '#faad14',
    [ConnectionState.Error]: '#ff4d4f',
  };

  private readonly statusTextMap: Record<ConnectionState, string> = {
    [ConnectionState.Initial]: '未连接',
    [ConnectionState.OK]: '与服务器连接正常',
    [ConnectionState.Requesting]: '请求中',
    [ConnectionState.Connecting]: '正在与服务器连接',
    [ConnectionState.Error]: '与服务器连接失败',
  };

  private connectionStateSub_: Subscription;

  constructor(
    private connectionStateService: ConnectionStateService,
  ) {
    this.connectionStateSub_ = this.connectionStateService.status.subscribe((status) => {
      this.connectionStatus = status;
    });
  }

  ngOnDestroy(): void {
    this.connectionStateSub_.unsubscribe();
  }

  get backgroundColor(): string {
    return this.colorMap[this.connectionStatus.state];
  }

  get tooltipContent(): string {
    if (this.connectionStatus.state === ConnectionState.Error && this.connectionStatus.errorMessage) {
      return `${this.statusTextMap[ConnectionState.Error]}：${this.connectionStatus.errorMessage}`;
    }
    return this.statusTextMap[this.connectionStatus.state];
  }
}

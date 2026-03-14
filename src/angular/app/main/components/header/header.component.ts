import {Component, OnDestroy} from '@angular/core';
import {trigger, style, animate, transition} from '@angular/animations';
import {IconService} from '../../../service/icon.service';
import {DialogService} from '../../../service/dialog.service';
import {HeaderType, MainService} from '../../main.service';
import {Subscription} from 'rxjs';
import {UserService} from '../../../service/user.service';
import {SaveTransferService} from 'app/service/save-transfer.service';
import {Router} from '@angular/router';

export enum AppHeaderType {
  ImportGame = 'import-game',
  Title = 'title',
  Setting = 'setting',
}

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  animations: [
    trigger('slideIn', [
      transition(':leave', []),
      transition(':enter, * => *', [
        style({ opacity: 0, transform: 'translateX(30px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ])
  ]
})
export class HeaderComponent implements OnDestroy {
  AppHeaderType = AppHeaderType;

  type: AppHeaderType;
  title: string = '';
  icon?: string;

  showLoginPopover = true;

  private headerSub_: Subscription;

  constructor(
    public iconService: IconService,
    public dialogService: DialogService,
    public mainService: MainService,
    public userService: UserService,
    public saveTransferService: SaveTransferService,
    private router: Router,
  ) {
    this.type = AppHeaderType.Title;
    const notified = localStorage.getItem('app:login-notify');
    if (notified === 'true') {
      this.showLoginPopover = false;
    }

    this.headerSub_ = this.mainService.header.subscribe((data) => {
      if (data) {
        switch(data.type) {
          case HeaderType.GameDetail:
            this.type = AppHeaderType.Title;
            this.title = data.data.name;
            this.icon = data.data.iconPath;
            break;
          case HeaderType.Home:
            this.type = AppHeaderType.ImportGame;
            break;
          case HeaderType.Setting:
            this.type = AppHeaderType.Setting;
            break;
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.headerSub_.unsubscribe();
  }

  navigatorToSetting() {
    this.closeLoginPopover();
    this.router.navigate(['/main/setting']);
  }

  closeLoginPopover() {
    this.showLoginPopover = false;
    localStorage.setItem('app:login-notify', 'true');
  }
}

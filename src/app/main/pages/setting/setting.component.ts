import {Component} from '@angular/core';
import {HeaderType, MainService} from '../../main.service';
import {IconService} from '../../../service/icon.service';
import {shell} from '@electron/remote';

@Component({
  selector: 'app-setting',
  templateUrl: './setting.component.html',
  styleUrl: './setting.component.scss',
})
export class SettingComponent {
  constructor(
    public mainService: MainService,
    public iconService: IconService,
  ) {}

  ngOnInit(): void {
    console.log('on init')
    this.mainService.setHeader({
      type: HeaderType.Setting,
    });
  }

  openQQ() {
    shell.openExternal('http://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=646h_2FET-S1Vw1QjViq_6Pri7PGamXU&authKey=64KVecyVZV9no57YkXD2Uwmk5P%2BKXx2xZIvOfaKH3CcJB9j5q2B%2FtS3TvazNF9Km&noverify=0&group_code=1079862982');
  }

  openGithub() {
    shell.openExternal('https://github.com/whitecloud-save/whitecloud-client');
  }

  openWebsite() {
    shell.openExternal('https://whitecloud.xyyaya.com');
  }
}

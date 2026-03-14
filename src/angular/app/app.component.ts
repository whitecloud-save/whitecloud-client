import {AfterViewInit, Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {SaveTransferService} from './service/save-transfer.service';
import {IconService} from './service/icon.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements AfterViewInit {
  @ViewChild('progressTpl')
  progressTpl!: TemplateRef<{}>;

  constructor(
    private saveTransfer: SaveTransferService,
    public iconService: IconService,
  ) {
  }

  ngAfterViewInit(): void {
    this.saveTransfer.setContentTemplate(this.progressTpl);
  }
}

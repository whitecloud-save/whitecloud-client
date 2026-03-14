import { Component } from '@angular/core';
import {IconService} from 'app/service/icon.service';
import {SaveTransferService} from 'app/service/save-transfer.service';

@Component({
  selector: 'app-save-transfer-indicator',
  templateUrl: './save-transfer-indicator.component.html',
  styleUrl: './save-transfer-indicator.component.scss'
})
export class SaveTransferIndicatorComponent {
  constructor(
    public iconService: IconService,
    public saveTransferService: SaveTransferService
  ) {}

  onClick() {
    this.saveTransferService.showAll();
  }
}

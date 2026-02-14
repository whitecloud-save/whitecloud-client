import { Component } from '@angular/core';
import { NzModalRef, NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { UpdateService } from '../../../service/update.service';
import { Inject } from '@angular/core';

@Component({
  selector: 'app-full-update-dialog',
  templateUrl: './full-update-dialog.component.html',
  styleUrl: './full-update-dialog.component.scss',
})
export class FullUpdateDialogComponent {
  constructor(
    private modalRef: NzModalRef,
    private updateService: UpdateService,
    @Inject(NZ_MODAL_DATA) public data: { version: string },
  ) {}

  goToWebsite(): void {
    this.updateService.openWebsite();
    this.modalRef.close();
  }

  close(): void {
    this.modalRef.close();
  }
}

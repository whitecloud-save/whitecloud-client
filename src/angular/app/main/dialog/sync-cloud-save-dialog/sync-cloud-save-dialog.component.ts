import {Component, inject} from '@angular/core';
import {NZ_MODAL_DATA, NzModalRef} from 'ng-zorro-antd/modal';
import {RemoteSave} from '../../../entity/remote-save';
import {Game} from '../../../entity/game';
import {Save} from '../../../entity/save';
import moment from 'moment';

@Component({
  selector: 'app-sync-cloud-save-dialog',
  templateUrl: './sync-cloud-save-dialog.component.html',
  styleUrl: './sync-cloud-save-dialog.component.scss',
})
export class SyncCloudSaveDialogComponent {
  readonly ref = inject(NzModalRef);
  readonly nzModalData: {game: Game, remoteSave: RemoteSave | Save} = inject(NZ_MODAL_DATA);

  constructor() {}

  get saveDate(): string {
    return moment.unix(this.nzModalData.remoteSave.createTime).format('YYYY年MM月DD日 HH:mm');
  }

  get hostname(): string {
    return this.nzModalData.remoteSave.hostname;
  }

  get remoteSave(): RemoteSave | Save {
    return this.nzModalData.remoteSave;
  }

  async onConfirm() {
    this.ref.close(true);
  }

  onCancel() {
    this.ref.close(false);
  }
}

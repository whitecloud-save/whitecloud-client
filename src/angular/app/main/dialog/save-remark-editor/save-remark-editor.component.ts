import {Component, inject} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {NZ_MODAL_DATA, NzModalRef} from 'ng-zorro-antd/modal';
import {Save} from '../../../entity/save';

@Component({
  selector: 'app-save-remark-editor',
  templateUrl: './save-remark-editor.component.html',
  styleUrl: './save-remark-editor.component.scss',
})
export class SaveRemarkEditorComponent {
  remarkForm: FormGroup<{
    remark: FormControl<string>;
  }>;

  readonly ref = inject(NzModalRef);
  readonly nzModalData: {save: Save} = inject(NZ_MODAL_DATA);


  constructor() {
    this.remarkForm = new FormGroup({
      remark: new FormControl(this.nzModalData.save.remark, []) as FormControl<string>,
    });
  }

  submitRemarkForm() {
    const save = this.nzModalData.save;
    save.remark = this.remarkForm.value.remark || '';
    save.save(true);
    this.ref.close();
  }
}

import {Component, inject} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {ServerService} from '../../../service/server/server.service';
import {IReqForgetPassword} from '../../../service/server/api';
import {NzMessageService} from 'ng-zorro-antd/message';
import {NzModalRef} from 'ng-zorro-antd/modal';
import {DialogService} from '../../../service/dialog.service';
import {ErrorHandlingUtil} from '../../../service/error-handling-util';

@Component({
  selector: 'app-user-forget-password',
  templateUrl: './user-forget-password.component.html',
  styleUrl: './user-forget-password.component.scss',
})
export class UserForgetPasswordComponent {
  forgetPasswordForm: FormGroup<{
    email: FormControl<string>;
    password: FormControl<string>;
    code: FormControl<string>;
  }>;

  id: string | undefined;
  requestForgetPasswordLoading = false;

  readonly ref = inject(NzModalRef);

  constructor(
    private server: ServerService,
    private message: NzMessageService,
    private dialogService: DialogService,
    private errorHandlingUtil: ErrorHandlingUtil,
  ) {
    this.forgetPasswordForm = new FormGroup({
      email: new FormControl('', [Validators.email, Validators.required]) as FormControl<string>,
      password: new FormControl('', [Validators.required]) as FormControl<string>,
      code: new FormControl('', [Validators.required]) as FormControl<string>,
    });
  }

  requestForgetPassword() {
    const email = this.forgetPasswordForm.value.email;
    if (!email)
      return;

    if (this.forgetPasswordForm.controls.email.invalid)
      return;

    this.requestForgetPasswordLoading = true;
    this.server.auth.requestForgetPassword({
      email,
    })
      .then((res) => {
        this.id = res.id;
        this.forgetPasswordForm.controls.email.disable();
      })
      .catch((err) => {
        this.errorHandlingUtil.handleManualError(err, '请求验证码失败');
      })
      .finally(() => {
        this.requestForgetPasswordLoading = false;
      });
  }

  submitForgetPasswordForm() {
    if (this.forgetPasswordForm.invalid)
      return;
    if (!this.id)
      return;

    this.server.auth.forgetPassword({
      id: this.id,
      ...this.forgetPasswordForm.value,
    } as IReqForgetPassword)
      .then(() => {
        this.message.success('密码重置成功');
        this.ref.close();
        this.dialogService.openUserLoginRegisterDialog('login');
      })
      .catch((err) => {
        this.errorHandlingUtil.handleManualError(err, '密码重置失败');
      });
  }
}

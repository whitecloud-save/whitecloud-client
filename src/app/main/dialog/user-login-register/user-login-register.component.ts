import {Component, inject} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {NZ_MODAL_DATA, NzModalRef} from 'ng-zorro-antd/modal';
import {ServerService} from '../../../service/server/server.service';
import {IReqRegister} from '../../../service/server/api';
import {NzMessageService} from 'ng-zorro-antd/message';
import {UserService} from '../../../service/user.service';
import {DialogService} from '../../../service/dialog.service';
import {ErrorHandlingUtil} from '../../../service/error-handling-util';

@Component({
  selector: 'app-user-login-register',
  templateUrl: './user-login-register.component.html',
  styleUrl: './user-login-register.component.scss',
})
export class UserLoginRegisterComponent {
  mode: number;
  autoLogin = true;

  readonly ref = inject(NzModalRef);
  readonly nzModalData: {mode: 'login' | 'register'} = inject(NZ_MODAL_DATA);

  modeOptions = [
    {label: '登录', value: 'login'},
    {label: '注册', value: 'register'},
  ];

  registerForm: FormGroup<{
    email: FormControl<string>;
    password: FormControl<string>;
    nickname: FormControl<string>;
  }>;

  loginForm: FormGroup<{
    username: FormControl<string>;
    password: FormControl<string>;
    autoLogin: FormControl<boolean>;
  }>;

  constructor(
    public server: ServerService,
    public userService: UserService,
    public messageService: NzMessageService,
    public dialogService: DialogService,
    private errorHandlingUtil: ErrorHandlingUtil,
  ) {
    switch (this.nzModalData.mode) {
      case 'login':
        this.mode = 0;
        break;
      case 'register':
        this.mode = 1;
        break;
    }

    this.registerForm =  new FormGroup({
      email: new FormControl('', [Validators.email, Validators.required]) as FormControl<string>,
      password: new FormControl('', [Validators.required]) as FormControl<string>,
      nickname: new FormControl('', [Validators.minLength(1), Validators.maxLength(10), Validators.required]) as FormControl<string>,
    });

    this.loginForm = new FormGroup({
      username: new FormControl('', [Validators.email]) as FormControl<string>,
      password: new FormControl('', [Validators.required]) as FormControl<string>,
      autoLogin: new FormControl(true) as FormControl<boolean>,
    });

    this.userService.logged.subscribe((logged) => {
      if (logged) {
        this.ref.close();
      }
    });
  }

  submitRegisterForm() {
    if (!this.registerForm.valid)
      return;

    this.server.auth.register(this.registerForm.value as IReqRegister)
      .then(() => {
        this.messageService.success('注册成功');
        this.mode = 0;
      })
      .catch((err) => {
        this.errorHandlingUtil.handleManualError(err, '注册失败');
      });
  }

  submitLoginForm() {
    if (!this.loginForm.valid)
      return;

    const login = this.loginForm.value as {username: string; password: string};
    this.userService.login(login.username, login.password);
  }

  openForgetPassword() {
    this.ref.close();
    this.dialogService.openUserForgetPasswordDialog();
  }
}

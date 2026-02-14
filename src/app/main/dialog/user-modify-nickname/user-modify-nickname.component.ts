import {Component, inject} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {UserService} from '../../../service/user.service';
import {ServerService} from '../../../service/server/server.service';
import {NzModalRef} from 'ng-zorro-antd/modal';
import {NzMessageService} from 'ng-zorro-antd/message';
import {ErrorHandlingUtil} from '../../../service/error-handling-util';

@Component({
  selector: 'app-user-modify-nickname',
  templateUrl: './user-modify-nickname.component.html',
  styleUrl: './user-modify-nickname.component.scss',
})
export class UserModifyNicknameComponent {
  nicknameForm: FormGroup<{
    nickname: FormControl<string>;
  }>;

  readonly ref = inject(NzModalRef);

  constructor(
    public userService: UserService,
    public server: ServerService,
    public messageService: NzMessageService,
    private errorHandlingUtil: ErrorHandlingUtil,
  ) {
    this.nicknameForm = new FormGroup({
      nickname: new FormControl(userService.userInfo?.nickname, [Validators.minLength(1), Validators.maxLength(10), Validators.required]) as FormControl<string>,
    });
  }

  submitNicknameForm() {
    if (this.nicknameForm.invalid)
      return;

    const nickname = this.nicknameForm.value.nickname as string;
    this.server.business.modifyNickname({
      nickname,
    })
      .then(() => {
        this.messageService.success('昵称修改成功');
        this.ref.close();
      })
      .catch((err) => {
        this.errorHandlingUtil.handleManualError(err, '昵称修改失败');
      });
  }
}

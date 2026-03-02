import {UserErrorCode} from '../../service/server/api';
import {ErrorCode} from './ErrorCode';

export type ErrorStringFn = (args: any) => string;

export const ErrorString : {
  [k: string]: string | ErrorStringFn;
} = {
  ERR_NET: '网络通讯发生错误',
  ERR_GAME_EXE_NOT_FOUND: '没有在该文件夹下找到可执行文件（exe）',
  ERR_GAME_SAVE_PATH_NOT_FOUND: '存档文件夹不存在',
  [ErrorCode.ERR_IMAGE_TOO_LARGE]: (arg: {max: string}) => {
    return `图片文件大小超过${arg.max}`;
  },

  [UserErrorCode.ERR_ACCOUNT_DISABLED]: '账号被封禁',
  [UserErrorCode.ERR_NOT_LOGIN]: '尚未登录',
  [UserErrorCode.ERR_WRONG_PASSWORD]: '密码错误',
  [UserErrorCode.ERR_WRONG_EMAIL_CODE]: '邮箱验证码错误',
  [UserErrorCode.ERR_SERVER_INTERNAL]: '服务器发生错误，请稍候重试',
  [UserErrorCode.ERR_NICKNAME_LENGTH]: '昵称长度错误',
  [UserErrorCode.ERR_AUTH_DENY]: '没有权限进行该操作',
  [UserErrorCode.ERR_DUPLICATE_REGISTER]: '该邮箱已经注册过了',
  [UserErrorCode.ERR_SPACE_NOT_ENOUGH]: '账号云空间容量不足',
  [UserErrorCode.ERR_FILE_SPACE_LIMIT]: '存档体积过大',
};

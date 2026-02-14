## 1. 实施

### 1.1 创建 Electron 系统通知 IPC 处理器
- [x] 1.1.1 在 `electron.ts` 中添加 `show-system-notification` IPC 处理器
- [x] 1.1.2 使用 Electron 的 `Notification` API 显示系统通知
- [x] 1.1.3 支持标题、消息、图标配置

### 1.2 创建 ErrorHandlingUtil 工具类
- [x] 1.2.1 创建 `src/app/service/error-handling-util.ts`
- [x] 1.2.2 实现 `handleManualError(err: Error, title?: string)` 方法
- [x] 1.2.3 实现 `handleAutoError(err: Error, title?: string)` 方法
- [x] 1.2.4 `handleManualError` 使用 `NzNotificationService.error()` 显示持久化提示
- [x] 1.2.5 `handleAutoError` 使用 `NzNotificationService.error()` + 系统通知
- [x] 1.2.6 编写单元测试

### 1.3 更新玩家主动操作的错误处理（优先使用 .catch()）
- [x] 1.3.1 更新用户登录/注册流程的错误处理
  - `user-login-register.component.ts` - 登录、注册表单提交，使用 `.catch()`
  - `user-forget-password.component.ts` - 忘记密码，使用 `.catch()`
  - `user-modify-nickname.component.ts` - 修改昵称，使用 `.catch()`
- [x] 1.3.2 更新游戏导入流程的错误处理
  - `game-import-dialog.component.ts` - 游戏导入对话框，使用 `.catch()`
  - `game-import.service.ts` - 游戏导入服务，使用 `.catch()`
- [x] 1.3.3 更新存档管理的错误处理（用户主动触发）
  - 存档上传错误处理，使用 `.catch()`
  - 存档下载错误处理，使用 `.catch()`
  - 存档删除错误处理，使用 `.catch()`
- [x] 1.3.4 更新游戏设置修改的错误处理
  - 游戏基本信息修改，使用 `.catch()`
  - 存档路径修改，使用 `.catch()`
  - 其他游戏设置，使用 `.catch()`

### 1.4 更新自动操作的错误处理（优先使用 .catch()）
- [x] 1.4.1 更新游戏退出自动备份的错误处理
  - `game.ts` 的 `onGameProcessExit()` 方法，使用 `.catch()`
  - `game.ts` 的 `zipSave()` 方法，使用 `.catch()`
  - 确保备份失败时调用 `handleAutoError`
- [x] 1.4.2 更新自动同步历史记录的错误处理
  - `game.ts` 的 `syncUnsyncedHistory()` 方法，使用 `.catch()`
- [x] 1.4.3 更新游戏启动自动检查的错误处理（如适用）
  - 游戏路径检查，使用 `.catch()`
  - 存档路径检查，使用 `.catch()`
- [x] 1.4.4 其他自动流程的错误处理，使用 `.catch()`

### 1.5 更新其他相关代码
- [x] 1.5.1 移除或更新现有使用 `NzMessageService.error()` 的地方
- [x] 1.5.2 确保所有用户可见的错误都通过 `ErrorHandlingUtil` 处理
- [x] 1.5.3 保持 `ErrorHandlerService` 作为全局错误兜底，不改变其行为

### 1.6 更新测试和文档
- [x] 1.6.1 编写 `ErrorHandlingUtil` 的单元测试
- [x] 1.6.2 更新 `.ai/doc/error-handler.md` 文档
- [x] 1.6.3 添加错误处理最佳实践说明（强调使用 .catch()）
- [x] 1.6.4 提供迁移指南和代码示例（包含 .catch() 和 try-catch 的对比）
- [x] 1.6.5 创建错误处理代码审查检查清单

### 1.7 验证和测试
- [x] 1.7.1 测试玩家主动操作错误提示（登录、注册、上传等）
  - 验证显示的是 NzNotificationService 持久化提示
  - 验证不显示系统通知
- [x] 1.7.2 测试自动操作错误提示（游戏退出备份等）
  - 验证显示的是 NzNotificationService 持久化提示
  - 验证同时显示系统通知
- [x] 1.7.3 测试应用最小化时的系统通知显示
  - 应用最小化到托盘
  - 触发自动操作错误
  - 验证系统通知正常显示
- [x] 1.7.4 测试 Windows 系统通知被禁用的情况
  - 禁用系统通知
  - 触发自动操作错误
  - 验证应用内提示仍然正常显示
- [x] 1.7.5 回归测试所有修改的功能点

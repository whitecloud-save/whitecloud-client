## 新增需求

### 需求：Promise 错误捕获方式优先级
在处理 Promise 错误时，必须优先使用 `.catch()` 而不是 `try-catch`。

#### 场景：简单的异步操作错误处理
- **当** 调用单个异步函数（Promise 或 async 函数）
- **并且** 不需要 await 返回值用于后续逻辑
- **那么** 必须使用 `.catch()` 处理错误
- **例如**：
  ```typescript
  this.server.auth.register(data)
    .then(() => {
      this.messageService.success('注册成功');
    })
    .catch((err) => {
      this.errorHandlingUtil.handleManualError(err, '注册失败');
    });
  ```

#### 场景：需要 await 结果的错误处理
- **当** 调用异步函数
- **并且** 需要在错误处理后继续使用返回值
- **或者** 有多个异步操作需要共享上下文
- **那么** 可以使用 `try-catch` 包裹 `await`
- **例如**：
  ```typescript
  async submitForm() {
    try {
      const result = await this.server.auth.register(data);
      // 可以在这里使用 result
      await this.processResult(result);
      this.messageService.success('注册成功');
    } catch (err) {
      this.errorHandlingUtil.handleManualError(err, '注册失败');
    }
  }
  ```

#### 场景：Promise 链式调用
- **当** 有多个异步操作通过 Promise 链式调用
- **那么** 必须使用 `.catch()` 在链尾统一处理错误
- **并且** 避免在链中间使用 try-catch
- **例如**：
  ```typescript
  this.validateForm()
    .then(() => this.server.auth.register(data))
    .then(() => this.updateUserState())
    .then(() => this.messageService.success('注册成功'))
    .catch((err) => {
      this.errorHandlingUtil.handleManualError(err, '注册失败');
    });
  ```

#### 场景：RxJS Observable 错误处理
- **当** 处理 RxJS Observable
- **那么** 必须使用 `catchError` 操作符处理错误
- **例如**：
  ```typescript
  this.serverService.business.fetchUserGame()
    .pipe(
      catchError((err) => {
        this.errorHandlingUtil.handleManualError(err, '获取游戏列表失败');
        return EMPTY;
      })
    )
    .subscribe((games) => {
      // 处理结果
    });
  ```

### 需求：错误提示分类
系统必须在调用入口处根据操作类型选择不同的提示方式。

#### 场景：玩家主动操作错误提示（使用 .catch()）
- **当** 玩家主动执行操作（如点击按钮、提交表单）发生错误
- **并且** 错误在用户交互回调的 `.catch()` 中处理
- **那么** 必须调用 `ErrorHandlingUtil.handleManualError()` 处理错误
- **并且** 使用 `NzNotificationService.error()` 显示持久的错误提示
- **并且** 提示标题为"操作失败"或更具体的错误类型
- **并且** 提示内容为错误的用户友好消息
- **并且** 提示框支持用户手动关闭
- **并且** 不显示系统通知

#### 场景：自动操作错误提示（使用 .catch()）
- **当** 系统自动执行操作（如游戏退出备份存档、自动同步历史记录）发生错误
- **并且** 错误在自动流程的 `.catch()` 中处理
- **那么** 必须调用 `ErrorHandlingUtil.handleAutoError()` 处理错误
- **并且** 使用 `NzNotificationService.error()` 显示持久的错误提示
- **并且** 通过 Electron Notification API 显示 Windows 系统通知
- **并且** 应用内提示标题为"操作失败"或更具体的错误类型
- **并且** 系统通知标题为"Whitecloud 错误"
- **并且** 系统通知内容为错误摘要（例如："操作失败: 存档备份失败"）

#### 场景：应用最小化时的自动操作错误提示
- **当** 应用最小化到托盘或窗口关闭
- **并且** 系统自动执行操作发生错误
- **并且** 调用了 `ErrorHandlingUtil.handleAutoError()`
- **那么** 系统必须显示 Windows 系统通知
- **并且** 即使用户没有打开应用，也能感知到错误
- **并且** 应用内通知也会在应用打开时显示

### 需求：错误处理工具类
系统必须提供统一的错误处理工具类。

#### 场景：处理手动操作错误
- **当** 调用 `ErrorHandlingUtil.handleManualError(err: Error, title?: string)`
- **那么** 必须使用 `NzNotificationService.error()` 显示应用内通知
- **并且** 通知标题由 `title` 参数指定，默认为"操作失败"
- **并且** 如果错误是 `BaseError` 实例，显示其 `showMessage` 属性
- **并且** 如果错误不是 `BaseError` 实例，显示其 `message` 属性
- **并且** 不调用系统通知

#### 场景：处理自动操作错误
- **当** 调用 `ErrorHandlingUtil.handleAutoError(err: Error, title?: string)`
- **并且** 当前平台为 Windows
- **那么** 必须使用 `NzNotificationService.error()` 显示应用内通知
- **并且** 必须通过 IPC 调用 `show-system-notification` 显示系统通知
- **并且** 系统通知标题为"Whitecloud 错误"
- **并且** 系统通知内容为 `{title}: {errorMessage}`
- **并且** 应用内通知标题由 `title` 参数指定，默认为"操作失败"
- **并且** 如果错误是 `BaseError` 实例，显示其 `showMessage` 属性
- **并且** 如果错误不是 `BaseError` 实例，显示其 `message` 属性

#### 场景：非 Windows 平台的自动错误处理
- **当** 调用 `ErrorHandlingUtil.handleAutoError(err: Error, title?: string)`
- **并且** 当前平台非 Windows（如 macOS、Linux）
- **那么** 必须使用 `NzNotificationService.error()` 显示应用内通知
- **并且** 不显示系统通知

### 需求：错误类型保持不变
错误类型必须不关心错误的触发方式。

#### 场景：创建错误
- **当** 代码抛出 `BaseError` 或其子类（`UserError`、`ServerError`、`NetError`）
- **那么** 错误构造函数必须不包含 `trigger` 或类似的触发方式参数
- **并且** 错误只描述"什么错了"，不包含"如何引起的"信息

#### 场景：现有错误代码兼容
- **当** 现有代码抛出错误（不修改任何代码）
- **那么** 错误必须正常工作
- **并且** 可以在任何调用场景中使用
- **并且** 由调用者决定如何处理这个错误

### 需求：Electron 系统通知
Electron 主进程必须提供系统通知功能。

#### 场景：显示系统通知
- **当** 渲染进程通过 IPC 调用 `show-system-notification`
- **那么** 主进程必须使用 Electron `Notification` API 显示通知
- **并且** 通知标题由 IPC 参数 `title` 指定
- **并且** 通知消息由 IPC 参数 `message` 指定
- **并且** 通知图标由 IPC 参数 `icon` 指定（可选）
- **并且** 必须捕获 Notification API 异常，不影响主进程稳定

#### 场景：系统通知被禁用
- **当** Windows 系统通知被禁用或 Electron Notification API 抛出异常
- **那么** 主进程必须捕获异常并忽略
- **并且** 不向渲染进程抛出错误
- **并且** 应用内提示仍然正常显示
- **并且** 不影响其他功能的正常运行

### 需求：调用入口错误处理
必须在业务逻辑的调用入口处处理错误。

#### 场景：用户交互入口错误处理（优先使用 .catch()）
- **当** 用户点击按钮、提交表单或进行其他交互
- **并且** 该交互调用业务逻辑可能抛出错误
- **那么** 必须优先使用 `.catch()` 捕获错误
- **并且** 在 `.catch()` 回调中调用 `ErrorHandlingUtil.handleManualError()`
- **并且** 传递合理的错误标题（如"登录失败"、"注册失败"等）
- **并且** 只有在需要 await 返回值或共享上下文时才使用 try-catch

#### 场景：自动流程入口错误处理（优先使用 .catch()）
- **当** 系统自动执行操作（如游戏退出、定时任务）
- **并且** 该操作调用业务逻辑可能抛出错误
- **那么** 必须优先使用 `.catch()` 捕获错误
- **并且** 在 `.catch()` 回调中调用 `ErrorHandlingUtil.handleAutoError()`
- **并且** 传递合理的错误标题（如"存档备份失败"、"同步失败"等）
- **并且** 只有在需要 await 返回值或共享上下文时才使用 try-catch

#### 场景：错误不传播到 ErrorHandlerService
- **当** 错误在业务流程的调用入口处被正确捕获和处理（通过 .catch() 或 try-catch）
- **那么** 错误不应该传播到全局 `ErrorHandlerService`
- **并且** `ErrorHandlerService` 仅作为未捕获错误的兜底机制
- **并且** `ErrorHandlerService` 保持现有行为不变

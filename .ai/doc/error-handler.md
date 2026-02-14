# 错误处理总结文档

本文档总结了 Whitecloud Client 项目中各个业务流程的错误处理机制。

## 错误处理架构

### 错误类型定义

项目使用以下错误类型进行错误分类：

1. **BaseError**（基础错误类）
   - 位置：`src/app/library/error/BaseError.ts`
   - 属性：`code`、`message`、`args`
   - 提供 `showMessage` 属性用于显示用户友好的错误信息

2. **UserError**（用户错误）
   - 位置：`src/app/library/error/UserError.ts`
   - 继承自 BaseError
   - 用于处理用户输入错误、权限不足等预期内的错误

3. **ServerError**（服务端错误）
   - 位置：`src/app/library/error/ServerError.ts`
   - 继承自 BaseError
   - 用于处理服务端返回的非预期错误

4. **NetError**（网络错误）
   - 位置：`src/app/library/error/NetError.ts`
   - 继承自 BaseError
   - 用于处理网络连接、超时等网络相关错误

### 错误处理工具类

#### ErrorHandlingUtil

- **位置**：`src/app/service/error-handling-util.ts`
- **作用**：提供统一的错误处理接口
- **方法**：
  - `handleManualError(err: unknown, title?: string)`：处理玩家主动操作的错误
  - `handleAutoError(err: unknown, title?: string)`：处理自动操作的错误
- **特点**：
  - 玩家主动操作使用 `NzNotificationService` 显示持久化提示
  - 自动操作使用 `NzNotificationService` + Windows 系统通知
  - 自动操作的错误通知有 5 秒的去重间隔

### 错误码定义

#### 本地错误码（ErrorCode）
- `ERR_GAME_EXE_NOT_FOUND`：游戏可执行文件未找到
- `ERR_GAME_SAVE_PATH_NOT_FOUND`：游戏存档路径未找到
- `ERR_GAME_PATH_NOT_FOUND`：游戏路径未找到
- `ERR_IMAGE_TOO_LARGE`：图片文件过大

#### 服务端错误码（UserErrorCode）
- `ERR_ACCOUNT_DISABLED`：账号被封禁
- `ERR_NOT_LOGIN`：尚未登录
- `ERR_WRONG_PASSWORD`：密码错误
- `ERR_WRONG_EMAIL_CODE`：邮箱验证码错误
- `ERR_SERVER_INTERNAL`：服务器发生内部错误
- `ERR_NICKNAME_LENGTH`：昵称长度错误
- `ERR_AUTH_DENY`：没有权限进行该操作
- `ERR_DUPLICATE_REGISTER`：邮箱已注册

### 错误处理流程

1. **错误发生**
   - 本地操作抛出 `BaseError` 或其子类
   - 服务端返回错误信息，转换为 `UserError` 或 `ServerError`
   - 网络错误抛出 `NetError`

2. **错误传播**
   - 优先使用 `.catch()` 捕获 Promise 错误
   - 必要时使用 `try-catch`（async 函数内部或需要共享上下文）
   - RxJS 的 `catchError` 捕获 Observable 错误

3. **错误显示**
   - 玩家主动操作：通过 `ErrorHandlingUtil.handleManualError()` 使用 `NzNotificationService` 显示持久化提示
   - 自动操作：通过 `ErrorHandlingUtil.handleAutoError()` 使用 `NzNotificationService` + Windows 系统通知
   - 全局错误兜底：通过 `ErrorHandlerService` 处理未捕获的错误

4. **错误恢复**
   - WebSocket 自动重连机制
   - 连接状态服务追踪连接状态

### 错误提示方式分类

#### 玩家主动操作
用户通过点击按钮、提交表单等交互触发的操作：
- **示例**：用户登录、注册、游戏导入、存档管理、昵称修改等
- **提示方式**：`NzNotificationService` 显示持久化提示（不自动消失）
- **特点**：提示更加突出，不容易被忽略

#### 自动操作
系统自动执行的操作，用户不直接触发：
- **示例**：游戏退出时备份存档、自动同步历史记录等
- **提示方式**：`NzNotificationService` 持久化提示 + Windows 系统通知
- **特点**：即使应用最小化到托盘，用户也能感知到错误

### Electron 系统通知

- **位置**：`src/electron.ts`
- **IPC 处理器**：`show-system-notification`
- **功能**：在 Windows 系统级别显示通知
- **参数**：
  - `title`：通知标题
  - `message`：通知内容
  - `icon`：通知图标（可选）

---

## 业务流程错误处理统计

### 1. 用户登录/注册流程

**业务描述**：用户通过邮箱和密码进行登录或注册

**调用的本地处理函数**：
- `UserService.login()`
- `UserService.logout()`
- `UserService.reconnectLogin()`

**调用的服务端请求**：
- `ServerService.auth.login()` - 登录
- `ServerService.auth.register()` - 注册
- `ServerService.auth.reconnectLogin()` - 重新连接登录

**错误处理**：

| 错误环节 | 可能发生的错误 | 错误处理方式 |
|---------|---------------|-------------|
| 表单验证 | 邮箱格式错误、密码为空 | 通过 Angular Validators 验证，阻止提交 |
| 注册请求 | 邮箱已注册、昵称长度错误、服务器内部错误 | 使用 `.catch()` 捕获错误，通过 `ErrorHandlingUtil.handleManualError()` 显示持久化提示 |
| 登录请求 | 密码错误、账号被封禁、服务器内部错误 | 使用 `.catch()` 捕获错误，通过 `ErrorHandlingUtil.handleManualError()` 显示持久化提示 |
| WebSocket 断开 | 网络错误、连接超时 | 抛出 `NetError`，触发自动重连机制 |
| Token 过期 | Token 失效 | 通过 `reconnectLogin()` 重新登录 |

**示例代码**：
```typescript
// user-login-register.component.ts:82-95
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
```

---

### 2. 游戏启动流程

**业务描述**：启动游戏可执行文件

**调用的本地处理函数**：
- `Game.startGame()` - 启动游戏
- `Game.checkState()` - 检查游戏状态
- `Game.onError()` - 处理错误

**调用的服务端请求**：无

**错误处理**：

| 错误环节 | 可能发生的错误 | 错误处理方式 |
|---------|---------------|-------------|
| 存档路径检查 | 存档路径不存在 | 抛出 `BaseError(ErrorCode.ERR_GAME_SAVE_PATH_NOT_FOUND)`，设置游戏状态为 `GameState.Error` |
| 游戏路径检查 | 游戏路径不存在 | 抛出 `BaseError(ErrorCode.ERR_GAME_PATH_NOT_FOUND)`，设置游戏状态为 `GameState.Error` |
| 可执行文件检查 | 可执行文件不存在 | 抛出 `BaseError(ErrorCode.ERR_GAME_EXE_NOT_FOUND)`，设置游戏状态为 `GameState.Error` |
| 启动失败 | 文件损坏、权限不足 | 游戏进程启动失败，不抛出错误，通过进程监控器检测 |

**示例代码**：
```typescript
// game.ts:373-408
async checkState() {
  try {
    await fs.access(this.savePath, fs.constants.F_OK);
  } catch (err) {
    this.onError(new BaseError(ErrorCode.ERR_GAME_SAVE_PATH_NOT_FOUND));
    return;
  }

  try {
    await fs.access(this.gamePath, fs.constants.F_OK);
  } catch (err) {
    this.onError(new BaseError(ErrorCode.ERR_GAME_PATH_NOT_FOUND));
    return;
  }

  try {
    await fs.access(this.exeFilePath, fs.constants.F_OK);
  } catch (err) {
    this.onError(new BaseError(ErrorCode.ERR_GAME_EXE_NOT_FOUND));
    return;
  }
  // ...
}
```

---

### 3. 游戏存档备份流程

**业务描述**：游戏退出时自动创建本地存档备份，并上传到云端

**调用的本地处理函数**：
- `Game.zipSave()` - 创建存档压缩包
- `Game.createSaveZip()` - 生成 ZIP 文件
- `Game.uploadSave()` - 上传存档到云端
- `Save.save()` - 保存存档信息到数据库
- `GameActivityService.saveBackupCloud()` - 记录云备份成功
- `GameActivityService.saveUploadFailed()` - 记录上传失败

**调用的服务端请求**：
- `ServerService.business.generateGameSaveSignature()` - 生成 OSS 上传签名
- `OSS` 上传接口 - 上传存档文件到阿里云 OSS

**错误处理**：

| 错误环节 | 可能发生的错误 | 错误处理方式 |
|---------|---------------|-------------|
| 创建 ZIP | 存档路径不存在、文件读取失败 | 抛出 `BaseError`，调用 `onError()` 设置游戏状态为 `GameState.Error` |
| 保存到数据库 | 数据库写入失败 | 抛出错误，由外层捕获 |
| 生成 OSS 签名 | 网络错误、服务端错误 | 抛出 `NetError` 或 `ServerError` |
| 上传文件 | 网络错误、上传失败 | 捕获错误，调用 `GameActivityService.saveUploadFailed()` 记录失败日志，不影响其他流程 |
| 游戏状态为 Error | 任何环节失败 | 跳过备份流程 |

**示例代码**：
```typescript
// game.ts:330-371
async zipSave() {
  try {
    if (this.state_.getValue() === GameState.Error)
      return;

    this.setState(GameState.Saving);
    const zipStream = await this.createSaveZip();
    // ... 创建 ZIP 文件
    const save = new Save(saveDB, this);
    await save.save(false);

    try {
      await this.uploadSave(save);
      await this.gameActivityService_.saveBackupCloud(this.id);
    } catch (error) {
      await this.gameActivityService_.saveUploadFailed(this.id, (error as Error).message);
    }

    this.addSave(save);
  } catch (err) {
    this.onError(err as BaseError);
  }
  this.checkState();
}
```

---

### 4. OSS 文件上传流程

**业务描述**：上传游戏封面、用户头像、游戏存档到阿里云 OSS

**调用的本地处理函数**：
- `OssService.uploadGameCover()` - 上传游戏封面
- `OssService.uploadAvatar()` - 上传用户头像
- `OssService.uploadGameSave()` - 上传游戏存档

**调用的服务端请求**：
- `ServerService.business.generateGameCoverUploadSignature()` - 生成封面上传签名
- `ServerService.business.generateAvatarUploadSignature()` - 生成头像上传签名
- `ServerService.business.generateGameSaveSignature()` - 生成存档上传签名
- `OSS` 上传接口 - 上传文件到 OSS

**错误处理**：

| 错误环节 | 可能发生的错误 | 错误处理方式 |
|---------|---------------|-------------|
| 文件大小检查 | 文件大小超过 1MB | 抛出 `BaseError(ErrorCode.ERR_IMAGE_TOO_LARGE)`，显示错误消息 |
| 生成签名 | 网络错误、服务端错误 | 抛出 `NetError` 或 `ServerError`，由调用方捕获 |
| 上传文件 | 网络错误、OSS 错误 | 抛出错误，由调用方捕获 |
| 连接状态管理 | 请求开始/结束 | 通过 `ConnectionStateService` 管理请求状态 |

**示例代码**：
```typescript
// oss.service.ts:71-89
async uploadAvatar(file: File) {
  if (file.size > 1024 * 1024)
    throw new BaseError(ErrorCode.ERR_IMAGE_TOO_LARGE, 'ERR_IMAGE_TOO_LARGE', {max: '1mb'});

  this.connectionStateService.startRequest();
  try {
    const data = await this.server.business.generateAvatarUploadSignature();
    const name = v4();
    const formData = this.buildFormData({
      name,
      ...data,
      file,
    });
    await fetch(data.host, {method: 'POST', body: formData});
    return data.dir + name;
  } finally {
    this.connectionStateService.endRequest();
  }
}
```

---

### 5. 游戏历史记录同步流程

**业务描述**：同步本地游戏历史记录到服务器，或从服务器获取历史记录

**调用的本地处理函数**：
- `Game.syncGameHistoryToServer()` - 同步历史记录到服务器
- `Game.fetchGameHistoryFromServer()` - 从服务器获取历史记录
- `Game.syncUnsyncedHistory()` - 同步未同步的历史记录

**调用的服务端请求**：
- `ServerService.business.syncGameHistory()` - 同步历史记录到服务器
- `ServerService.business.fetchGameHistory()` - 从服务器获取历史记录

**错误处理**：

| 错误环节 | 可能发生的错误 | 错误处理方式 |
|---------|---------------|-------------|
| 游戏退出后同步 | 网络错误、服务端错误 | 捕获错误，记录到控制台，不阻塞游戏退出流程，历史记录保持未同步状态（synced=0） |
| 登录后同步未同步记录 | 网络错误、服务端错误 | 捕获错误，记录到控制台，未同步记录保持 synced=0 |
| 从服务器获取历史记录 | 网络错误、服务端错误 | 抛出错误，由调用方捕获 |
| WebSocket 通知更新 | 收到历史记录更新通知 | 通过 UUID 检查避免重复，支持增量同步 |

**示例代码**：
```typescript
// game.ts:203-213
try {
  await this.syncGameHistoryToServer([{
    id: historyDB.id,
    gameId: historyDB.gameId,
    host: historyDB.host,
    startTime: historyDB.startTime,
    endTime: historyDB.endTime,
  }]);
} catch (error) {
  console.error('同步游戏历史记录失败:', error);
}
```

---

### 6. WebSocket 通信流程

**业务描述**：通过 WebSocket 与服务端进行实时通信

**调用的本地处理函数**：
- `WebsocketServerService.connect()` - 连接 WebSocket
- `WebsocketServerService.handleDisconnect()` - 处理断开连接
- `WebsocketServerService.scheduleReconnect()` - 安排重连
- `WebsocketServerService.handleResponse()` - 处理响应

**调用的服务端请求**：所有 RPC 请求通过 WebSocket 发送

**错误处理**：

| 错误环节 | 可能发生的错误 | 错误处理方式 |
|---------|---------------|-------------|
| 连接失败 | 网络错误、服务器不可用 | 自动重连，延迟时间：1s → 2s → 5s → 10s |
| 连接断开 | 网络中断、服务器关闭 | 触发 `handleDisconnect()`，清理所有等待中的请求，抛出 `NetError`，触发重连 |
| 请求超时 | 请求超过 10 秒未响应 | `waiter_.wait(1000 * 10)` 超时，抛出 `NetError` |
| 消息解析失败 | JSON 格式错误 | 记录错误到控制台，忽略该消息 |
| 服务端返回错误 | 业务错误、服务器错误 | 根据错误级别转换为 `UserError` 或 `ServerError`，reject promise |
| 登录状态变化 | 断开连接时登出 | 触发 `UserService.disconnectLogout()`，清理用户信息 |

**示例代码**：
```typescript
// websocket-server.service.ts:193-215
private handleResponse(message: IRawResPacket) {
  const rpcId = message.headers['rpc-id'];
  const waiter = this.waiter_.get(rpcId);

  if (!waiter)
    return;

  this.waiter_.remove(rpcId);

  if (message.payload.error) {
    let error: Error | null = null;
    switch (message.payload.error.level) {
      case ErrorLevel.EXPECTED:
        error = new UserError(message.payload.error.code as UserErrorCode, message.payload.error.message);
        break;
      default:
        error = new ServerError(message.payload.error.code);
    }
    waiter.reject(error);
  } else {
    waiter.resolve(message.payload.result);
  }
}
```

---

### 7. 游戏同步流程

**业务描述**：登录后同步服务器游戏列表到本地

**调用的本地处理函数**：
- `GameService.syncGameList()` - 同步游戏列表
- `Game.syncFromServer()` - 同步游戏信息
- `Game.syncSaveList()` - 同步存档列表

**调用的服务端请求**：
- `ServerService.business.fetchUserGame()` - 获取用户游戏列表
- `ServerService.business.fetGameSave()` - 获取游戏存档列表
- `ServerService.business.syncGame()` - 同步游戏信息到服务器

**错误处理**：

| 错误环节 | 可能发生的错误 | 错误处理方式 |
|---------|---------------|-------------|
| 获取游戏列表 | 网络错误、服务端错误 | 抛出 `NetError` 或 `ServerError`，同步失败 |
| 获取存档列表 | 网络错误、服务端错误 | 抛出 `NetError` 或 `ServerError`，存档列表同步失败 |
| 同步游戏信息到服务器 | 网络错误、服务端错误 | 抛出错误，由调用方捕获 |
| 游戏更新通知 | 收到 WebSocket 通知 | 更新本地游戏信息和远程游戏信息 |
| 游戏删除通知 | 收到 WebSocket 通知 | 重新同步游戏列表 |
| 存档更新通知 | 收到 WebSocket 通知 | 更新本地存档信息或创建远程存档 |

**示例代码**：
```typescript
// game.service.ts:136-164
async syncGameList() {
  if (!this.userService.logged.getValue())
    return;

  const list = await this.serverService.business.fetchUserGame();

  const localRemoteGame = this.remoteGames.getValue();
  for (const game of localRemoteGame) {
    if (!list.find(data => data.gameId === game.id))
      this.removeRemoteGame(game);
  }

  for (const data of list) {
    const game = this.getGame(data.gameId);
    if (!game) {
      const remoteGame = this.getRemoteGame(data.gameId);
      if (!remoteGame) {
        const newRemoteGame = new RemoteGame(data, this.serverService);
        this.addRemoteGame(newRemoteGame);
      } else {
        remoteGame.syncFromServer(data);
      }
      continue;
    }

    game.syncFromServer(data);
    game.syncSaveList();
  }
}
```

---

### 8. 存档下载流程

**业务描述**：从云端下载存档到本地

**调用的本地处理函数**：
- `Save.download()` - 下载存档
- `Game.downloadSave()` - 下载存档并应用到游戏

**调用的服务端请求**：
- `ServerService.business.signGameSaveUrl()` - 生成存档下载签名
- `OSS` 下载接口 - 从 OSS 下载文件

**错误处理**：

| 错误环节 | 可能发生的错误 | 错误处理方式 |
|---------|---------------|-------------|
| 获取下载签名 | 网络错误、服务端错误 | 抛出 `NetError` 或 `ServerError`，下载失败 |
| 下载文件 | 网络错误、文件不存在 | 抛出错误，由调用方捕获 |
| 写入本地文件 | 磁盘空间不足、权限不足 | 抛出错误，由调用方捕获 |
| 应用存档 | 解压失败、文件写入失败 | 抛出错误，由调用方捕获 |

**示例代码**：
```typescript
// save.ts:41-53
async download() {
  if (!this.ossPath)
    return;

  const res = await this.game_.serverService.business.signGameSaveUrl({url: this.ossPath});

  await axios.get(res.url, {responseType: 'arraybuffer'})
    .then(async (response) => {
      await mkdirp(this.game.backupSavePath);
      await fs.promises.writeFile(this.filename, Buffer.from(response.data) as any);
    });
  this.deleted_ = false;
}
```

---

### 9. 连接状态管理流程

**业务描述**：管理与服务端的连接状态

**调用的本地处理函数**：
- `ConnectionStateService.startRequest()` - 开始请求
- `ConnectionStateService.endRequest()` - 结束请求
- `ConnectionStateService.setConnectState()` - 设置连接状态

**调用的服务端请求**：无

**错误处理**：

| 错误环节 | 可能发生的错误 | 错误处理方式 |
|---------|---------------|-------------|
| 请求状态管理 | 活跃请求计数 | 跟踪活跃请求数，防止计数为负数 |
| 连接状态更新 | 状态重复更新 | 如果状态未变化，不发送通知 |

**状态转换**：
- `Initial` → `Connecting`：开始连接
- `Connecting` → `OK`：连接成功
- `Connecting` → `Error`：连接失败
- `OK` → `Requesting`：有活跃请求
- `Error` → `Connecting`：重新连接

**示例代码**：
```typescript
// connection-state.service.ts:34-47
startRequest(updateState = true) {
  if (updateState) {
    this.activeRequests_++;
  }
}

endRequest(updateState = true) {
  if (updateState) {
    this.activeRequests_--;
    if (this.activeRequests_ < 0) {
      this.activeRequests_ = 0;
    }
  }
}
```

---

## 全局错误处理

### ErrorHandlerService

- **位置**：`src/app/service/error-handler.service.ts`
- **作用**：实现 Angular 的 `ErrorHandler` 接口
- **处理方式**：
  - 如果错误是 `BaseError` 实例，显示 `showMessage` 属性
  - 否则，不显示错误（注释掉）
  - 通过 `NzMessageService.error()` 显示错误消息

**示例代码**：
```typescript
public handle(err: Error) {
  if (err instanceof BaseError) {
    this.message.error(err.showMessage);
  } else {
    // this.message.error(err.message);
  }
}
```

---

## 错误处理最佳实践

1. **优先使用 .catch() 而不是 try-catch**
   - 异步函数调用优先使用 `.catch()` 捕获错误
   - 代码更简洁，符合异步编程的链式调用风格
   - 避免过多的 try-catch 嵌套
   - 只在 async 函数内部或需要共享上下文时使用 try-catch

2. **在调用入口处区分错误处理方式**
   - 玩家主动操作：调用 `ErrorHandlingUtil.handleManualError(err, title)`
   - 自动操作：调用 `ErrorHandlingUtil.handleAutoError(err, title)`
   - 不在错误类型中添加触发方式的属性

3. **使用正确的错误类型**
   - 用户输入错误使用 `UserError`
   - 服务端错误使用 `ServerError`
   - 网络错误使用 `NetError`
   - 本地业务错误使用 `BaseError`

4. **显示用户友好的错误消息**
   - 使用 `ErrorString` 定义错误消息
   - 支持参数化的错误消息
   - 避免显示技术细节
   - 提供清晰的错误标题和描述

5. **记录错误日志**
   - 使用 `console.error()` 记录错误
   - 在关键环节记录错误上下文

6. **错误恢复机制**
   - WebSocket 自动重连
   - 未同步记录保留待下次同步
   - 不影响其他流程的错误处理

7. **连接状态管理**
   - 使用 `ConnectionStateService` 管理连接状态
   - 在请求开始时调用 `startRequest()`
   - 在请求结束时调用 `endRequest()`
   - 使用 `finally` 确保状态正确

8. **代码风格示例**

### .catch() 优先（推荐）

```typescript
// 推荐：使用 .catch()
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
```

### try-catch（必要时使用）

```typescript
// 如果是 async 函数内部且需要共享上下文，可以使用 try-catch
async submitRegisterForm() {
  if (!this.registerForm.valid)
    return;

  try {
    const result = await this.server.auth.register(this.registerForm.value as IReqRegister);
    // 可以在这里使用 result
    this.messageService.success('注册成功');
    this.mode = 0;
  } catch (err) {
    this.errorHandlingUtil.handleManualError(err, '注册失败');
  }
}
```

### RxJS Observable 的错误处理

```typescript
// RxJS 使用 catchError 操作符
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

---

## 全局错误处理

### ErrorHandlerService

- **位置**：`src/app/service/error-handler.service.ts`
- **作用**：实现 Angular 的 `ErrorHandler` 接口
- **处理方式**：
  - 如果错误是 `BaseError` 实例，显示 `showMessage` 属性
  - 否则，不显示错误（注释掉）
  - 通过 `NzMessageService.error()` 显示错误消息
- **用途**：作为全局错误兜底，处理未捕获的错误

**示例代码**：
```typescript
public handle(err: Error) {
  if (err instanceof BaseError) {
    this.message.error(err.showMessage);
  } else {
    // this.message.error(err.message);
  }
}
```

---

## 错误处理工具类详解

### ErrorHandlingUtil

#### handleManualError

用于处理玩家主动操作的错误。

**特点**：
- 使用 `NzNotificationService.create('error', ...)` 显示错误
- 提示不会自动消失（`nzDuration: 0`）
- 支持自定义标题
- 只在应用内显示

**使用场景**：
- 用户登录/注册
- 游戏导入
- 存档管理（上传、下载、删除）
- 昵称修改
- 游戏设置修改

#### handleAutoError

用于处理自动操作的错误。

**特点**：
- 使用 `NzNotificationService.create('error', ...)` 显示错误
- 提示不会自动消失（`nzDuration: 0`）
- 支持自定义标题
- 同时调用 Windows 系统通知
- 5 秒内相同错误只通知一次（去重）

**使用场景**：
- 游戏退出时自动备份存档
- 自动同步游戏历史记录
- 其他后台自动执行的任务

---

## 总结

Whitecloud Client 项目的错误处理机制具有以下特点：

1. **清晰的错误类型分类**：使用继承体系区分不同类型的错误
2. **统一的错误处理接口**：通过 `ErrorHandlingUtil` 提供统一的错误处理方法
3. **区分化的错误提示方式**：根据操作类型选择不同的提示方式
4. **完善的错误码体系**：本地错误码和服务端错误码分开定义
5. **友好的错误消息**：使用参数化的错误消息，支持国际化
6. **自动恢复机制**：WebSocket 自动重连，未同步记录保留
7. **连接状态管理**：集中管理连接状态，提升用户体验
8. **系统级通知支持**：自动操作错误通过系统通知，即使应用最小化也能感知
9. **.catch() 优先的代码风格**：推荐使用 `.catch()` 而不是 try-catch，代码更简洁

各个业务流程都遵循了统一的错误处理模式，确保在发生错误时能够及时捕获、显示和恢复，提升应用的稳定性和用户体验。

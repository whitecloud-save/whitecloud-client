## 上下文

当前项目的错误处理使用 `NzMessageService` 显示错误消息，存在以下问题：

1. **消息不够持久**：`NzMessageService` 提示默认 3 秒后自动消失，玩家可能错过重要错误信息
2. **自动操作错误容易被忽略**：游戏退出时自动备份存档失败，如果玩家已经关闭游戏，无法感知到备份失败
3. **缺少系统级通知**：应用最小化到托盘时，所有错误都无法被用户感知

## 约束

- **技术约束**：必须使用 Angular 17 和 Electron 30
- **UI 约束**：继续使用 ng-zorro-antd 组件库
- **用户体验**：不能过度打扰用户，但重要错误必须可见
- **平台兼容**：Windows 系统通知需要适配 Windows 10/11

## 目标 / 非目标

### 目标
- 区分玩家主动操作和自动操作的错误提示方式
- 玩家主动操作错误使用持久化的 Notification 提示
- 自动操作错误使用 Notification + Windows 系统通知
- 确保关键错误在应用最小化时也能被感知
- 提供清晰的错误处理接口和工具

### 非目标
- 修改现有的错误类型体系（继续使用 BaseError 及其子类）
- 改变错误的传播和处理流程（仅在提示方式上做区分）

## 决策

### 决策 1：使用 NzNotificationService 替代 NzMessageService

**理由**：
- `NzNotificationService` 支持手动关闭，提示更持久
- 可以显示更多上下文信息（标题、描述、图标）
- 更适合显示重要的错误信息

**考虑的替代方案**：
- **方案 A**：继续使用 `NzMessageService`，增加显示时长
  - 优点：改动小
  - 缺点：仍然不够持久，用户可能错过
- **方案 B**：使用自定义 Modal 对话框
  - 优点：最突出
  - 缺点：过于打扰用户体验，影响操作流程

**决策**：采用 NzNotificationService

### 决策 2：优先使用 .catch() 而不是 try-catch

**理由**：
- `.catch()` 更符合异步编程的链式调用风格
- 避免过多的 try-catch 嵌套，代码更简洁
- 更容易在 Promise 链中传递错误
- TypeScript 对 Promise 类型推断支持更好

**使用场景**：
- **使用 `.catch()`**：异步函数调用、Promise 链
- **使用 `try-catch`**：包含多个异步操作且需要共享上下文、async 函数内部

**代码示例对比**：

```typescript
// 不推荐：使用 try-catch（嵌套过多）
async submitRegisterForm() {
  try {
    await this.server.auth.register(this.registerForm.value);
    this.messageService.success('注册成功');
    this.mode = 0;
  } catch (err) {
    this.errorHandlingUtil.handleManualError(err, '注册失败');
  }
}

// 推荐：使用 .catch()（代码更简洁）
submitRegisterForm() {
  this.server.auth.register(this.registerForm.value)
    .then(() => {
      this.messageService.success('注册成功');
      this.mode = 0;
    })
    .catch((err) => {
      this.errorHandlingUtil.handleManualError(err, '注册失败');
    });
}
```

**决策**：在处理 Promise 错误时，优先使用 `.catch()`，仅在必要时使用 try-catch

### 决策 3：在调用入口处区分错误处理方式

**理由**：
- 错误类型本身不应该关心它是如何被触发的
- 根据关注点分离原则，错误应该只描述"什么错了"，而不是"怎么引起的"
- 在业务逻辑的调用点根据上下文决定如何处理错误更灵活
- 同一个错误在不同场景下可以用不同方式处理

**实现方式**：
- BaseError 及其子类保持不变，不添加 trigger 属性
- 创建 `ErrorHandlingUtil` 工具类，提供统一错误处理接口
- 在用户交互入口（按钮点击、表单提交等）调用 `handleManualError`
- 在自动流程入口（游戏退出、定时任务等）调用 `handleAutoError`
- 工具类内部决定使用 NzNotificationService 还是系统通知

### 决策 4：使用 Electron Notification API 实现系统通知

**理由**：
- Electron 提供了跨平台的 Notification API
- 原生系统通知体验更好
- 支持在应用最小化或关闭时显示

**考虑的替代方案**：
- **方案 A**：使用第三方库（如 node-notifier）
  - 优点：功能更丰富
  - 缺点：增加依赖，维护成本高
- **方案 B**：通过 Electron Main Process 调用原生 Windows API
  - 优点：更底层控制
  - 缺点：增加复杂度，难以维护

**决策**：使用 Electron 原生 Notification API

### 决策 5：通过 IPC 通信显示系统通知

**理由**：
- Electron 的 Notification API 必须在主进程中调用
- 通过 IPC 可以从渲染进程触发系统通知
- 统一的错误处理服务在渲染进程，需要通过 IPC 调用主进程

**实现方式**：
- 在 `electron.ts` 主进程中注册 `show-system-notification` IPC 处理器
- 渲染进程通过 `ipcRenderer.invoke()` 调用
- 传递标题、消息、图标等参数

## 技术实现

### 1. Electron 系统通知实现

```typescript
// electron.ts 主进程
ipcMain.handle('show-system-notification', async (event, options) => {
  const notification = new Notification({
    title: options.title,
    body: options.message,
    icon: options.icon,
  });
  notification.show();
});
```

### 3. 使用示例

#### 玩家主动操作的错误处理（在组件中）

```typescript
// user-login-register.component.ts - 推荐：使用 .catch()
submitRegisterForm() {
  if (!this.registerForm.valid)
    return;

  this.server.auth.register(this.registerForm.value as IReqRegister)
    .then(() => {
      this.messageService.success('注册成功');
      this.mode = 0;
    })
    .catch((err) => {
      // 使用 ErrorHandlingUtil 处理手动操作错误
      this.errorHandlingUtil.handleManualError(err, '注册失败');
    });
}

// 如果是 async 函数内部且需要共享上下文，也可以使用 try-catch
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

#### 自动操作的错误处理（在服务或组件中）

```typescript
// game.ts - 推荐：使用 .catch()
onGameProcessExit() {
  this.zipSave()
    .then(() => {
      // ... 其他逻辑
    })
    .catch((err) => {
      // 使用 ErrorHandlingUtil 处理自动操作错误
      this.errorHandlingUtil.handleAutoError(err, '存档备份失败');
    });
}

// 如果需要 await 结果且共享上下文，可以使用 try-catch
async onGameProcessExit() {
  try {
    await this.zipSave();
    // ... 其他逻辑，可以使用 await 的结果
  } catch (err) {
    this.errorHandlingUtil.handleAutoError(err, '存档备份失败');
  }
}
```

#### RxJS Observable 的错误处理

```typescript
// RxJS 使用 catchError 操作符
this.serverService.business.fetchUserGame()
  .pipe(
    catchError((err) => {
      this.errorHandlingUtil.handleManualError(err, '获取游戏列表失败');
      return EMPTY; // 或返回默认值
    })
  )
  .subscribe((games) => {
    // 处理结果
  });
```

#### 自动操作的错误处理（在服务或组件中）

```typescript
// game.ts - 推荐：使用 .catch()
onGameProcessExit() {
  this.zipSave()
    .then(() => {
      // ... 其他逻辑
    })
    .catch((err) => {
      // 使用 ErrorHandlingUtil 处理自动操作错误
      this.errorHandlingUtil.handleAutoError(err, '存档备份失败');
    });
}

// 如果需要 await 结果且共享上下文，可以使用 try-catch
async onGameProcessExit() {
  try {
    await this.zipSave();
    // ... 其他逻辑，可以使用 await 的结果
  } catch (err) {
    this.errorHandlingUtil.handleAutoError(err, '存档备份失败');
  }
}
```

#### RxJS Observable 的错误处理

```typescript
// RxJS 使用 catchError 操作符
this.serverService.business.fetchUserGame()
  .pipe(
    catchError((err) => {
      this.errorHandlingUtil.handleManualError(err, '获取游戏列表失败');
      return EMPTY; // 或返回默认值
    })
  )
  .subscribe((games) => {
    // 处理结果
  });
```

#### 玩家主动操作的错误处理（在组件中）

```typescript
// user-login-register.component.ts
async submitRegisterForm() {
  if (!this.registerForm.valid)
    return;

  try {
    await this.server.auth.register(this.registerForm.value as IReqRegister);
    this.messageService.success('注册成功');
    this.mode = 0;
  } catch (err) {
    // 使用 ErrorHandlingUtil 处理手动操作错误
    this.errorHandlingUtil.handleManualError(err, '注册失败');
  }
}
```

#### 自动操作的错误处理（在服务或组件中）

```typescript
// game.ts - 游戏退出时自动备份
async onGameProcessExit() {
  try {
    await this.zipSave();
    // ... 其他逻辑
  } catch (err) {
    // 使用 ErrorHandlingUtil 处理自动操作错误
    this.errorHandlingUtil.handleAutoError(err, '存档备份失败');
  }
}
```

## 风险 / 权衡

### 风险 1：需要逐个修改现有错误处理代码

**风险**：所有使用 try-catch 捕获错误的地方都需要更新为使用 `ErrorHandlingUtil`
**缓解措施**：
- 提供清晰的迁移指南和示例
- 优先修改玩家主动操作的错误处理（影响用户体验的）
- 自动操作的错误处理可以逐步迁移
- 提供代码检查工具，识别需要更新的地方

### 风险 2：开发者习惯问题

**风险**：开发者可能习惯性地使用 try-catch，而不是 `.catch()`
**缓解措施**：
- 在代码审查时强调使用 `.catch()` 优先
- 提供 ESLint 规则或 Prettier 配置，推荐 `.catch()` 风格
- 在文档和注释中提供清晰的代码示例
- 在代码模板和脚手架中使用 `.catch()` 模式

### 风险 3：系统通知可能被系统设置禁用

**风险**：Windows 系统通知可能被用户或组策略禁用
**缓解措施**：
- 捕获 Notification API 异常，不影响应用内提示
- 在设置中提供"启用系统通知"选项，用户可选择

### 风险 3：频繁的系统通知可能打扰用户

**风险**：如果自动操作频繁失败，可能导致大量系统通知
**缓解措施**：
- 对同类错误进行去重处理（例如 5 分钟内相同错误只通知一次）
- 在设置中提供"系统通知频率"选项
- 对于可恢复的错误，降低通知频率

### 风险 4：跨平台兼容性

**风险**：Electron Notification API 在不同平台上表现不一致
**缓解措施**：
- 主要针对 Windows 平台优化
- 提供平台检测，仅在支持的平台上启用系统通知
- 在非 Windows 平台上仅使用应用内通知

## 迁移计划

### 阶段 1：基础设施（1-2 天）
1. 创建 Electron 系统通知 IPC 处理器
2. 创建 ErrorHandlingUtil 工具类
3. 编写单元测试

### 阶段 2：逐步迁移（3-5 天）
1. 优先迁移玩家主动操作的错误
   - 用户登录/注册
   - 游戏导入
   - 存档管理
2. 然后迁移自动操作的错误
   - 游戏退出备份
   - 自动同步
3. 每个模块迁移后进行测试

### 阶段 3：验证和优化（1-2 天）
1. 全面测试错误提示功能
2. 优化通知频率和去重逻辑
3. 更新文档
4. 代码审查

### 回滚计划
如果新实现出现问题，可以回滚到原有的 `NzMessageService` 实现：
1. 移除 ErrorHandlingUtil
2. 移除 Electron 系统通知 IPC 处理器
3. 恢复原有的错误处理逻辑

## 待决问题

1. **错误分类标准**：如何准确定义哪些错误属于"自动操作"？
   - 需要与产品确认完整的自动操作列表
   - 是否需要在配置文件中维护这个列表？

2. **通知频率控制**：是否需要对相同错误的通知频率进行限制？
   - 如果需要，采用什么去重策略？
   - 去重的时间窗口设置为多久？

3. **系统通知内容**：系统通知应该显示多少详细信息？
   - 是否需要包含游戏名称、操作类型等上下文？
   - 是否需要提供快捷操作按钮（如"查看详情"）？

4. **用户设置**：是否需要提供用户自定义通知设置的界面？
   - 允许用户禁用系统通知
   - 允许用户调整通知频率

5. **.catch() vs try-catch 规范**：如何在团队中推广 `.catch()` 优先的使用规范？
   - 是否需要编写 ESLint 规则？
   - 是否需要在代码审查检查清单中添加相关项？

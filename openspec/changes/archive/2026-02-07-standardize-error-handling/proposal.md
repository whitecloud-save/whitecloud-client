# 变更：标准化错误提示方式

## 为什么

当前项目的错误处理使用 `NzMessageService` 进行消息提示，但这不适合所有场景：
1. 玩家主动操作（如登录、注册、上传等）的错误消息不够突出，容易忽略
2. 自动操作（如游戏退出时备份存档）的错误可能被用户忽略，导致数据丢失风险
3. 缺少 Windows 系统级别的提示，即使应用最小化到托盘时也能感知到错误

## 变更内容

- **重大变更**：将错误提示分为两类，分别在调用入口处选择不同的提示方式
- 玩家主动操作的错误：在按钮点击回调等用户交互入口，使用 `NzNotificationService` 替代 `NzMessageService`
- 自动操作的错误：在自动流程的调用入口，使用 `NzNotificationService` + Electron Windows 系统通知
- 添加 Electron 系统通知 IPC 处理器
- 创建 `ErrorHandlingUtil` 工具类，提供 `handleManualError` 和 `handleAutoError` 方法
- 错误类型（BaseError）保持不变，不区分触发方式

## 影响

- 受影响规范：
  - `error-handling`（新增规范）
- 受影响代码：
  - `src/app/service/error-handler.service.ts` - 核心错误处理逻辑
  - `src/electron.ts` - Electron 主进程系统通知
  - 所有调用 `message.error()` 的组件和服务
  - 游戏退出自动备份流程

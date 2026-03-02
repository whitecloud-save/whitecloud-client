# workerAPI 规范增量（最终版 v2）

## ADDED Requirements

### Requirement: Handler 职责分离

系统 MUST 将 Handler 拆分为 WorkerHandler 和 MainHandler，职责清晰。

#### Scenario: WorkerHandler 职责

- **当** WorkerHandler 处理请求时
- **那么** MUST 处理所有底层操作（文件、ZIP、哈希、数据库、进程、Shell、图标、更新、路径）
- **并且** MUST 运行在 worker 进程
- **并且** MUST NOT 依赖 Electron UI API

#### Scenario: MainHandler 职责

- **当** MainHandler 处理请求时
- **那么** MUST 仅处理 Electron UI 特有功能（对话框、应用 API、窗口管理）
- **并且** MUST 运行在 Electron 主进程

---

### Requirement: Handler 组织方式

系统 MUST 将 WorkerHandler 拆分为多个文件，通过 `MessageRoute.callback` 路由。

#### Scenario: WorkerHandler 文件结构

- **当** 组织 WorkerHandler 代码时
- **那么** MUST 拆分为 9 个独立文件：
  - `worker-fs-handler.ts` - 文件系统
  - `worker-zip-handler.ts` - ZIP 压缩
  - `worker-crypto-handler.ts` - 哈希计算
  - `worker-database-handler.ts` - 数据库
  - `worker-process-handler.ts` - 进程管理
  - `worker-shell-handler.ts` - Shell 操作
  - `worker-icon-handler.ts` - 图标提取
  - `worker-update-handler.ts` - 更新管理
  - `worker-path-handler.ts` - 路径处理

#### Scenario: MessageRoute.callback 实现

- **当** 在 `worker.ts` 中初始化 Handler 时
- **那么** MUST 使用 `MessageRoute.callback` 配置 service 到 Handler 的映射
- **并且** MUST 从请求包的 `service` 字段获取服务名
- **并且** MUST 查找对应的 Handler 实例
- **并且** MUST 使用 `Route.callback` 处理单个 Handler

---

### Requirement: API 设计原则 - 直接传路径

系统 MUST 采用直接传路径的设计，而不是传业务 ID 后再查询数据库。

#### Scenario: 直接传路径

- **当** 调用 API 时
- **那么** MUST 直接传递文件路径或目录路径
- **而不是** 传递 gameId、saveId 等业务 ID
- **并且** Handler MUST NOT 从数据库查询路径信息

---

### Requirement: 命名空间访问

系统 MUST 支持命名空间格式的 API 调用。

#### Scenario: WorkerAPI 命名空间

- **当** Angular 调用 WorkerAPI 时
- **那么** MUST 支持命名空间访问（如 `workerAPI.fs.exists()`）
- **并且** 方法名 MUST 直接使用（不带前缀，如 `exists` 而不是 `fs_exists`）
- **并且** `service` 字段 MUST 封装在请求包中（如 'fs'、'zip'、'db'）
- **并且** 支持的命名空间：fs、zip、crypto、db、process、shell、icon、update、path

#### Scenario: MainAPI 命名空间

- **当** Angular 调用 MainAPI 时
- **那么** MUST 支持命名空间访问（如 `mainAPI.dialog.showOpenFileDialog()`）
- **并且** 方法名 MUST 直接使用（不带前缀）
- **并且** 支持的命名空间：dialog、app、window

#### Scenario: Client.createApi 实现

- **当** 调用 `client_.createApi<Handler>('service')` 时
- **那么** MUST 接受 `service` 参数
- **并且** MUST 将 `service` 写入请求包的 `service` 字段
- **并且** MUST 返回类型安全的 API 对象

---

### Requirement: WorkerHandler 文件系统 API

系统 MUST 提供文件系统操作 API。

#### Scenario: 读取文件

- **当** 调用 `readFile(path)` 时
- **那么** MUST 返回文件内容作为 Buffer

#### Scenario: 写入文件

- **当** 调用 `writeFile({path, data})` 时
- **那么** MUST 将数据写入文件
- **如果** 目录不存在且 recursive=true MUST 创建目录

#### Scenario: 递归读取目录

- **当** 调用 `readdirRecursive(path)` 时
- **那么** MUST 递归读取所有文件和子目录
- **并且** MUST 返回相对路径列表
- **并且** MUST 使用 POSIX 路径格式

#### Scenario: 检查文件存在

- **当** 调用 `exists(path)` 时
- **那么** MUST 返回 true（存在）或 false（不存在）
- **而不是** 抛出错误

#### Scenario: 创建目录

- **当** 调用 `mkdir({path, options})` 时
- **那么** MUST 创建目录
- **如果** options.recursive=true MUST 递归创建父目录

#### Scenario: 删除目录

- **当** 调用 `deleteDir({path, options})` 时
- **那么** MUST 删除目录
- **如果** options.recursive=true MUST 递归删除子目录和文件

---

### Requirement: WorkerHandler ZIP 压缩 API

系统 MUST 提供 ZIP 压缩和解压 API。

#### Scenario: 从目录创建 ZIP

- **当** 调用 `createZipFromDirectory({dirPath, zipPath})` 时
- **那么** MUST 递归读取目录所有文件
- **并且** MUST 使用文件流读取文件（避免一次性加载到内存）
- **并且** MUST 创建 ZIP 文件
- **并且** MUST 直接写入 zipPath 指定的路径
- **并且** MUST NOT 返回 Buffer（减少内存占用）

#### Scenario: 解压 ZIP 文件

- **当** 调用 `extractZip({zipFilePath, targetPath})` 时
- **那么** MUST 从 zipFilePath 读取 ZIP 文件
- **并且** MUST 解压到 targetPath
- **并且** MUST 保持目录结构

---

### Requirement: WorkerHandler 哈希 API

系统 MUST 提供哈希计算 API。

#### Scenario: 计算文件哈希

- **当** 调用 `calculateFileHash(filePath)` 时
- **那么** MUST 读取文件内容
- **并且** MUST 计算 SHA1 哈希
- **并且** MUST 返回哈希值（前 10 位）

#### Scenario: 计算目录哈希

- **当** 调用 `calculateDirectoryHash(dirPath)` 时
- **那么** MUST 递归读取所有文件
- **并且** MUST 按文件名排序
- **并且** MUST 计算包含文件路径和内容的 SHA1 哈希
- **并且** MUST 返回哈希值（前 10 位）

#### Scenario: 计算目录大小

- **当** 调用 `calculateDirectorySize(dirPath)` 时
- **那么** MUST 统计所有文件大小
- **并且** MUST 返回总大小（未压缩）

#### Scenario: 创建哈希

- **当** 调用 `createHash({algorithm, data})` 时
- **那么** MUST 使用指定的算法计算哈希
- **并且** MUST 返回哈希值

---

### Requirement: WorkerHandler 数据库 API

系统 MUST 提供数据库 CRUD 操作 API。

#### Scenario: 保存游戏

- **当** 调用 `saveGame(game)` 时
- **那么** MUST 保存或更新游戏实体
- **并且** MUST 返回保存后的实体

#### Scenario: 查找游戏

- **当** 调用 `findGame(gameId)` 时
- **那么** MUST 从数据库查找游戏
- **并且** MUST 返回游戏实体或 null

#### Scenario: 保存存档

- **当** 调用 `saveSave(save)` 时
- **那么** MUST 保存或更新存档实体

#### Scenario: 查找游戏的存档

- **当** 调用 `findSaves(gameId)` 时
- **那么** MUST 返回该游戏的所有存档
- **并且** MUST 按创建时间倒序排列

---

### Requirement: WorkerHandler 进程管理 API

系统 MUST 提供进程启动 API。

#### Scenario: 启动游戏

- **当** 调用 `startGame({exePath, cwd})` 时
- **那么** MUST 启动游戏进程
- **并且** MUST 设置工作目录
- **并且** MUST 在独立进程中运行（detached）

#### Scenario: 使用 LE 启动游戏

- **当** 调用 `startGameWithLE({lePath, profile, exePath})` 时
- **那么** MUST 使用 Locale Emulator 启动游戏
- **并且** MUST 传递指定的配置文件

---

### Requirement: WorkerHandler Shell 操作 API

系统 MUST 提供 Shell 操作 API。

#### Scenario: 打开路径

- **当** 调用 `openPath(path)` 时
- **那么** MUST 在文件管理器中打开路径

#### Scenario: 打开外部链接

- **当** 调用 `openExternal(url)` 时
- **那么** MUST 在默认浏览器中打开链接

---

### Requirement: WorkerHandler 图标提取 API

系统 MUST 提供图标提取 API。

#### Scenario: 提取文件图标

- **当** 调用 `extractFileIcon({exePath, size})` 时
- **那么** MUST 提取可执行文件图标
- **并且** MUST 返回图标 Buffer

---

### Requirement: WorkerHandler 更新管理 API

系统 MUST 提供应用更新 API。

#### Scenario: 重启并安装更新

- **当** 调用 `quitAndInstall()` 时
- **那么** MUST 退出应用并安装更新

#### Scenario: 下载更新

- **当** 调用 `downloadUpdate({url, destPath, options})` 时
- **那么** MUST 下载文件到指定路径
- **并且** MUST 支持进度回调
- **如果** 提供了 expectedHash MUST 验证哈希

#### Scenario: 验证文件哈希

- **当** 调用 `verifyFileHash({filePath, expectedHash})` 时
- **那么** MUST 计算文件哈希
- **并且** MUST 与预期哈希比较
- **并且** MUST 返回验证结果

---

### Requirement: WorkerHandler 路径处理 API

系统 MUST 提供路径处理 API。

#### Scenario: 路径拼接

- **当** 调用 `join({paths})` 时
- **那么** MUST 返回拼接后的路径

#### Scenario: 游戏路径编码

- **当** 调用 `encodeGamePath({dirPath, rootPath})` 时
- **那么** MUST 将路径中的游戏根目录、appData、userData 替换为标记
- **并且** MUST 返回编码后的路径

#### Scenario: 游戏路径解码

- **当** 调用 `decodeGamePath({dirPath, rootPath})` 时
- **那么** MUST 将路径中的标记替换为实际路径
- **并且** MUST 返回解码后的路径

---

### Requirement: MainHandler 对话框 API

系统 MUST 提供原生对话框 API。

#### Scenario: 显示文件选择对话框

- **当** 调用 `showOpenFileDialog(options)` 时
- **那么** MUST 显示文件选择对话框
- **并且** MUST 支持设置标题、默认路径、文件过滤器
- **并且** MUST 返回用户选择的文件路径或取消状态

#### Scenario: 显示目录选择对话框

- **当** 调用 `showOpenDirectoryDialog(options)` 时
- **那么** MUST 显示目录选择对话框
- **并且** MUST 返回用户选择的目录路径或取消状态

---

### Requirement: MainHandler 应用 API

系统 MUST 提供应用管理 API。

#### Scenario: 获取版本

- **当** 调用 `getVersion()` 时
- **那么** MUST 返回应用版本号

#### Scenario: 获取开机启动设置

- **当** 调用 `getLoginItemSettings()` 时
- **那么** MUST 返回当前开机启动设置

#### Scenario: 设置开机启动

- **当** 调用 `setLoginItemSettings(settings)` 时
- **那么** MUST 更新开机启动设置

---

### Requirement: MainHandler 窗口管理 API

系统 MUST 提供窗口管理 API。

#### Scenario: 创建游戏攻略窗口

- **当** 调用 `createGameGuideWindow(gameId, title)` 时
- **那么** MUST 创建攻略窗口
- **并且** MUST 返回窗口 ID

#### Scenario: 关闭游戏攻略窗口

- **当** 调用 `closeGameGuideWindow(windowId)` 时
- **那么** MUST 关闭指定窗口

---

### Requirement: Angular 单例模式

系统 MUST 使用单例模式封装 API，而不是 Angular Service。

#### Scenario: WorkerAPI 单例

- **当** 需要访问 WorkerAPI 时
- **那么** MUST 通过 `WorkerAPI.getInstance()` 获取单例
- **而不是** 通过 Angular 依赖注入
- **并且** MUST 使用 `this.client_.createApi<Handler>('service')` 创建命名空间 API

#### Scenario: MainAPI 单例

- **当** 需要访问 MainAPI 时
- **那么** MUST 通过 `MainAPI.getInstance()` 获取单例
- **而不是** 通过 Angular 依赖注入

#### Scenario: 单例重置

- **当** 进行单元测试时
- **那么** MUST 通过 `WorkerAPI.resetInstance()` 重置单例
- **并且** MUST 通过 `MainAPI.resetInstance()` 重置单例

#### Scenario: Client.createApi 实现

- **当** 调用 `createApi<Handler>(service)` 时
- **那么** MUST 接受 `service` 参数
- **并且** MUST 将 `service` 写入请求包的 `service` 字段
- **并且** MUST 返回类型安全的 API 对象
- **并且** API 方法 MUST 直接使用方法名（不带前缀）

---

### Requirement: 数据库实体共享

系统 MUST 将数据库实体提取到 shared 目录。

#### Scenario: 共享实体定义

- **当** 定义数据库实体时
- **那么** MUST 放在 `src/shared/database/` 目录
- **并且** Angular 和 Electron MUST 通过相对路径导入

#### Scenario: 实体目录结构

- **当** 组织数据库实体时
- **那么** MUST 按以下结构组织：
  - `src/shared/database/game.ts` - LocalGameDB
  - `src/shared/database/save.ts` - SaveDB
  - `src/shared/database/game-history.ts` - GameHistoryDB
  - `src/shared/database/game-guide.ts` - GameGuideDB
  - `src/shared/database/game-activity.ts` - GameActivityDB

---

### Requirement: 数据库迁移策略

系统 MUST 一步到位迁移数据库操作。

#### Scenario: 数据库访问迁移

- **当** 迁移数据库操作时
- **那么** MUST 将所有数据库读写迁移到 WorkerHandler
- **并且** MUST 一步到位完成迁移
- **而不是** 采用渐进式迁移

#### Scenario: 业务逻辑保持

- **当** 迁移数据库访问时
- **那么** MUST NOT 迁移业务逻辑
- **并且** MUST 仅迁移数据访问层（CRUD 操作）

---

### Requirement: 同步操作处理

系统 MUST 正确处理需要同步返回的操作。

#### Scenario: 表单验证器保留

- **当** 实现表单验证器时（如 `GameValidators.folder`、`GameValidators.file`）
- **那么** MUST 保留在渲染进程
- **并且** MUST 直接使用 `fs.statSync` 等同步 API
- **原因**: RPC 架构不支持同步操作，表单验证需要同步返回

#### Scenario: RPC 不支持同步

- **当** 通过 RPC 调用 Handler 方法时
- **那么** MUST 使用异步调用（async/await）
- **并且** MUST NOT 提供同步 API

---

### Requirement: RPC 参数限制

系统 MUST 遵循 RPC 架构的参数限制。

#### Scenario: 单一参数对象

- **当** 定义 Handler 方法时
- **那么** MUST 只接受一个参数对象
- **并且** 可变参数 MUST 改为对象属性（如 `join({paths: string[]})`）

#### Scenario: 多参数方法

- **当** 方法需要多个参数时
- **那么** MUST 封装为对象（如 `encodeGamePath({dirPath, rootPath})`）

---

### Requirement: 渲染进程完全隔离

系统 MUST 确保渲染进程内不保留任何 Node 模块调用。

#### Scenario: 禁止 Node 模块导入

- **当** 在渲染进程代码中编写代码时
- **那么** MUST NOT 导入任何 Node 模块（fs、path、crypto、os、child_process 等）
- **并且** MUST 通过 WorkerAPI 或 MainAPI 访问所有底层功能

#### Scenario: 异步验证器

- **当** 实现表单验证器时
- **那么** MUST 使用异步验证器（返回 `Promise<ValidationErrors | null>`）
- **并且** MUST 通过 WorkerAPI 调用文件系统 API
- **并且** MUST NOT 直接使用 `fs.statSync` 等同步 API

---

### Requirement: 通信方式

系统 MUST 为不同的 Handler 提供适当的通信方式。

#### Scenario: WorkerHandler 通信

- **当** Angular 调用 WorkerHandler 时
- **那么** MUST 通过 workerChannel（MessagePort）通信
- **并且** MUST 使用 `const client = new Client(window.workerChannel); const api = client.createApi<WorkerHandler>();`

#### Scenario: MainHandler 通信

- **当** Angular 调用 MainHandler 时
- **那么** MUST 通过 IPC 通信
- **并且** MUST 使用 `ipcRenderer.invoke('mainAPI', method, ...args)`

---

### Requirement: 类型安全

系统 MUST 提供完整的 TypeScript 类型定义。

#### Scenario: Handler 类型定义

- **当** 定义 Handler 类时
- **那么** MUST 使用 `@Route.method` 装饰器
- **并且** MUST 提供完整的方法签名和返回类型

#### Scenario: Angular API 类型安全

- **当** Angular 调用 API 时
- **那么** MUST 通过 `client.createApi<Handler>()` 获取类型安全的 API
- **并且** MUST 有完整的类型推断

---

### Requirement: 性能优化

系统 MUST 通过合理的 API 设计减少通信次数和数据库查询。

#### Scenario: 减少通信次数

- **当** 执行复杂操作时
- **那么** MUST 在一个 Handler 方法中完成
- **而不是** 多次调用底层 API

#### Scenario: 直接传路径优化

- **当** 调用 API 时
- **那么** MUST 直接传路径（调用方已有路径信息）
- **而不是** 传 ID 后再查询数据库

---

### Requirement: 错误处理

系统 MUST 提供统一的错误处理机制。

#### Scenario: Handler 方法错误处理

- **当** Handler 方法执行失败时
- **那么** MUST 捕获错误
- **并且** MUST 通过通信通道返回错误信息
- **并且** Angular MUST 收到错误并抛出适当的异常

#### Scenario: 业务逻辑错误

- **当** 业务逻辑失败时（如文件不存在、权限不足）
- **那么** MUST 抛出包含清晰错误信息的异常
- **并且** MUST 包含错误码和上下文信息

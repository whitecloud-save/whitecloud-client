# 任务清单：Angular 模块 Node API 隔离（最终版 v2）

## 1. 基础设施搭建

- [ ] 1.1 提取数据库实体到 shared 目录
  - [ ] 1.1.1 创建 `src/shared/database/` 目录
  - [ ] 1.1.2 提取 `LocalGameDB` 到 `src/shared/database/game.ts`
  - [ ] 1.1.3 提取 `SaveDB` 到 `src/shared/database/save.ts`
  - [ ] 1.1.4 提取 `GameHistoryDB` 到 `src/shared/database/game-history.ts`
  - [ ] 1.1.5 提取 `GameGuideDB` 到 `src/shared/database/game-guide.ts`
  - [ ] 1.1.6 提取 `GameActivityDB` 到 `src/shared/database/game-activity.ts`
  - [ ] 1.1.7 创建 `src/shared/database/index.ts` 导出所有实体
  - [ ] 1.1.8 更新 Angular 和 Electron 的导入路径

- [ ] 1.2 实现 MessageRoute.callback 方法
  - [ ] 1.2.1 在 `worker.ts` 中实现 `MessageRoute.callback` 方法
  - [ ] 1.2.2 从请求包的 `service` 字段获取服务名
  - [ ] 1.2.3 查找对应的 Handler 实例
  - [ ] 1.2.4 使用 `Route.callback` 处理单个 Handler
  - [ ] 1.2.5 测试 MessageRoute.callback 功能

- [ ] 1.3 修改 Client.createApi 方法
  - [ ] 1.3.1 添加 `service` 参数到 `createApi<Handler>(service: string)`
  - [ ] 1.3.2 将 service 参数写入请求包的 `service` 字段
  - [ ] 1.3.3 保持向后兼容（service 参数可选，默认为 'electron'）
  - [ ] 1.3.4 测试修改后的 Client.createApi 功能

- [ ] 1.4 创建 WorkerAPI 单例
  - [ ] 1.4.1 创建 `src/app/library/worker-api.ts`
  - [ ] 1.4.2 实现 WorkerAPI 单例模式
  - [ ] 1.4.3 使用 `this.client_.createApi<Handler>('service')` 创建命名空间 API
  - [ ] 1.4.4 实现 resetInstance 方法（用于测试）
  - [ ] 1.4.5 添加错误处理

- [ ] 1.5 创建 MainAPI 单例
  - [ ] 1.5.1 创建 `src/app/library/main-api.ts`
  - [ ] 1.5.2 实现 MainAPI 单例模式
  - [ ] 1.5.3 实现命名空间访问（dialog、app、window）
  - [ ] 1.5.4 实现 IPC 调用方法
  - [ ] 1.5.5 实现 resetInstance 方法（用于测试）

- [ ] 1.5 Worker 进程数据库初始化
  - [ ] 1.5.1 在 `worker.ts` 中初始化 TypeORM
  - [ ] 1.5.2 导入 shared 数据库实体
  - [ ] 1.5.3 测试数据库连接

- [ ] 1.6 MainHandler IPC 注册
  - [ ] 1.6.1 在主进程创建 `main-handler.ts`
  - [ ] 1.6.2 实现 MainHandler 类
  - [ ] 1.6.3 注册 IPC 处理器
  - [ ] 1.6.4 测试 IPC 通信

## 2. WorkerHandler 实现（拆分为 9 个文件）

- [ ] 2.1 实现文件系统 Handler (`worker-fs-handler.ts`)
  - [ ] 2.1.1 `readFile(path: string): Promise<Buffer>` - 读取文件
  - [ ] 2.1.2 `writeFile(args: { path: string; data: Buffer | string }): Promise<void>` - 写入文件
  - [ ] 2.1.3 `deleteFile(path: string): Promise<void>` - 删除文件
  - [ ] 2.1.4 `exists(path: string): Promise<boolean>` - 检查文件存在（改名为 exists）
  - [ ] 2.1.5 `readdir(path: string): Promise<string[]>` - 读取目录
  - [ ] 2.1.6 `readdirRecursive(path: string): Promise<string[]>` - 递归读取目录
  - [ ] 2.1.7 `mkdir(args: { path: string; options?: { recursive?: boolean } }): Promise<void>` - 创建目录
  - [ ] 2.1.8 `deleteDir(args: { path: string; options?: { recursive?: boolean } }): Promise<void>` - 删除目录
  - [ ] 2.1.9 `stat(path: string): Promise<FileStats>` - 获取文件状态
  - [ ] 2.1.10 `lstat(path: string): Promise<FileStats>` - 获取文件状态（不跟随符号链接）

- [ ] 2.2 实现 ZIP 压缩 Handler (`worker-zip-handler.ts`)
  - [ ] 2.2.1 `createZipFromDirectory(args: { dirPath: string; zipPath: string }): Promise<void>` - 从目录创建 ZIP（使用文件流，直接写文件）
  - [ ] 2.2.2 `extractZip(args: { zipFilePath: string; targetPath: string }): Promise<void>` - 解压 ZIP 文件

- [ ] 2.3 实现哈希 Handler (`worker-crypto-handler.ts`)
  - [ ] 2.3.1 `calculateFileHash(filePath: string): Promise<string>` - 计算文件哈希
  - [ ] 2.3.2 `calculateDirectoryHash(dirPath: string): Promise<string>` - 计算目录哈希
  - [ ] 2.3.3 `calculateDirectorySize(dirPath: string): Promise<number>` - 计算目录大小
  - [ ] 2.3.4 `createHash(args: { algorithm: string; data: string | Buffer }): Promise<string>` - 创建哈希

- [ ] 2.4 实现数据库 Handler (`worker-database-handler.ts`)
  - [ ] 2.4.1 **游戏**
    - [ ] `saveGame(game: LocalGameDB): Promise<LocalGameDB>` - 保存游戏
    - [ ] `findGame(gameId: string): Promise<LocalGameDB | null>` - 查找游戏
    - [ ] `findGames(): Promise<LocalGameDB[]>` - 查找所有游戏
    - [ ] `deleteGame(gameId: string): Promise<void>` - 删除游戏
  - [ ] 2.4.2 **存档**
    - [ ] `saveSave(save: SaveDB): Promise<SaveDB>` - 保存存档
    - [ ] `findSaves(gameId: string): Promise<SaveDB[]>` - 查找游戏的所有存档
    - [ ] `deleteSave(saveId: string): Promise<void>` - 删除存档
    - [ ] `deleteSavesByGame(gameId: string): Promise<void>` - 删除游戏的所有存档
  - [ ] 2.4.3 **游戏历史**
    - [ ] `saveGameHistory(history: GameHistoryDB): Promise<GameHistoryDB>` - 保存游戏历史
    - [ ] `findGameHistory(gameId: string): Promise<GameHistoryDB[]>` - 查找游戏历史
    - [ ] `deleteGameHistory(gameId: string): Promise<void>` - 删除游戏历史
  - [ ] 2.4.4 **游戏攻略**
    - [ ] `saveGameGuide(guide: GameGuideDB): Promise<GameGuideDB>` - 保存游戏攻略
    - [ ] `findGameGuide(gameId: string): Promise<GameGuideDB | null>` - 查找游戏攻略
  - [ ] 2.4.5 **游戏活动**
    - [ ] `saveGameActivity(activity: GameActivityDB): Promise<GameActivityDB>` - 保存游戏活动
    - [ ] `findGameActivities(gameId: string): Promise<GameActivityDB[]>` - 查找游戏活动

- [ ] 2.5 实现进程管理 Handler (`worker-process-handler.ts`)
  - [ ] 2.5.1 `startGame(args: { exePath: string; cwd?: string }): Promise<void>` - 启动游戏
  - [ ] 2.5.2 `startGameWithLE(args: { lePath: string; profile: string; exePath: string }): Promise<void>` - 使用 LE 启动游戏

- [ ] 2.6 实现 Shell 操作 Handler (`worker-shell-handler.ts`)
  - [ ] 2.6.1 `openPath(path: string): Promise<void>` - 打开路径
  - [ ] 2.6.2 `openExternal(url: string): Promise<void>` - 打开外部链接

- [ ] 2.7 实现图标提取 Handler (`worker-icon-handler.ts`)
  - [ ] 2.7.1 `extractFileIcon(args: { exePath: string; size: number }): Promise<Buffer>` - 提取文件图标

- [ ] 2.8 实现更新管理 Handler (`worker-update-handler.ts`)
  - [ ] 2.8.1 `quitAndInstall(): Promise<void>` - 重启并安装更新
  - [ ] 2.8.2 `downloadUpdate(args: { url: string; destPath: string; options?: DownloadOptions }): Promise<void>` - 下载更新
  - [ ] 2.8.3 `verifyFileHash(args: { filePath: string; expectedHash: string }): Promise<boolean>` - 验证文件哈希

- [ ] 2.9 实现路径处理 Handler (`worker-path-handler.ts`)
  - [ ] 2.9.1 `join(args: { paths: string[] }): string` - 路径拼接
  - [ ] 2.9.2 `resolve(args: { paths: string[] }): string` - 路径解析
  - [ ] 2.9.3 `dirname(path: string): string` - 获取目录名
  - [ ] 2.9.4 `basename(args: { path: string; ext?: string }): string` - 获取文件名
  - [ ] 2.9.5 `extname(path: string): string` - 获取扩展名
  - [ ] 2.9.6 `isAbsolute(path: string): boolean` - 判断绝对路径
  - [ ] 2.9.7 `encodeGamePath(args: { dirPath: string; rootPath: string }): string` - 编码游戏路径
  - [ ] 2.9.8 `decodeGamePath(args: { dirPath: string; rootPath: string }): string` - 解码游戏路径
  - [ ] 2.9.9 `getCwd(): string` - 获取当前工作目录
  - [ ] 2.9.10 `getHostname(): string` - 获取主机名

- [ ] 2.10 配置 MessageRoute.callback 路由
  - [ ] 2.10.1 创建 `worker-handler/index.ts` 导出所有 Handler
  - [ ] 2.10.2 在 `worker.ts` 中创建所有 Handler 实例
  - [ ] 2.10.3 使用 `MessageRoute.callback` 配置 service 到 Handler 的映射
  - [ ] 2.10.4 测试路由功能

## 3. MainHandler 实现

- [ ] 3.1 实现对话框 Handler (`main-dialog-handler.ts`)
  - [ ] 3.1.1 `showOpenFileDialog(options: IFileDialogOptions): Promise<IFileDialogResult>` - 文件选择对话框
  - [ ] 3.1.2 `showOpenDirectoryDialog(options: IDirectoryDialogOptions): Promise<IFileDialogResult>` - 目录选择对话框

- [ ] 3.2 实现应用 Handler (`main-app-handler.ts`)
  - [ ] 3.2.1 `getVersion(): string` - 获取版本
  - [ ] 3.2.2 `getLoginItemSettings(): { openAtLogin: boolean }` - 获取开机启动设置
  - [ ] 3.2.3 `setLoginItemSettings(settings: { openAtLogin: boolean }): void` - 设置开机启动
  - [ ] 3.2.4 `isPackaged(): boolean` - 判断是否打包
  - [ ] 3.2.5 `getAppPath(name: string): string` - 获取应用路径
  - [ ] 3.2.6 `getResourcesPath(): string` - 获取资源路径

- [ ] 3.3 实现窗口管理 Handler (`main-window-handler.ts`)
  - [ ] 3.3.1 `createGameGuideWindow(gameId: string, title: string): Promise<number>` - 创建游戏攻略窗口
  - [ ] 3.3.2 `closeGameGuideWindow(windowId: number): Promise<void>` - 关闭游戏攻略窗口
  - [ ] 3.3.3 `setWindowTop(windowId: number, top: boolean): Promise<void>` - 设置窗口置顶

## 4. Angular 全面迁移

### 4.1 工具库迁移
- [ ] 4.1.1 迁移 `utility.ts` - 文件操作（使用 `workerAPI.fs.*`）
- [ ] 4.1.2 迁移 `utility.ts` - 哈希计算（使用 `workerAPI.crypto.*`）
- [ ] 4.1.3 迁移 `utility.ts` - 路径编码/解码（使用 `workerAPI.path.*`）
- [ ] 4.1.4 **迁移** `utility.ts` - 表单验证器改为异步验证器（使用 `workerAPI.fs.*`）
  - [ ] `GameValidators.folder` 改为异步验证器
  - [ ] `GameValidators.file` 改为异步验证器
  - [ ] 更新所有使用验证器的表单（支持异步验证）
- [ ] 4.1.5 迁移 `cache-image.ts` - 文件操作（使用 `workerAPI.fs.*`）

### 4.2 服务层迁移（数据库调用）
- [ ] 4.2.1 迁移 `game.service.ts` - 游戏数据库操作（使用 `workerAPI.db.*`）
- [ ] 4.2.2 迁移 `game-activity.service.ts` - 游戏活动数据库操作（使用 `workerAPI.db.*`）
- [ ] 4.2.3 迁移 `oss.service.ts` - 文件读取（使用 `workerAPI.fs.*`）
- [ ] 4.2.4 迁移 `setting.service.ts` - 配置文件读取（使用 `workerAPI.fs.*`）
- [ ] 4.2.5 迁移 `update.service.ts` - 文件下载和验证（使用 `workerAPI.update.*`）

### 4.3 实体层迁移（数据库调用）
- [ ] 4.3.1 迁移 `game.ts` - 数据库操作（使用 `workerAPI.db.*`）
- [ ] 4.3.2 迁移 `game.ts` - 文件操作（使用 `workerAPI.fs.*`、`workerAPI.zip.*`、`workerAPI.crypto.*`）
- [ ] 4.3.3 迁移 `game.ts` - 进程启动（使用 `workerAPI.process.*`）
- [ ] 4.3.4 迁移 `game.ts` - Shell 操作（使用 `workerAPI.shell.*`）
- [ ] 4.3.5 迁移 `game.ts` - IPC 调用（改为 `mainAPI.*`）
- [ ] 4.3.6 迁移 `save.ts` - 数据库操作（使用 `workerAPI.db.*`）
- [ ] 4.3.7 迁移 `save.ts` - 文件操作（使用 `workerAPI.fs.*`、`workerAPI.zip.*`、`workerAPI.crypto.*`）
- [ ] 4.3.8 迁移 `remote-save.ts` - 数据库操作（使用 `workerAPI.db.*`）
- [ ] 4.3.9 迁移 `remote-save.ts` - 文件操作（使用 `workerAPI.fs.*`）

### 4.4 组件层迁移
- [ ] 4.4.1 迁移对话框调用（使用 `mainAPI.dialog.*`）
- [ ] 4.4.2 迁移应用 API 调用（使用 `mainAPI.app.*`）
- [ ] 4.4.3 迁移窗口管理调用（使用 `mainAPI.window.*`）

## 5. 测试和验证

- [ ] 5.1 单元测试
  - [ ] 5.1.1 WorkerAPI 单例测试
  - [ ] 5.1.2 MainAPI 单例测试
  - [ ] 5.1.3 WorkerHandler 方法测试
  - [ ] 5.1.4 MainHandler 方法测试

- [ ] 5.2 集成测试
  - [ ] 5.2.1 文件操作集成测试
  - [ ] 5.2.2 ZIP 压缩集成测试
  - [ ] 5.2.3 数据库操作集成测试
  - [ ] 5.2.4 对话框集成测试

- [ ] 5.3 功能测试
  - [ ] 5.3.1 游戏导入功能
  - [ ] 5.3.2 游戏启动功能
  - [ ] 5.3.3 存档备份功能
  - [ ] 5.3.4 存档恢复功能
  - [ ] 5.3.5 云存档同步功能
  - [ ] 5.3.6 用户设置功能
  - [ ] 5.3.7 应用更新功能
  - [ ] 5.3.8 游戏攻略功能

- [ ] 5.4 性能测试
  - [ ] 5.4.1 API 调用性能测试
  - [ ] 5.4.2 数据库操作性能测试
  - [ ] 5.4.3 大文件操作性能测试

- [ ] 5.5 代码质量检查
  - [ ] 5.5.1 ESLint 检查
  - [ ] 5.5.2 TypeScript 类型检查
  - [ ] 5.5.3 代码审查

## 6. 文档更新

- [ ] 6.1 技术文档
  - [ ] 6.1.1 更新 `.ai/doc/project.md` 架构文档
  - [ ] 6.1.2 创建 WorkerAPI 使用文档
  - [ ] 6.1.3 创建 MainAPI 使用文档
  - [ ] 6.1.4 创建迁移指南

- [ ] 6.2 API 文档
  - [ ] 6.2.1 WorkerHandler API 文档
  - [ ] 6.2.2 MainHandler API 文档

## 7. 归档

- [ ] 7.1 代码清理
  - [ ] 7.1.1 移除不再使用的导入
  - [ ] 7.1.2 清理注释和调试代码
  - [ ] 7.1.3 统一代码风格

- [ ] 7.2 归档变更
  - [ ] 7.2.1 更新 OpenSpec specs
  - [ ] 7.2.2 归档变更提案
  - [ ] 7.2.3 更新 CHANGELOG

## 验收标准

- [ ] WorkerHandler 拆分为 9 个文件，通过 `MessageRoute.callback` 路由（49 个方法）
- [ ] MainHandler 拆分为 3 个文件，仅负责 UI 相关功能（11 个方法）
- [ ] 所有 API 方法只接受一个参数对象（如 `join({paths: string[]})`）
- [ ] WorkerAPI 和 MainAPI 使用 `client_.createApi<Handler>('service')` 创建 API
- [ ] 支持命名空间访问（如 `workerAPI.fs.exists()`）
- [ ] ZIP 创建方法使用文件流，直接写文件
- [ ] 数据库操作已完全迁移到 Worker 进程
- [ ] 使用单例模式，不依赖 Angular DI
- [ ] 数据库实体提取到 `src/shared/database/` 目录
- [ ] 渲染进程内不保留任何 Node 模块调用
- [ ] 表单验证器改为异步验证器
- [ ] MessageRoute.callback 方法正确实现并测试通过
- [ ] Client.createApi 支持 service 参数
- [ ] 现有功能全部正常工作
- [ ] 代码通过 ESLint 和 TypeScript 检查

## 统计

- **WorkerHandler 方法总数**: 49 个
  - 文件系统 Handler (`worker-fs-handler.ts`): 10 个
  - ZIP 压缩 Handler (`worker-zip-handler.ts`): 2 个
  - 哈希 Handler (`worker-crypto-handler.ts`): 4 个
  - 数据库 Handler (`worker-database-handler.ts`): 15 个
  - 进程管理 Handler (`worker-process-handler.ts`): 2 个
  - Shell 操作 Handler (`worker-shell-handler.ts`): 2 个
  - 图标提取 Handler (`worker-icon-handler.ts`): 1 个
  - 更新管理 Handler (`worker-update-handler.ts`): 3 个
  - 路径处理 Handler (`worker-path-handler.ts`): 10 个

- **MainHandler 方法总数**: 11 个
  - 对话框 Handler: 2 个
  - 应用 Handler: 6 个
  - 窗口管理 Handler: 3 个

- **总计 Handler 方法**: 60 个

- **预计工时**: 23-30 天
  - 基础设施（含 Route.compose 实现）: 4-5 天
  - WorkerHandler（9 个文件）: 9-11 天
  - MainHandler: 1-2 天
  - 全面迁移: 7-9 天
  - 测试和优化: 2-3 天

## 优先级

**高优先级（立即实施）**:
1. 提取数据库实体到 shared 目录
2. 实现 MessageRoute.callback 方法
3. 修改 Client.createApi 支持 service 参数
4. 创建 WorkerAPI 和 MainAPI 单例
5. 核心文件系统 Handler
6. 核心对话框 Handler
7. 核心应用 Handler
8. 核心数据库 Handler

**中优先级（后续实施）**:
1. ZIP 压缩 Handler（使用文件流）
2. 哈希 Handler
3. 进程管理 Handler
4. Shell 操作 Handler

**低优先级（按需实施）**:
1. 图标提取 Handler
2. 更新管理 Handler
3. 完整迁移

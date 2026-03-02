# 设计文档：Angular 模块 Node API 隔离（最终版 v2）

## 上下文

### 背景
whitecloud-client 是一个 Electron + Angular 桌面应用，当前架构中 Angular 渲染进程直接调用 Node API 和数据库。项目已经实现了 worker 进程架构，需要扩展 Handler 以实现 Node API 和数据库的隔离。

### 现有架构
- **Worker 进程**: `src/electron/worker.ts` - 使用 @sora-soft/framework
- **WorkerHandler**: `src/electron/handler/worker-handler/` - 拆分为多个文件
- **MainHandler**: `src/electron/handler/main-handler.ts` - 仅负责 Electron UI 特有功能
- **Client API**: `src/angular/app/library/worker-api.ts` - 通信客户端（使用 Proxy）
- **数据库**: TypeORM + SQLite (`data/db.sqlite`)

### 约束
- 必须保持现有业务逻辑不变
- 不能影响用户体验
- 必须使用现有的 worker 进程架构
- RPC 架构不支持同步操作
- 表单验证器需要同步返回结果

## 目标 / 非目标

### 目标
1. **职责分离**: WorkerHandler 承担大部分底层操作，MainHandler 仅负责 UI
2. **代码组织**: Handler 拆分为多个文件，通过 `Route.compose` 合并
3. **API 设计**: 使用 Proxy 动态生成 API，支持命名空间访问
4. **性能优化**: ZIP 创建直接写文件，减少内存占用
5. **数据库集中管理**: 将数据库操作迁移到 Worker 进程（一步到位）
6. **简化架构**: 使用单例模式，摆脱 Angular DI 依赖

### 非目标
1. **业务逻辑重构**: 不重构现有业务逻辑
2. **完整隔离**: 表单验证器保留在渲染进程（需要同步操作）
3. **Web 化**: 不实现 Web 版本

## 决策

### 1. Handler 组织方式

**决策**: WorkerHandler 拆分为多个文件，通过 `Route.compose` 合并

#### 1.1 WorkerHandler 文件结构

```
src/electron/handler/worker-handler/
├── worker-fs-handler.ts          # 文件系统 Handler
├── worker-zip-handler.ts          # ZIP 压缩 Handler
├── worker-crypto-handler.ts       # 哈希计算 Handler
├── worker-database-handler.ts     # 数据库 Handler
├── worker-process-handler.ts      # 进程管理 Handler
├── worker-shell-handler.ts        # Shell 操作 Handler
├── worker-icon-handler.ts         # 图标提取 Handler
├── worker-update-handler.ts       # 更新管理 Handler
├── worker-path-handler.ts         # 路径处理 Handler
└── index.ts                       # 导出合并后的 Handler
```

#### 1.2 MessageRoute.callback 实现

**worker.ts 实现**:
```typescript
import {Route} from '@sora-soft/framework';
import {ElectronMessageListener} from './lib/ElectronMessageListener.js';
import {WorkerFsHandler} from './handler/worker-handler/worker-fs-handler.js';
import {WorkerZipHandler} from './handler/worker-handler/worker-zip-handler.js';
import {WorkerCryptoHandler} from './handler/worker-handler/worker-crypto-handler.js';
import {WorkerDatabaseHandler} from './handler/worker-handler/worker-database-handler.js';
// ... 其他 Handler

// MessageRoute.callback 实现（根据请求包的 service 字段实现路由）
const MessageRoute = {
  callback(handlers: Record<string, Route>): (packet: IRawReqPacket) => Promise<any> {
    return async (packet: IRawReqPacket) => {
      const service = packet.service; // 从请求包获取 service 字段
      const handler = handlers[service];
      
      if (!handler) {
        throw new Error(`Unknown service: ${service}`);
      }
      
      // 使用 Route.callback 处理单个 handler
      const routeCallback = Route.callback(handler);
      return await routeCallback(packet);
    };
  }
};

process.parentPort.on('message', async (event) => {
  if (event.data.command === 'init-port') {
    // 创建所有 Handler 实例
    const fsHandler = new WorkerFsHandler();
    const zipHandler = new WorkerZipHandler();
    const cryptoHandler = new WorkerCryptoHandler();
    const databaseHandler = new WorkerDatabaseHandler();
    const processHandler = new WorkerProcessHandler();
    const shellHandler = new WorkerShellHandler();
    const iconHandler = new WorkerIconHandler();
    const updateHandler = new WorkerUpdateHandler();
    const pathHandler = new WorkerPathHandler();
    
    // 使用 MessageRoute.callback 根据 service 字段路由到不同的 Handler
    const listener = new ElectronMessageListener(
      event.ports[0], 
      MessageRoute.callback({
        'fs': fsHandler,
        'zip': zipHandler,
        'crypto': cryptoHandler,
        'db': databaseHandler,
        'process': processHandler,
        'shell': shellHandler,
        'icon': iconHandler,
        'update': updateHandler,
        'path': pathHandler,
      })
    );
    await listener.startListen();
  }
});
```

#### 1.3 单个 Handler 示例

**worker-fs-handler.ts**:
```typescript
import {Route} from '@sora-soft/framework';
import fs from 'fs/promises';
import posixPath from 'path/posix';

export class WorkerFsHandler extends Route {
  @Route.method
  async readFile(path: string): Promise<Buffer> {
    return await fs.readFile(path);
  }
  
  @Route.method
  async writeFile(path: string, data: Buffer | string): Promise<void> {
    await fs.writeFile(path, data);
  }
  
  @Route.method
  async exists(path: string): Promise<boolean> {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }
  
  @Route.method
  async readdirRecursive(dirPath: string): Promise<string[]> {
    const result: string[] = [];
    const files = await fs.readdir(dirPath);
    
    for (const file of files) {
      const filePath = posixPath.join(dirPath, file);
      const stat = await fs.stat(filePath);
      
      if (stat.isDirectory()) {
        const folderResult = await this.readdirRecursive(filePath);
        result.push(...folderResult.map(f => posixPath.join(file, f)));
      } else {
        result.push(file);
      }
    }
    
    return result;
  }
}
```

### 2. Angular 封装设计（使用 Proxy）

**决策**: 使用单例模式 + Proxy 动态生成 API

#### 2.1 WorkerAPI 单例

```typescript
// src/app/library/worker-api.ts
import {Client, IRemoteHandler, ConvertRouteMethod} from './worker-api';
import type {WorkerFsHandler} from '../../../electron/handler/worker-handler/worker-fs-handler';
import type {WorkerZipHandler} from '../../../electron/handler/worker-handler/worker-zip-handler';
import type {WorkerCryptoHandler} from '../../../electron/handler/worker-handler/worker-crypto-handler';
import type {WorkerDatabaseHandler} from '../../../electron/handler/worker-handler/worker-database-handler';
// ... 其他 Handler 类型

export class WorkerAPI {
  private static instance_: WorkerAPI | null = null;
  private client_: Client;
  
  private constructor() {
    this.client_ = new Client(window.workerChannel);
  }
  
  static getInstance(): WorkerAPI {
    if (!WorkerAPI.instance_) {
      WorkerAPI.instance_ = new WorkerAPI();
    }
    return WorkerAPI.instance_;
  }
  
  static resetInstance(): void {
    WorkerAPI.instance_ = null;
  }
  
  // 使用 createApi 创建命名空间 API，service 字段会封装在请求包中
  get fs() {
    return this.client_.createApi<WorkerFsHandler>('fs');
  }
  
  get zip() {
    return this.client_.createApi<WorkerZipHandler>('zip');
  }
  
  get crypto() {
    return this.client_.createApi<WorkerCryptoHandler>('crypto');
  }
  
  get db() {
    return this.client_.createApi<WorkerDatabaseHandler>('db');
  }
  
  get process() {
    return this.client_.createApi<WorkerProcessHandler>('process');
  }
  
  get shell() {
    return this.client_.createApi<WorkerShellHandler>('shell');
  }
  
  get icon() {
    return this.client_.createApi<WorkerIconHandler>('icon');
  }
  
  get update() {
    return this.client_.createApi<WorkerUpdateHandler>('update');
  }
  
  get path() {
    return this.client_.createApi<WorkerPathHandler>('path');
  }
}
```

**Client.createApi 修改**:
```typescript
// src/angular/app/library/worker-api.ts
export class Client {
  // ...
  
  createApi<Handler extends IRemoteHandler>(service: string): ConvertRouteMethod<Handler> {
    return new Proxy({} as any, {
      get: (target, prop: string, receiver) => {
        return async (body: unknown) => {
          const waiter = this.waiter_.wait(1000 * 10);
          const packet: IRawReqPacket = {
            opcode: OPCode.REQUEST,
            method: prop,
            service: service, // 使用传入的 service 参数
            headers: {
              'rpc-id': waiter.id,
            },
            payload: body || {},
          };
          this.channel_.postMessage(packet);
          return waiter.promise;
        };
      },
    });
  }
}
```

#### 2.2 MainAPI 单例

```typescript
// src/app/library/main-api.ts
import type {MainDialogHandler} from '../../../electron/handler/main-handler/main-dialog-handler';
import type {MainAppHandler} from '../../../electron/handler/main-handler/main-app-handler';
import type {MainWindowHandler} from '../../../electron/handler/main-handler/main-window-handler';

export class MainAPI {
  private static instance_: MainAPI | null = null;
  
  private constructor() {}
  
  static getInstance(): MainAPI {
    if (!MainAPI.instance_) {
      MainAPI.instance_ = new MainAPI();
    }
    return MainAPI.instance_;
  }
  
  static resetInstance(): void {
    MainAPI.instance_ = null;
  }
  
  get dialog() {
    return this.createApi<MainDialogHandler>('dialog');
  }
  
  get app() {
    return this.createApi<MainAppHandler>('app');
  }
  
  get window() {
    return this.createApi<MainWindowHandler>('window');
  }
  
  private createApi<Handler>(service: string): any {
    return new Proxy({} as any, {
      get: (target, prop: string) => {
        return async (...args: any[]) => {
          return await ipcRenderer.invoke('mainAPI', service, prop, ...args);
        };
      }
    });
  }
}
```

#### 2.3 使用方式

```typescript
// 在任何地方使用，无需 Angular DI
const workerAPI = WorkerAPI.getInstance();
const mainAPI = MainAPI.getInstance();

// 调用 API（方法名直接使用，不带前缀）
const exists = await workerAPI.fs.exists(savePath);
await workerAPI.zip.createZipFromDirectory(dirPath, zipPath);
const hash = await workerAPI.crypto.calculateFileHash(filePath);
const game = await workerAPI.db.saveGame(game); // 数据库方法直接使用 saveGame

const result = await mainAPI.dialog.showOpenFileDialog({ title: '选择文件' });
const version = await mainAPI.app.getVersion();
```

### 3. WorkerHandler API 设计

#### 3.1 文件系统 Handler

```typescript
// worker-fs-handler.ts
export class WorkerFsHandler extends Route {
  @Route.method
  async readFile(path: string): Promise<Buffer>;
  
  @Route.method
  async writeFile(args: { path: string; data: Buffer | string }): Promise<void>;
  
  @Route.method
  async deleteFile(path: string): Promise<void>;
  
  @Route.method
  async exists(path: string): Promise<boolean>; // 改名为 exists
  
  @Route.method
  async readdir(path: string): Promise<string[]>;
  
  @Route.method
  async readdirRecursive(path: string): Promise<string[]>;
  
  @Route.method
  async mkdir(args: { path: string; options?: { recursive?: boolean } }): Promise<void>;
  
  @Route.method
  async deleteDir(args: { path: string; options?: { recursive?: boolean } }): Promise<void>;
  
  @Route.method
  async stat(path: string): Promise<FileStats>;
  
  @Route.method
  async lstat(path: string): Promise<FileStats>;
}
```

#### 3.2 ZIP 压缩 Handler

```typescript
// worker-zip-handler.ts
import {Route} from '@sora-soft/framework';
import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import mkdirp from 'mkdirp';

export class WorkerZipHandler extends Route {
  @Route.method
  async createZipFromDirectory(args: { dirPath: string; zipPath: string }): Promise<void> {
    const { dirPath, zipPath } = args;
    const zip = new JSZip();
    
    // 使用文件流读取文件，避免一次性加载到内存
    const addDirectoryToZip = async (currentPath: string, zipFolder: JSZip) => {
      const entries = await fs.promises.readdir(currentPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        
        if (entry.isDirectory()) {
          const folder = zipFolder.folder(entry.name);
          await addDirectoryToZip(fullPath, folder!);
        } else {
          // 使用文件流读取
          const stream = fs.createReadStream(fullPath);
          const chunks: Buffer[] = [];
          
          await new Promise((resolve, reject) => {
            stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
            stream.on('error', reject);
            stream.on('end', resolve);
          });
          
          zipFolder.file(entry.name, Buffer.concat(chunks));
        }
      }
    };
    
    await addDirectoryToZip(dirPath, zip);
    
    // 生成 ZIP 并直接写入文件
    const zipData = await zip.generateAsync({ 
      type: 'nodebuffer',
      streamFiles: true // 使用流式生成
    });
    
    await mkdirp(path.dirname(zipPath));
    await fs.promises.writeFile(zipPath, zipData);
  }
  
  @Route.method
  async extractZip(args: { zipFilePath: string; targetPath: string }): Promise<void> {
    const { zipFilePath, targetPath } = args;
    const zipData = await fs.promises.readFile(zipFilePath);
    const zip = await JSZip.loadAsync(zipData);
    
    await mkdirp(targetPath);
    
    for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
      if (!zipEntry.dir) {
        const filePath = path.join(targetPath, relativePath);
        await mkdirp(path.dirname(filePath));
        
        // 使用流式写入
        const content = await zipEntry.async('nodebuffer');
        await fs.promises.writeFile(filePath, content);
      }
    }
  }
}
```

#### 3.3 哈希 Handler

```typescript
// worker-crypto-handler.ts
export class WorkerCryptoHandler extends Route {
  @Route.method
  async calculateFileHash(filePath: string): Promise<string>;
  
  @Route.method
  async calculateDirectoryHash(dirPath: string): Promise<string>;
  
  @Route.method
  async calculateDirectorySize(dirPath: string): Promise<number>;
  
  @Route.method
  async createHash(args: { algorithm: string; data: string | Buffer }): Promise<string>;
}
```

#### 3.4 数据库 Handler

```typescript
// worker-database-handler.ts
import {Route} from '@sora-soft/framework';
import {AppDataSource} from './database';
import {LocalGameDB, SaveDB, GameHistoryDB, GameGuideDB, GameActivityDB} from '../../../shared/database';

export class WorkerDatabaseHandler extends Route {
  constructor() {
    super();
    this.initDatabase();
  }
  
  private async initDatabase() {
    await AppDataSource.initialize();
  }
  
  // 游戏相关方法（直接使用方法名，不带 db_ 前缀）
  @Route.method
  async saveGame(game: LocalGameDB): Promise<LocalGameDB>;
  
  @Route.method
  async findGame(gameId: string): Promise<LocalGameDB | null>;
  
  @Route.method
  async findGames(): Promise<LocalGameDB[]>;
  
  @Route.method
  async deleteGame(gameId: string): Promise<void>;
  
  // 存档相关方法
  @Route.method
  async saveSave(save: SaveDB): Promise<SaveDB>;
  
  @Route.method
  async findSaves(gameId: string): Promise<SaveDB[]>;
  
  @Route.method
  async deleteSave(saveId: string): Promise<void>;
  
  @Route.method
  async deleteSavesByGame(gameId: string): Promise<void>;
  
  // 游戏历史相关方法
  @Route.method
  async saveGameHistory(history: GameHistoryDB): Promise<GameHistoryDB>;
  
  @Route.method
  async findGameHistory(gameId: string): Promise<GameHistoryDB[]>;
  
  @Route.method
  async deleteGameHistory(gameId: string): Promise<void>;
  
  // 游戏攻略相关方法
  @Route.method
  async saveGameGuide(guide: GameGuideDB): Promise<GameGuideDB>;
  
  @Route.method
  async findGameGuide(gameId: string): Promise<GameGuideDB | null>;
  
  // 游戏活动相关方法
  @Route.method
  async saveGameActivity(activity: GameActivityDB): Promise<GameActivityDB>;
  
  @Route.method
  async findGameActivities(gameId: string): Promise<GameActivityDB[]>;
}
```

#### 3.5 其他 Handler

```typescript
// worker-process-handler.ts
export class WorkerProcessHandler extends Route {
  @Route.method
  async startGame(args: { exePath: string; cwd?: string }): Promise<void>;
  
  @Route.method
  async startGameWithLE(args: { lePath: string; profile: string; exePath: string }): Promise<void>;
}

// worker-shell-handler.ts
export class WorkerShellHandler extends Route {
  @Route.method
  async openPath(path: string): Promise<void>;
  
  @Route.method
  async openExternal(url: string): Promise<void>;
}

// worker-icon-handler.ts
export class WorkerIconHandler extends Route {
  @Route.method
  async extractFileIcon(args: { exePath: string; size: number }): Promise<Buffer>;
}

// worker-update-handler.ts
export class WorkerUpdateHandler extends Route {
  @Route.method
  async quitAndInstall(): Promise<void>;
  
  @Route.method
  async downloadUpdate(args: { url: string; destPath: string; options?: DownloadOptions }): Promise<void>;
  
  @Route.method
  async verifyFileHash(args: { filePath: string; expectedHash: string }): Promise<boolean>;
}

// worker-path-handler.ts
export class WorkerPathHandler extends Route {
  @Route.method
  join(args: { paths: string[] }): string;
  
  @Route.method
  resolve(args: { paths: string[] }): string;
  
  @Route.method
  dirname(path: string): string;
  
  @Route.method
  basename(args: { path: string; ext?: string }): string;
  
  @Route.method
  extname(path: string): string;
  
  @Route.method
  isAbsolute(path: string): boolean;
  
  @Route.method
  encodeGamePath(args: { dirPath: string; rootPath: string }): string;
  
  @Route.method
  decodeGamePath(args: { dirPath: string; rootPath: string }): string;
  
  @Route.method
  getCwd(): string;
  
  @Route.method
  getHostname(): string;
}
```

### 4. MainHandler API 设计

```typescript
// main-dialog-handler.ts
export class MainDialogHandler extends Route {
  @Route.method
  async showOpenFileDialog(options: IFileDialogOptions): Promise<IFileDialogResult>;
  
  @Route.method
  async showOpenDirectoryDialog(options: IDirectoryDialogOptions): Promise<IFileDialogResult>;
}

// main-app-handler.ts
export class MainAppHandler extends Route {
  @Route.method
  getVersion(): string;
  
  @Route.method
  getLoginItemSettings(): { openAtLogin: boolean };
  
  @Route.method
  setLoginItemSettings(settings: { openAtLogin: boolean }): void;
  
  @Route.method
  isPackaged(): boolean;
  
  @Route.method
  getAppPath(name: string): string;
  
  @Route.method
  getResourcesPath(): string;
}

// main-window-handler.ts
export class MainWindowHandler extends Route {
  @Route.method
  async createGameGuideWindow(gameId: string, title: string): Promise<number>;
  
  @Route.method
  async closeGameGuideWindow(windowId: number): Promise<void>;
  
  @Route.method
  async setWindowTop(windowId: number, top: boolean): Promise<void>;
}
```

### 5. 数据库实体共享

**目录结构**:
```
src/
├── shared/
│   └── database/
│       ├── index.ts            # 导出所有实体
│       ├── game.ts             # LocalGameDB
│       ├── save.ts             # SaveDB
│       ├── game-history.ts     # GameHistoryDB
│       ├── game-guide.ts       # GameGuideDB
│       └── game-activity.ts    # GameActivityDB
```

**使用方式**:
```typescript
// Angular 中使用
import {LocalGameDB, SaveDB} from '../../../shared/database';

// Electron 中使用
import {LocalGameDB, SaveDB} from '../shared/database';
```

### 6. 同步操作处理

**迁移到异步验证器**:
```typescript
// src/app/library/utility.ts
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { WorkerAPI } from './worker-api';

class GameValidators {
  // 异步验证器：检查文件夹是否存在
  static folder(control: AbstractControl): Promise<ValidationErrors | null> {
    const value = control.value;
    if (!value) return Promise.resolve(null);
    
    return WorkerAPI.getInstance().fs.exists(value).then(exists => {
      if (exists) {
        return null; // 验证通过
      }
      return { folder: true }; // 验证失败
    }).catch(() => {
      return { folder: true }; // 出错时也返回验证失败
    });
  }
  
  // 异步验证器：检查文件是否存在
  static file(control: AbstractControl): Promise<ValidationErrors | null> {
    const value = control.value;
    if (!value) return Promise.resolve(null);
    
    return WorkerAPI.getInstance().fs.stat(value).then(stat => {
      if (stat.isFile()) {
        return null; // 验证通过
      }
      return { file: true }; // 验证失败
    }).catch(() => {
      return { file: true }; // 出错时也返回验证失败
    });
  }
}
```

**在表单中使用异步验证器**:
```typescript
// 响应式表单
this.form = this.fb.group({
  gamePath: ['', [Validators.required], [GameValidators.folder]], // 第三个参数是异步验证器
  exePath: ['', [Validators.required], [GameValidators.file]],
});

// 模板驱动表单
<input [(ngModel)]="gamePath" name="gamePath" required [ngModelOptions]="{asyncValidators: [GameValidators.folder]}">
```

**注意事项**:
- 渲染进程内不能保留任何 Node 模块调用（包括 `fs`、`path`、`crypto` 等）
- 所有验证器必须改为异步验证器
- 使用 `Promise` 或 `Observable` 返回验证结果
- Angular 会自动处理异步验证器的状态（显示加载中）


## 风险 / 权衡

### 风险 1: MessageRoute.callback 实现
**影响**: 需要正确实现基于 service 字段的路由
**缓解措施**:
- 仔细测试 service 字段路由逻辑
- 确保 Handler 映射正确
- 添加充分的单元测试

### 风险 2: Client.createApi 修改
**影响**: 需要修改现有 Client 类以支持 service 参数
**缓解措施**:
- 保持向后兼容（service 参数可选）
- 测试现有功能不受影响
- 添加类型检查

### 风险 3: ZIP 文件流处理
**影响**: 大文件流式处理可能增加复杂度
**缓解措施**:
- 使用 Node.js 原生流 API
- 测试大文件压缩性能
- 添加错误处理

### 风险 4: 数据库迁移复杂度
**影响**: 一步到位迁移工作量大
**缓解措施**:
- 仔细规划迁移步骤
- 充分测试每个模块
- 保持业务逻辑不变

## 迁移计划

### 阶段 1: 基础设施（4-5 天）
1. 提取数据库实体到 `src/shared/database/`
2. 实现 `Route.compose` 方法
3. 创建 WorkerAPI 和 MainAPI 单例类（使用 Proxy）
4. 在 Worker 进程初始化数据库

### 阶段 2: WorkerHandler 实现（9-11 天）
1. 实现文件系统 Handler（10 个方法）
2. 实现 ZIP 压缩 Handler（2 个方法）
3. 实现哈希 Handler（4 个方法）
4. 实现数据库 Handler（15 个方法）
5. 实现进程管理 Handler（2 个方法）
6. 实现 Shell 操作 Handler（2 个方法）
7. 实现图标提取 Handler（1 个方法）
8. 实现更新管理 Handler（3 个方法）
9. 实现路径处理 Handler（10 个方法）
10. 使用 `Route.compose` 合并所有 Handler

### 阶段 3: MainHandler 实现（1-2 天）
1. 实现对话框 Handler（2 个方法）
2. 实现应用 Handler（6 个方法）
3. 实现窗口管理 Handler（3 个方法）

### 阶段 4: 全面迁移（7-9 天）
1. 迁移工具库（保留验证器）
2. 迁移服务层（所有数据库调用）
3. 迁移实体层（所有数据库调用）
4. 迁移组件层（对话框、应用 API）
5. 测试所有功能

### 阶段 5: 测试和优化（2-3 天）
1. 全面功能测试
2. 性能测试
3. 代码审查
4. 文档更新

**总计**: 23-30 天

## 待决问题

1. **MessageRoute.callback 实现细节**: 如何正确实现基于 service 字段的路由？
   - 当前方案: 从请求包的 service 字段获取服务名，查找对应的 Handler
   - 待定: 需要实际测试验证

2. **Client.createApi 向后兼容**: 如何保持现有代码不受影响？
   - 当前方案: service 参数可选，默认为 'electron'
   - 待定: 根据测试结果决定

3. **ZIP 文件流性能**: 使用文件流处理大文件的性能如何？
   - 当前方案: 使用 Node.js 原生流 API
   - 待定: 需要性能测试

4. **单例模式重置**: 如何在测试中重置单例？
   - 当前方案: 提供 resetInstance 方法
   - 待定: 根据测试需求决定

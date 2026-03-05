# Node API 隔离迁移指南

## 概述

本次重构将所有 Node API 调用和数据库操作从 Angular 渲染进程迁移到 Worker 进程，实现渲染进程与 Node 环境的完全解耦。

## 架构变更

### 新架构

```
┌─────────────────────────────────────────────────────────┐
│                    Angular 渲染进程                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  WorkerAPI   │  │   MainAPI    │  │   Services   │  │
│  │   单例类     │  │    单例类    │  │   & 实体     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
           │                      │
           │ RPC over             │ IPC
           │ MessageChannel       │
           ▼                      ▼
┌─────────────────────┐  ┌─────────────────────┐
│   Worker 进程       │  │   Electron 主进程   │
│  ┌──────────────┐   │  │  ┌──────────────┐   │
│  │ WorkerHandler│   │  │  │ MainHandler  │   │
│  │   (9个子类)  │   │  │  │  (3个子类)   │   │
│  └──────────────┘   │  │  └──────────────┘   │
│  ┌──────────────┐   │  │                     │
│  │   Database   │   │  │                     │
│  │   (TypeORM)  │   │  │                     │
│  └──────────────┘   │  │                     │
└─────────────────────┘  └─────────────────────┘
```

## 已完成工作

### ✅ 基础设施 (100%)

1. **数据库实体共享** (`src/shared/database/`)
   - `game.ts` - LocalGameDB 实体
   - `save.ts` - SaveDB 实体
   - `game-history.ts` - GameHistoryDB 实体
   - `game-guide.ts` - GameGuideDB 实体
   - `game-activity.ts` - GameActivityDB 实体
   - `index.ts` - 统一导出

2. **Client API 增强**
   - `Client.createApi(service)` 支持 service 参数
   - 请求包中包含 service 字段用于路由

3. **Worker 进程架构** (`src/electron/worker.ts`)
   - 实现 `MessageRoute.callback` 方法
   - 根据 service 字段路由到不同的 Handler
   - 初始化数据库连接

4. **Main 进程架构** (`src/electron/electron.ts`)
   - 注册 `mainAPI` IPC 处理器
   - 统一的 Handler 路由机制

### ✅ Handler 实现 (100%)

#### WorkerHandler (9个文件，49个方法)

1. **worker-fs-handler.ts** (10个方法)
   - readFile, writeFile, deleteFile, exists
   - readdir, readdirRecursive
   - mkdir, deleteDir, stat, lstat

2. **worker-zip-handler.ts** (2个方法)
   - createZipFromDirectory - 使用文件流
   - extractZip

3. **worker-crypto-handler.ts** (4个方法)
   - calculateFileHash, calculateDirectoryHash
   - calculateDirectorySize, createHash

4. **worker-database-handler.ts** (15个方法)
   - 游戏相关: saveGame, findGame, findGames, deleteGame
   - 存档相关: saveSave, findSaves, deleteSave, deleteSavesByGame
   - 历史相关: saveGameHistory, findGameHistory, deleteGameHistory
   - 攻略相关: saveGameGuide, findGameGuide
   - 活动相关: saveGameActivity, findGameActivities

5. **worker-process-handler.ts** (2个方法)
   - startGame, startGameWithLE

6. **worker-shell-handler.ts** (2个方法)
   - openPath, openExternal

7. **worker-icon-handler.ts** (1个方法)
   - extractFileIcon

8. **worker-update-handler.ts** (3个方法)
   - quitAndInstall, downloadUpdate, verifyFileHash

9. **worker-path-handler.ts** (10个方法)
   - join, resolve, dirname, basename, extname
   - isAbsolute, encodeGamePath, decodeGamePath
   - getCwd, getHostname

#### MainHandler (3个文件，11个方法)

1. **main-dialog-handler.ts** (2个方法)
   - showOpenFileDialog, showOpenDirectoryDialog

2. **main-app-handler.ts** (6个方法)
   - getVersion, getLoginItemSettings, setLoginItemSettings
   - isPackaged, getAppPath, getResourcesPath

3. **main-window-handler.ts** (3个方法)
   - createGameGuideWindow, closeGameGuideWindow, setWindowTop

### ✅ API 单例类 (100%)

1. **WorkerAPI** (`src/angular/app/library/worker-api-instance.ts`)
   ```typescript
   const api = WorkerAPI.getInstance();
   await api.fs.exists(path);
   await api.db.saveGame(game);
   await api.zip.createZipFromDirectory({dirPath, zipPath});
   ```

2. **MainAPI** (`src/angular/app/library/main-api-instance.ts`)
   ```typescript
   const api = MainAPI.getInstance();
   const result = await api.dialog.showOpenFileDialog(options);
   const version = await api.app.getVersion();
   ```

## 剩余迁移工作

### 🔄 需要迁移的文件

#### 1. 工具库 (`src/angular/app/library/`)

**utility.ts** - 需要迁移的方法：
- `calculateFileHash` → `workerAPI.crypto.calculateFileHash`
- `calculateDirectoryHash` → `workerAPI.crypto.calculateDirectoryHash`
- `calculateDirectorySize` → `workerAPI.crypto.calculateDirectorySize`
- `encodeGamePath` → `workerAPI.path.encodeGamePath`
- `decodeGamePath` → `workerAPI.path.decodeGamePath`
- `GameValidators.folder` → 异步验证器
- `GameValidators.file` → 异步验证器

#### 2. 服务层 (`src/angular/app/service/`)

**game.service.ts**
- 数据库操作 → `workerAPI.db.*`

**oss.service.ts**
- 文件读取 → `workerAPI.fs.readFile`

**setting.service.ts**
- 配置文件读取 → `workerAPI.fs.readFile`

**update.service.ts**
- 文件下载 → `workerAPI.update.downloadUpdate`
- 哈希验证 → `workerAPI.update.verifyFileHash`

**process-monitor.service.ts**
- `listProcesses()` 保留在渲染进程（binding-addon限制）

#### 3. 实体层 (`src/angular/app/entity/`)

**game.ts** - 需要迁移：
- 文件操作 → `workerAPI.fs.*`
- ZIP 压缩 → `workerAPI.zip.*`
- 哈希计算 → `workerAPI.crypto.*`
- 数据库操作 → `workerAPI.db.*`
- 进程启动 → `workerAPI.process.*`
- Shell 操作 → `workerAPI.shell.*`
- IPC 调用 → `mainAPI.*`

**save.ts** - 需要迁移：
- 数据库操作 → `workerAPI.db.*`
- 文件操作 → `workerAPI.fs.*`
- ZIP 压缩 → `workerAPI.zip.*`
- 哈希计算 → `workerAPI.crypto.*`

**remote-save.ts** - 需要迁移：
- 数据库操作 → `workerAPI.db.*`
- 文件操作 → `workerAPI.fs.*`

#### 4. 组件层 (`src/angular/app/main/`)

对话框调用 → `mainAPI.dialog.*`
应用 API 调用 → `mainAPI.app.*`
窗口管理调用 → `mainAPI.window.*`

## 迁移示例

### 示例 1: 文件哈希计算

**旧代码:**
```typescript
import {Utility} from '../library/utility';

const hash = await Utility.calculateFileHash(filePath);
```

**新代码:**
```typescript
import {workerAPI} from '../library/worker-api-instance';

const hash = await workerAPI.crypto.calculateFileHash(filePath);
```

### 示例 2: 数据库操作

**旧代码:**
```typescript
import {LocalGameDB} from '../database/game';
import {DatabaseUtil} from '../library/database';

const game = await DatabaseUtil.getRepository(LocalGameDB).save(newGame);
```

**新代码:**
```typescript
import {LocalGameDB} from '../../../shared/database';
import {workerAPI} from '../library/worker-api-instance';

const game = await workerAPI.db.saveGame(newGame);
```

### 示例 3: 对话框

**旧代码:**
```typescript
import {ipcRenderer} from 'electron';

const result = await ipcRenderer.invoke('show-open-dialog', options);
```

**新代码:**
```typescript
import {mainAPI} from '../library/main-api-instance';

const result = await mainAPI.dialog.showOpenFileDialog(options);
```

### 示例 4: 表单验证器

**旧代码 (同步):**
```typescript
class GameValidators {
  static folder(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;
    
    // ❌ 不能在渲染进程使用 fs
    return fs.existsSync(value) ? null : {folder: true};
  }
}
```

**新代码 (异步):**
```typescript
import {workerAPI} from '../library/worker-api-instance';

class GameValidators {
  static folder(control: AbstractControl): Promise<ValidationErrors | null> {
    const value = control.value;
    if (!value) return Promise.resolve(null);
    
    return workerAPI.fs.exists(value).then(exists => {
      return exists ? null : {folder: true};
    }).catch(() => {
      return {folder: true};
    });
  }
}

// 在表单中使用
this.form = this.fb.group({
  gamePath: ['', [Validators.required], [GameValidators.folder]], // 第三个参数是异步验证器
});
```

## 测试清单

### 功能测试
- [ ] 游戏导入功能
- [ ] 游戏启动功能
- [ ] 存档备份功能
- [ ] 存档恢复功能
- [ ] 云存档同步功能
- [ ] 用户设置功能
- [ ] 应用更新功能
- [ ] 游戏攻略功能
- [ ] 文件对话框
- [ ] 应用 API

### 性能测试
- [ ] API 调用延迟
- [ ] 数据库操作性能
- [ ] 大文件操作性能
- [ ] ZIP 压缩性能

### 验收标准
- [x] WorkerHandler 拆分为 9 个文件 (49 个方法)
- [x] MainHandler 拆分为 3 个文件 (11 个方法)
- [x] 所有 API 方法只接受一个参数对象
- [x] WorkerAPI 和 MainAPI 使用 createApi 创建
- [x] 支持命名空间访问
- [x] ZIP 创建方法使用文件流
- [x] 数据库操作已迁移到 Worker 进程
- [x] 使用单例模式，不依赖 Angular DI
- [x] 数据库实体提取到 shared 目录
- [ ] 渲染进程内不保留任何 Node 模块调用
- [ ] 表单验证器改为异步验证器
- [ ] MessageRoute.callback 方法正确实现
- [ ] Client.createApi 支持 service 参数
- [ ] 现有功能全部正常工作
- [ ] 代码通过 ESLint 和 TypeScript 检查

## 注意事项

### ⚠️ 重要提醒

1. **渲染进程完全隔离**
   - 渲染进程不能使用任何 Node 模块
   - 包括 `fs`, `path`, `crypto`, `os`, `child_process`, `http/https`
   - 必须通过 WorkerAPI 或 MainAPI 调用

2. **异步验证器**
   - 所有表单验证器必须改为异步
   - 使用 Promise 或 Observable 返回结果

3. **binding-addon 限制**
   - `listProcesses()` 只能在渲染进程使用
   - `extractFileIcon()` 需要确认 binding-addon 的实际导出

4. **导入路径**
   - 数据库实体从 `../../../shared/database` 导入
   - API 单例从 `../library/worker-api-instance` 导入
   - API 单例从 `../library/main-api-instance` 导入

5. **类型安全**
   - 使用 TypeScript 类型导入（`import type`）
   - Handler 类型定义在各自的文件中

## 下一步行动

### 立即需要做的：

1. **修复编译错误**
   - 更新 Angular 文件的导入路径
   - 添加缺失的类型声明

2. **迁移关键文件**
   - utility.ts
   - game.service.ts
   - game.ts (实体)
   - save.ts (实体)

3. **测试基本功能**
   - 游戏导入
   - 游戏启动
   - 存档备份

### 分阶段迁移建议：

**阶段 1: 核心功能 (3-5天)**
- utility.ts 工具函数
- game.service.ts 服务
- game.ts 实体

**阶段 2: 存档功能 (2-3天)**
- save.ts 实体
- remote-save.ts 实体

**阶段 3: 其他功能 (3-5天)**
- oss.service.ts
- setting.service.ts
- update.service.ts
- 组件层迁移

**阶段 4: 测试优化 (2-3天)**
- 全面功能测试
- 性能优化
- 代码审查

## 预计时间

- **已完成**: 基础设施搭建 (约 2 天)
- **剩余工作**: 迁移和测试 (约 10-15 天)
- **总计**: 约 12-17 天

## 相关文档

- [提案文档](openspec/changes/node-isolation/proposal.md)
- [设计文档](openspec/changes/node-isolation/design.md)
- [任务清单](openspec/changes/node-isolation/tasks.md)

# 变更：Angular 模块 Node API 隔离（最终版 v2）

## 为什么

当前 Angular 模块直接调用 Node API（fs、path、crypto、os、child_process、http/https、electron）和直接访问数据库，导致：
1. Angular 组件和服务与 Node 环境强耦合，无法独立测试和开发
2. 数据库操作分散在 Angular 各个模块中，难以维护和优化
3. 违反了 Electron 主进程与渲染进程分离的架构原则
4. 存在安全隐患，渲染进程拥有过多的系统权限

通过将 Node API 调用和数据库操作封装到 WorkerHandler 中，实现 Angular 模块与 Node 环境的解耦，提升代码的可测试性、安全性和可维护性。

## 变更内容

### 核心变更

1. **WorkerHandler（worker 进程）**
   - 文件位置：`src/electron/handler/worker-handler/`（拆分为多个文件）
   - 负责：文件读写、ZIP 压缩、哈希计算、数据库操作、进程启动、Shell 操作、图标提取、更新管理、路径处理等
   - 使用现有的 worker 进程架构
   - 拆分为多个 Handler 类，通过 `Route.compose` 合并

2. **MainHandler（electron 主进程）**
   - 文件位置：`src/electron/handler/main-handler.ts`
   - 负责：对话框、应用 API、窗口管理等 Electron UI 特有功能
   - 使用 IPC 通信

3. **API 设计原则**
   - 直接传路径而不是业务 ID
   - ZIP 创建方法直接写文件，不返回 Buffer
   - 减少内存占用，提升性能

4. **Angular 封装方式**
   - 使用单例模式
   - 使用 Proxy 动态生成 API 调用（类似 `createApi`）
   - 提供完整的类型提示
   - 支持命名空间访问（如 `workerAPI.fs.access()`）

5. **Handler 组织方式**
    - WorkerHandler 拆分为多个文件：
      - `worker-fs-handler.ts` - 文件系统
      - `worker-zip-handler.ts` - ZIP 压缩
      - `worker-zip-handler.ts` - ZIP 压缩
      - `worker-crypto-handler.ts` - 哈希计算
      - `worker-database-handler.ts` - 数据库
      - `worker-process-handler.ts` - 进程管理
      - `worker-shell-handler.ts` - Shell 操作
      - `worker-icon-handler.ts` - 图标提取
      - `worker-update-handler.ts` - 更新管理
      - `worker-path-handler.ts` - 路径处理
    - 通过 `MessageRoute.callback` 根据 service 字段路由到不同的 Handler

6. **数据库迁移**
   - 一步到位完成迁移
   - 数据库实体提取到共享目录 `src/shared/database/`

7. **渲染进程完全隔离**
   - 渲染进程内不能保留任何 Node 模块调用
   - 表单验证器改为异步验证器（使用 WorkerAPI）
   - 所有文件系统、路径、加密等操作通过 WorkerAPI 调用

### **重大变更**

- **Handler 组织**: WorkerHandler 拆分为 9 个文件，通过 `MessageRoute.callback` 路由
- **API 架构**: 使用 `client_.createApi<Handler>('service')` 创建 API，service 字段封装在请求包中
- **RPC 参数限制**: 所有方法只接受一个参数对象（如 `join({paths: string[]})`）
- **ZIP 方法**: 使用文件流处理，直接写文件
- **数据库访问**: 从 Angular 渲染进程迁移到 worker 进程（一步到位）
- **封装方式**: 单例模式 + `createApi`，提供完整类型提示
- **完全隔离**: 渲染进程内不能保留任何 Node 模块调用，验证器改为异步

## 影响

### 受影响规范
- `game-management` - 游戏管理（文件操作、进程启动、数据库）
- `save-management` - 存档管理（文件压缩、哈希计算、数据库）
- `user-management` - 用户管理（文件上传、数据库）

### 受影响代码

#### Worker 进程（拆分为多个文件）
- `src/electron/worker.ts` - Worker 进程入口（实现 Route.compose）
- `src/electron/handler/worker-handler/` - Worker Handler 目录
  - `worker-fs-handler.ts` - 文件系统 Handler
  - `worker-zip-handler.ts` - ZIP 压缩 Handler
  - `worker-crypto-handler.ts` - 哈希计算 Handler
  - `worker-database-handler.ts` - 数据库 Handler
  - `worker-process-handler.ts` - 进程管理 Handler
  - `worker-shell-handler.ts` - Shell 操作 Handler
  - `worker-icon-handler.ts` - 图标提取 Handler
  - `worker-update-handler.ts` - 更新管理 Handler
  - `worker-path-handler.ts` - 路径处理 Handler
  - `index.ts` - 导出合并后的 Handler

#### 主进程
- `src/electron/handler/main-handler.ts` - Main Handler（仅 UI 相关）

#### 共享数据库实体
- `src/shared/database/` - 数据库实体定义

#### Angular 单例类
- `src/app/library/worker-api.ts` - WorkerAPI 单例（使用 Proxy）
- `src/app/library/main-api.ts` - MainAPI 单例（使用 Proxy）

### 新增文件
- `src/electron/handler/worker-handler/*.ts` - 拆分的 Handler 文件
- `src/app/library/worker-api.ts` - WorkerAPI 单例
- `src/app/library/main-api.ts` - MainAPI 单例
- `src/shared/database/*.ts` - 数据库实体定义

### 风险评估
- **低风险**: 功能行为不变，仅重构调用方式
- **中风险**: Handler 拆分和 Route.compose 实现需要仔细测试
- **测试要求**: 需要全面的功能测试

## 实施计划

### 阶段 1: 基础设施（3-4 天）
1. 提取数据库实体到 `src/shared/database/`
2. 实现 `Route.compose` 方法
3. 创建 WorkerAPI 和 MainAPI 单例类（使用 Proxy）
4. 在 Worker 进程初始化数据库

### 阶段 2: WorkerHandler 实现（7-9 天）
1. 实现各个子 Handler（9 个文件）
2. 使用 `Route.compose` 合并所有 Handler
3. 测试合并后的 Handler

### 阶段 3: MainHandler 实现（1-2 天）
1. 实现对话框 API
2. 实现应用 API
3. 实现窗口管理 API

### 阶段 4: 全面迁移（6-8 天）
1. 迁移工具库
2. 迁移服务层（包括所有数据库调用）
3. 迁移实体层（所有数据库调用）
4. 迁移组件层

### 阶段 5: 测试和优化（2-3 天）
1. 功能测试
2. 性能测试
3. 代码审查
4. 文档更新

**总计**: 19-26 天

## 验收标准

1. WorkerHandler 拆分为 9 个文件，通过 `MessageRoute.callback` 路由
2. MainHandler 拆分为 3 个文件，仅负责 UI 相关功能
3. WorkerAPI 和 MainAPI 使用 `client_.createApi<Handler>('service')` 创建 API
4. 支持命名空间访问（如 `workerAPI.fs.exists()`）
5. 所有方法只接受一个参数对象（如 `join({paths: string[]})`）
6. ZIP 创建方法使用文件流，直接写文件
7. 数据库操作已完全迁移到 Worker 进程
8. 渲染进程内不保留任何 Node 模块调用
9. 表单验证器改为异步验证器
10. 现有功能全部正常工作
11. 代码通过 ESLint 和 TypeScript 检查

## 相关文档

- `doc/angular_node.md` - Angular 模块 Node API 使用情况详细分析
- `.ai/doc/project.md` - 项目架构文档
- `src/electron/worker.ts` - Worker 进程实现（包含 MessageRoute.callback）
- `src/electron/handler/worker-handler/` - Worker Handler 目录
- `src/app/library/worker-api.ts` - WorkerAPI 单例
- `src/app/library/main-api.ts` - MainAPI 单例
- `src/angular/app/library/worker-api.ts` - Client 类（包含 createApi 方法）

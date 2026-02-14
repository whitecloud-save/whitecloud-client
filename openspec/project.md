# 项目上下文

## 目的

whitecloud-client 是一个基于 Electron + Angular 的桌面客户端应用，用于管理游戏存档和与 whitecloud-server 服务端进行云存档同步。项目采用分层架构，支持本地数据管理和与服务端的实时通信。

## 技术栈

### 核心技术

- **运行时**: Node.js 20+
- **语言**: TypeScript 5.5+
- **桌面框架**: Electron 32
- **前端框架**: Angular 18
- **构建工具**: Angular CLI, Electron Forge

### 数据存储

- **本地数据库**: SQLite (通过 TypeORM)
- **数据库同步模式**: synchronize (自动同步)
- **数据库文件**: `data/db.sqlite`

### 服务端通信

- **HTTP 通信**: Axios
- **WebSocket 通信**: WebSocket API
- **API 类型声明**: 由服务端生成 (dist-api-declaration/api.ts)

### UI 组件库

- **组件库**: ng-zorro-antd 18 (Ant Design for Angular)
- **图标**: @fortawesome (Pro 和 Free 版本)

### 外部服务

- **阿里云 OSS**: 文件存储服务
- **whitecloud-server**: 服务端 API 和 WebSocket

### 开发工具

- **代码检查**: ESLint (TypeScript ESLint)
- **代码格式化**: Angular Style Guide
- **类型检查**: TypeScript 严格模式

## 项目约定

### 代码风格

#### 命名约定

- **变量**: camelCase
- **常量**: UPPER_CASE
- **类/接口/组件**: PascalCase
- **函数**: camelCase
- **文件名**:
  - 组件: `name.component.ts`
  - 服务: `name.service.ts`
  - 管道: `name.pipe.ts`
  - 模块: `name.module.ts`
- **模块**: PascalCase (如 `GameModule`, `UserModule`)

#### 代码格式

- **缩进**: 2 空格
- **引号**: 单引号
- **分号**: 必须使用
- **尾随逗号**: 多行时必须
- **函数声明**:
  - 箭头函数: `() => { }`
  - 命名函数: `function name() { }`

#### 导入规则

- 使用 `import` 而非 `require`
- 优先使用 ES 模块语法
- 未使用的导入必须移除
- 导入顺序:
  1. Angular 核心
  2. 第三方库
  3. 项目模块
  4. 相对路径导入

#### 类型注解

- 使用 TypeScript 强类型
- 不允许 `any` 类型
- 使用 interface 定义公共接口
- 使用 type 定义类型别名

### 架构模式

#### 目录结构

```
src/
├── app/
│   ├── main/              # 主模块
│   │   ├── components/    # 主模块组件
│   │   ├── dialog/        # 对话框
│   │   ├── pages/         # 页面
│   │   ├── pipes/         # 管道
│   │   ├── main-routing.module.ts
│   │   ├── main.service.ts
│   │   └── main.module.ts
│   ├── service/           # 服务
│   │   ├── server/        # 服务端通信
│   │   ├── game.service.ts
│   │   ├── user.service.ts
│   │   └── ...
│   ├── database/          # 数据库实体
│   ├── entity/            # 服务端实体类型
│   ├── library/           # 工具库
│   ├── app-routing.module.ts
│   ├── app.module.ts
│   └── app.component.ts
├── electron.ts            # Electron 主进程
└── environments/          # 环境配置
```

#### 架构原则

- **分层架构**: 组件层 → 服务层 → 数据层
- **模块化设计**: 按功能模块组织代码
- **响应式编程**: 使用 RxJS 处理异步操作
- **类型安全**: 全面的 TypeScript 类型定义

#### 应用模式

- **主进程模式**: Electron 主进程负责系统集成
- **渲染进程模式**: Angular 应用负责 UI 渲染
- **IPC 通信**: 主进程与渲染进程之间的通信

### 测试策略

- 使用 Karma + Jasmine 进行单元测试
- 建议为关键服务和组件编写测试
- 使用 Angular TestBed 进行组件测试

### Git 工作流

#### 提交规范

- 提交信息格式建议遵循 Conventional Commits
- 使用中文编写提交信息
- 使用 `/commit` 命令生成提交信息

#### 分支策略

- `main/master`: 主分支
- 特性分支: `feature/xxx`
- 修复分支: `fix/xxx`
- 建议使用 PR 进行代码合并

## 领域上下文

### 核心领域

- **游戏管理**: 游戏导入、扫描、编辑
- **存档管理**: 本地存档扫描、云存档同步
- **用户管理**: 登录、注册、VIP 管理
- **服务端通信**: API 调用、WebSocket 连接
- **设置管理**: 基础设置、高级设置、用户设置

### 业务概念

- **游戏**: 用户管理的 PC 游戏
- **存档**: 游戏的本地和云端存档
- **用户**: 系统的使用者
- **客户端**: 桌面应用实例
- **服务端**: 后端服务器

## 重要约束

### 技术约束

- 必须使用 TypeScript 5.5+
- 必须使用 Angular 18
- 必须使用 Electron 32
- 必须通过 ESLint 检查
- 必须使用 TypeScript 严格模式

### 业务约束

- 本地数据库使用 SQLite，使用 synchronize 模式自动同步
- 服务端 API 调用必须正确处理错误
- WebSocket 连接必须支持断线重连
- 用户数据必须安全存储

### 性能约束

- 本地存档扫描必须优化性能
- 云存档同步必须支持增量更新
- UI 响应时间应控制在合理范围内

## 外部依赖

### 框架依赖

- **@angular/core**: Angular 核心框架
- **@angular/common**: Angular 通用模块
- **@angular/forms**: Angular 表单模块
- **@angular/router**: Angular 路由模块
- **@angular/material**: Angular Material (ng-zorro-antd)

### Electron 依赖

- **electron**: Electron 框架
- **@electron/remote**: Electron 远程模块
- **@electron-forge/cli**: Electron 打包工具

### 数据库依赖

- **typeorm**: ORM 框架
- **sqlite3**: SQLite 数据库驱动

### 工具库依赖

- **rxjs**: 响应式编程库
- **axios**: HTTP 客户端
- **uuid**: UUID 生成
- **jszip**: ZIP 文件处理
- **qrcode**: 二维码生成
- **mkdirp**: 目录创建
- **moment**: 时间处理

### 服务端依赖

- **@whitecloud-save/binding-addon**: 游戏存档绑定（原生模块）

## OpenSpec 约定

### 变更提案

- 使用 openspec-cn 管理变更提案
- 提案必须包含 proposal.md、tasks.md
- 规范增量使用 `## 新增需求|修改需求|移除需求` 格式
- 每个需求必须包含至少一个场景 (`#### 场景：`)

### 规范文件

- 存放在 `openspec/specs/` 目录
- 按功能模块组织
- 使用需求-场景格式描述功能

### CLI 命令

```bash
openspec-cn list                  # 列出活动变更
openspec-cn list --specs          # 列出规范
openspec-cn show [item]           # 显示变更或规范
openspec-cn validate [item]       # 验证变更或规范
openspec-cn archive <change-id>   # 归档变更
```

### 客户端特有约定

- **本地数据库**: 使用 synchronize 模式，不需要手动迁移
- **API 类型声明**: 从服务端获取，不需要手动维护
- **UI 组件**: 使用 ng-zorro-antd 组件库
- **路由管理**: 使用 Angular Router
- **状态管理**: 使用 RxJS (BehaviorSubject, Observable)

### 设计模式

- **服务模式**: 使用 Angular Service 管理业务逻辑
- **组件模式**: 使用 Angular Component 构建 UI
- **管道模式**: 使用 Angular Pipe 处理数据转换
- **注入模式**: 使用 Angular 依赖注入
- **响应式模式**: 使用 RxJS Observable 处理异步数据流

# Whitecloud Client 项目总览

## 项目简介

whitecloud-client 是一个基于 Electron + Angular 18 构建的桌面客户端应用，用于管理游戏存档和与 whitecloud-server 服务端进行云存档同步。提供游戏管理、本地存档管理、云存档同步、用户认证等核心功能。

## 技术栈

### 核心框架
- **桌面框架**：Electron 32
- **前端框架**：Angular 18
- **语言**：TypeScript 5.5+
- **UI 组件库**：ng-zorro-antd 18 (Ant Design for Angular)
- **数据库**：SQLite + TypeORM
- **HTTP 客户端**：Axios
- **状态管理**：RxJS (BehaviorSubject, Observable)

### 主要依赖库
- **游戏存档绑定**：@whitecloud-save/binding-addon
- **文件压缩**：jszip
- **二维码生成**：qrcode
- **UUID 生成**：uuid
- **目录操作**：mkdirp
- **时间处理**：moment

### 开发工具
- **构建工具**：Angular CLI
- **打包工具**：Electron Forge
- **代码检查**：ESLint
- **代码格式化**：Angular Style Guide

## 项目架构

### 架构特点
- **Electron 架构**：主进程与渲染进程分离，通过 IPC 通信
- **Angular 架构**：基于模块、组件、服务的 MVC 架构
- **响应式编程**：使用 RxJS 处理异步操作和状态管理
- **本地数据库**：SQLite 数据库存储本地游戏和存档信息
- **服务端通信**：通过 WebSocket（实时通信）和 HTTP（RESTful API）与服务端通信
- **类型安全**：使用 TypeScript 提供类型安全，包含服务端 API 类型声明

### 进程通信
- **主进程**：Electron 主进程（`src/electron.ts`）
- **渲染进程**：Angular 应用（`src/app/`）
- **IPC 通信**：主进程与渲染进程之间的通信
- **WebSocket 通信**：与服务端实时通信
- **HTTP 通信**：与服务端 RESTful API 通信

### 启动模式
1. **开发模式**：同时运行 Electron 和 Angular 开发服务器（`npm run dev`）
2. **构建模式**：构建 Angular 和 Electron，打包为可执行文件（`npm run build`）

### 系统托盘
- **图标**：使用 `src/assets/icon.png` 作为托盘图标
- **交互**：双击托盘图标显示/隐藏主窗口
- **菜单**：右键菜单提供"显示窗口"和"退出应用"选项
- **窗口行为**：关闭窗口时隐藏而非退出，应用继续在后台运行

## 核心业务模块

### 1. 主模块（Main Module）

**文件位置**：`src/app/main/`

**核心功能**：
- 应用主界面布局
- 页面路由管理
- 导航服务
- 设置管理

**主要页面**：
- **仪表盘**（Dashboard）：游戏列表、存档统计
- **游戏页面**（Game）：单个游戏的详细信息和存档管理
- **设置页面**（Setting）：基础设置、高级设置、用户设置

**主要组件**：
- **HeaderComponent**：顶部导航栏
- **GameCoverComponent**：游戏封面展示
- **GameSaveTableComponent**：游戏存档表格
- **GameStateComponent**：游戏状态指示器
- **GameActivityTimelineComponent**：游戏活动时间线（展示游戏动态，支持实时更新）

---

### 2. 游戏模块（Game Module）

**文件位置**：`src/app/main/pages/game/`

**核心功能**：
- 游戏导入（扫描本地游戏、手动添加）
- 游戏详情编辑（封面、名称、路径等）
- 本地存档扫描
- 云存档同步
- 游戏启动
- 游戏动态实时更新（Game 类通过 `activityUpdate$` 通知组件刷新）

**数据模型**：
- **LocalGameDB**（本地）：本地游戏信息（名称、路径、封面、额外设置等）
- **SaveDB**（本地）：本地游戏存档（路径、大小、时间等）
- **GameHistoryDB**（本地）：游戏历史记录
- **GameGuideDB**（本地）：游戏指南

**游戏状态（GameState）**：
- **Init**（1）：初始化状态
- **Checked**（2）：正常状态，可以正常操作
- **Running**（3）：游戏正在运行
- **Saving**（4）：正在备份存档
- **SaveSizeExceeded**（5）：存档超过备份上限，禁用自动备份
- **Cloud**（80）：云端状态
- **Error**（99）：错误状态

**游戏历史记录同步**：
- 游戏退出时自动创建历史记录（synced=0，使用 UUID 作为主键，createTime 为游戏结束时间）
- 游戏退出后自动同步历史记录到服务器（传递 id、gameId、host、startTime、endTime），成功后设置 synced=1
- 登录后自动同步所有未同步的历史记录（synced=0）
- 从服务器获取游戏历史记录时，通过 UUID 检查数据库避免重复添加，支持基于 lastSyncTime 的增量同步
- 支持实时通知更新和删除历史记录（通知包含 createTime 字段）
- 本地记录最后同步时间（lastGameHistorySyncTime），用于增量同步

**服务**：
- **GameService**：游戏管理服务
- **GameImportService**：游戏导入服务

---

### 3. 用户模块（User Module）

**文件位置**：`src/app/service/user.service.ts`

**核心功能**：
- 用户登录/注册
- 用户信息管理
- Token 管理
- VIP 信息管理
- 云存储空间管理

**数据模型**：
- **IUserInfo**（本地）：用户信息（id、nickname、avatar、vipInfo、storageInfo）
- **AccountVIP**（服务端）：VIP 信息（level、space、expireTime）
- **IStorageInfo**（服务端）：存储信息（usedSpace、totalSpace）

**对话框**：
- **UserLoginRegisterComponent**：登录/注册对话框
- **UserModifyNicknameComponent**：修改昵称对话框
- **UserForgetPasswordComponent**：忘记密码对话框

---

### 4. 服务端通信模块（Server Module）

**文件位置**：`src/app/service/server/`

**核心功能**：
- 服务端连接管理
- WebSocket 通信
- HTTP 通信
- API 调用封装

**服务**：
- **ServerService**：服务端通信抽象基类
- **HttpServerService**：HTTP 服务端通信实现
- **WebSocketServerService**：WebSocket 服务端通信实现
- **TokenService**：Token 管理
- **APIService**：服务端 API 类型声明（`api.ts`）

**通信协议**：
- **WebSocket**：实时通知、推送
- **HTTP**：RESTful API 调用
- **Handler**：
  - `AuthHandler`：认证相关
  - `BusinessHandler`：业务相关（游戏同步、存档同步、游戏历史记录同步、OSS 签名）
  - `ClientNotifyHandler`：客户端通知（用户信息更新、游戏更新、存档更新、游戏历史记录更新）
  - `GatewayHandler`：网关相关
  - `PaymentHandler`：支付相关

---

### 5. 存档管理模块（Save Module）

**文件位置**：`src/app/main/pages/game/game-save/`

**核心功能**：
- 本地存档扫描
- 云存档上传/下载
- 存档备注编辑
- 存档收藏
- 存档对比功能（基于哈希和大小）
- 存档操作限制（state 为 current 的存档不显示回滚和删除按钮）
- 存档备份大小限制（超过上限时禁用自动备份）
- 存档传输状态管理（上传/下载时禁用相关按钮，超过1秒显示进度通知）

**存档备份大小限制机制**：
- **全局设置**：在基础设置中配置默认备份上限（10MB-100MB，默认 100MB）
- **游戏设置**：可为单个游戏配置自定义备份上限
- **状态检测**：Game 初始化时检测存档文件夹大小，超过限制时进入 `SaveSizeExceeded` 状态
- **自动备份控制**：`SaveSizeExceeded` 状态下禁用自动备份
- **手动备份**：超限时手动备份需确认对话框
- **UI 提示**：游戏导航栏下方显示黄底提示条

**存档传输状态管理**：
- **服务**：`SaveTransferService` 管理存档上传/下载状态
- **状态指示器**：`SaveTransferIndicatorComponent` 显示在头部，展示当前传输状态
- **按钮禁用**：当正在上传或下载存档时，所有上传和下载按钮被禁用
- **进度通知**：上传/下载超过1秒后，显示 ng-zorro Notification 提示当前进度
- **通知关闭**：传输完成或失败后自动关闭通知
- **状态订阅**：`GameSaveTableComponent` 订阅传输状态，实时更新按钮可用性
- **图标区分**：上传显示云上传图标，下载显示云下载图标
- **点击详情**：点击状态指示器弹出 Notification 显示存档详情

**数据模型**：
- **SaveDB**：本地存档信息（包含 directoryHash、zipHash、directorySize 字段用于对比）
- **RemoteSave**：远程存档信息（服务端返回）

**存档对比机制**：
- **目录哈希**：计算存档目录中所有文件的 SHA1 哈希（前 10 位）
- **目录大小**：计算存档目录未压缩的总大小
- **ZIP 哈希**：计算 ZIP 文件的 SHA1 哈希（前 10 位）
- **双层检查**：先检查目录大小，再比较目录哈希，提升性能
- **缓存机制**：Game 类使用 `currentSave_` 私有变量缓存与当前存档一致的最新备份
- **缓存更新时机**：
  - Game 初始化时（软件启动、远端游戏同步）
  - 创建新存档时（自动备份、手动备份）
  - 存档回滚后

**服务**：
- **Game.getCurrentSave()**：获取与当前存档一致的最新备份
- **Utility.calculateDirectoryHash()**：计算目录哈希
- **Utility.calculateDirectorySize()**：计算目录大小
- **Utility.calculateFileHash()**：计算文件哈希（ZIP 文件）
- **SaveTransferService**：管理存档上传/下载状态和进度通知

**对话框**：
- **SaveRemarkEditorComponent**：存档备注编辑器
- **SyncRemoteGameDialogComponent**：同步远程游戏对话框

---

### 6. OSS 服务模块（OSS Module）

**文件位置**：`src/app/service/oss.service.ts`

**核心功能**：
- 文件上传到阿里云 OSS
- 签名生成
- URL 签名

**使用场景**：
- 头像上传
- 游戏封面上传
- 存档上传

---

### 7. 设置模块（Setting Module）

**文件位置**：`src/app/main/pages/setting/`

**核心功能**：
- 基础设置（语言、主题等）
- 高级设置（数据库路径、日志等）
- 用户设置（昵称、头像等）
- 会员中心（VIP 状态、会员到期时间、云存储空间使用情况）

**组件**：
- **BasicSettingComponent**：基础设置
- **AdvancedSettingComponent**：高级设置
- **UserSettingComponent**：用户设置

**UserSettingComponent 功能**：
- 未登录状态：显示提示信息"登录账号以开启云同步存档功能"
- 已登录状态：
  - 会员中心：显示 VIP 状态（VIP 标识或普通用户标签）、会员到期时间（付费会员）、成为会员按钮（非付费会员）
  - 云存储空间：显示总存储空间和已使用空间，使用进度条可视化
  - 用户操作：修改昵称、充值、登出

**服务**：
- **SettingService**：设置管理服务

---

### 8. 对话框模块（Dialog Module）

**文件位置**：`src/app/main/dialog/`

**核心功能**：
- 用户登录/注册
- 游戏导入
- 存档备注编辑
- 同步远程游戏
- 存储空间不足提示

**主要对话框**：
- **GameImportDialogComponent**：游戏导入对话框
- **UserLoginRegisterComponent**：用户登录/注册对话框
- **UserModifyNicknameComponent**：修改昵称对话框
- **UserForgetPasswordComponent**：忘记密码对话框
- **SaveRemarkEditorComponent**：存档备注编辑器
- **SyncRemoteGameDialogComponent**：同步远程游戏对话框
- **StorageFullDialogComponent**：存储空间不足提示对话框

**StorageFullDialogComponent 功能**：
- 显示存储空间已满提示
- 显示已使用/总存储空间
- 提供管理存档入口
- 提供升级 VIP 入口（非 VIP 用户）

---

### 9. 工具库模块（Library Module）

**文件位置**：`src/app/library/`

**核心功能**：
- 错误处理
- 数据库工具
- 工具函数
- 图片缓存

**主要模块**：
- **error**：错误类型和错误码定义
  - `BaseError`：基础错误类
  - `ErrorCode`：错误码定义
  - `NetError`：网络错误
  - `ServerError`：服务端错误
  - `UserError`：用户错误
- **database**：数据库工具
- **utility**：工具函数
- **cache-image**：图片缓存

---

## 数据库设计

### 数据库连接
- 使用 TypeORM 进行 ORM 映射
- 数据库类型：SQLite
- 数据库文件：`data/db.sqlite`
- 同步模式：`synchronize: true`（自动同步数据库结构）

### 核心表结构
1. **本地游戏**：`local_game_db`（LocalGameDB）
2. **本地存档**：`save_db`（SaveDB）
3. **游戏历史**：`game_history_db`（GameHistoryDB）
4. **游戏指南**：`game_guide_db`（GameGuideDB）

### 实体定义

#### LocalGameDB（本地游戏）
```typescript
{
  id: string,           // UUID
  name: string,         // 游戏名称
  gamePath: string,     // 游戏路径
  savePath: string,     // 存档路径
  exeFile: string,      // 可执行文件名
  createTime: number,   // 创建时间
  coverImgUrl: string,  // 封面图片 URL
  localSaveNum: number, // 本地存档数量
  autoOpenGuide: boolean, // 自动打开指南
  order: number,        // 排序
  extraSetting: object,  // 额外设置（LEProfile 等）
  updateTime: number,   // 更新时间
  lastGameHistorySyncTime: number,  // 最后一次同步游戏历史记录的时间戳
  saveBackupLimit: number,  // 自定义备份上限（单位 MB，默认 100）
  useCustomSaveBackupLimit: boolean,  // 是否使用自定义备份上限（默认 false）
}
```

#### SaveDB（本地存档）
```typescript
{
  id: string,           // UUID
  gameId: string,        // 游戏ID
  path: string,         // 存档路径
  size: number,         // 存档大小（ZIP 文件大小）
  updateTime: number,    // 更新时间
  directoryHash: string | null,   // 目录哈希（用于存档对比）
  zipHash: string | null,        // ZIP 文件哈希（用于验证完整性）
  directorySize: number | null,   // 目录未压缩大小（用于快速筛选）
}
```

#### GameHistoryDB（游戏历史记录）
```typescript
{
  id: string,           // UUID（主键）
  gameId: string,        // 游戏 UUID（主键）
  host: string,          // 主机名
  startTime: number,     // 开始时间（Unix 时间戳）
  endTime: number,       // 结束时间（Unix 时间戳）
  synced: number,       // 同步状态（0：未同步，1：已同步）
  createTime: number,    // 创建时间（Unix 时间戳）
}
```

---

## 服务端通信

### 通信方式
- **WebSocket**：实时通知、推送（WebSocketServerService）
- **HTTP**：RESTful API 调用（HttpServerService）

### 服务端 API 类型声明
- **文件位置**：`src/app/service/server/api.ts`
- **作用**：提供服务端 API 的 TypeScript 类型定义
- **来源**：由服务端的 `sora build:api-declare` 命令生成

### Handler 系统
- **AuthHandler**：认证相关（登录、注册、登出、信息查询）
- **BusinessHandler**：业务相关（游戏同步、存档同步、OSS 签名）
- **ClientNotifyHandler**：客户端通知（用户信息更新、游戏更新、存档更新、游戏历史记录更新）
- **GatewayHandler**：网关相关
- **PaymentHandler**：支付相关

### 游戏动态更新机制
- **通知源**：`Game.activityUpdate$`（BehaviorSubject<string>）
- **订阅者**：`GameActivityTimelineComponent` 订阅并实时刷新
- **触发场景**：
  - 游戏退出时（新增历史记录）
  - 存档备份完成时（本地/云端备份、上传失败）
  - 从服务器同步历史记录时（通过 WebSocket 通知）

---

## 目录结构

```
src/
├── app/                    # 应用主目录
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
│   │   ├── oss.service.ts
│   │   └── ...
│   ├── database/          # 数据库实体
│   │   ├── game.ts
│   │   ├── save.ts
│   │   ├── game-history.ts
│   │   └── game-guide.ts
│   ├── entity/            # 服务端实体类型
│   │   ├── game.ts
│   │   ├── remote-game.ts
│   │   ├── remote-save.ts
│   │   └── save.ts
│   ├── library/           # 工具库
│   │   ├── error/         # 错误处理
│   │   ├── database.ts    # 数据库工具
│   │   ├── utility.ts     # 工具函数
│   │   └── cache-image.ts # 图片缓存
│   ├── app-routing.module.ts
│   ├── app.module.ts
│   └── app.component.ts
├── electron.ts            # Electron 主进程
├── main.ts                # Angular 入口
└── environments/          # 环境配置
```

---

## 常用命令

### 开发
```bash
npm run dev          # 开发模式启动（Electron + Angular）
npm run start:electron # 启动 Electron
npm run ng:serve     # 启动 Angular 开发服务器
```

### 构建
```bash
npm run build:angular   # 构建 Angular
npm run build:electron  # 构建 Electron
npm run build           # 完整构建（Angular + Electron + 打包）
npm run build:package   # 打包为可执行文件
```

### Angular CLI
```bash
ng serve               # 启动开发服务器
ng build               # 构建项目
ng test                # 运行测试
ng generate component   # 生成组件
ng generate service    # 生成服务
ng generate module     # 生成模块
```

---

## 错误处理

### 错误类型
- **NetError**：网络错误（请求失败、网络异常）
- **ServerError**：服务端错误（服务端返回的错误）
- **UserError**：用户错误（用户输入错误、权限不足）
- **BaseError**：基础错误类

### 错误码
- 服务端错误码：参考 `src/app/service/server/api.ts` 中的 `UserErrorCode`

---

## 安全机制

### Token 管理
- Token 存储在本地
- Token 过期处理
- 自动刷新 Token

### 数据加密
- 密码加密（由服务端处理）
- 敏感数据本地加密

### 权限控制
- 基于服务端的权限系统
- 用户组权限验证

---

## 开发规范

### 代码风格
- TypeScript 严格模式
- ESLint 代码检查
- 遵循 Angular 官方风格指南
- 命名规范：camelCase（变量）、PascalCase（类、组件、服务）、UPPER_CASE（常量）

### Git 提交
- 使用 Conventional Commits 规范
- 提交信息使用中文
- 禁止使用 `git reset`

### 数据库操作
- 使用 TypeORM 管理数据库
- 禁止直接操作数据库文件
- 使用 synchronize 模式自动同步数据库结构

---

## 配置管理

### 配置文件
- **开发环境**：`src/environments/environment.dev.ts`
- **生产环境**：`src/environments/environment.prod.ts`
- **环境选择**：`src/environments/environment.ts`

### 配置内容
- 服务端地址
- API 地址
- WebSocket 地址
- OSS 配置

---

## 部署说明

### 构建
- **Angular 构建**：`npm run build:angular`
- **Electron 构建**：`npm run build:electron`
- **完整构建**：`npm run build`

### 打包
- **Electron Forge**：`npm run build:package`
- **支持平台**：Windows（Squirrel）、Linux（DEB、RPM）、macOS（DMG、ZIP）

---

## 待扩展功能

根据当前代码结构，项目支持以下扩展方向：

1. **更多游戏平台支持**：扩展支持 Steam、Epic、Uplay 等平台游戏
2. **更多存档功能**：扩展支持存档备份、恢复、对比等功能
3. **更多社交功能**：扩展支持游戏社区、分享等功能
4. **更多云存储服务**：扩展支持其他云存储服务（如 AWS S3、腾讯云 COS）
5. **性能优化**：优化存档扫描速度、同步速度等

---

## 版本信息

- **当前版本**：0.0.0
- **Node 版本**：20.0.0+
- **TypeScript 版本**：5.5+
- **Angular 版本**：18.2.0+
- **Electron 版本**：32.0.0+

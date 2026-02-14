# WhitecloudClient

基于 Electron + Angular 的桌面应用程序。

## 项目简介

WhitecloudClient 是一款现代化的桌面应用，使用 Angular 17 作为前端框架，Electron 30 作为桌面应用框架，提供优秀的用户体验和跨平台支持。

## 开发

运行 `npm run dev` 启动开发服务器。应用会自动监听文件变化并重新加载。

## 构建

运行 `npm run build` 构建项目。构建产物将存储在 `dist/` 目录。

## 测试

运行 `ng test` 执行单元测试。

## 开源项目

本项目使用了以下开源项目，感谢这些优秀的开源贡献者：

### 核心框架

- **[Angular 17](https://angular.io/)** - 现代化的 Web 应用框架
- **[Electron 30](https://www.electronjs.org/)** - 使用 JavaScript、HTML 和 CSS 构建跨平台桌面应用的框架

### UI 组件库

- **[ng-zorro-antd 17](https://ng.ant.design/)** - Ant Design 的 Angular 实现，提供 70+ 高质量组件
- **[FontAwesome](https://fontawesome.com/)** - 业界领先的图标库和工具箱

### 数据库

- **[SQLite3](https://www.sqlite.org/)** - 轻量级、嵌入式的关系型数据库
- **[TypeORM](https://typeorm.io/)** - 基于 TypeScript 的 ORM 框架，支持多种数据库

### HTTP 客户端

- **[Axios](https://axios-http.com/)** - 基于 Promise 的 HTTP 客户端，支持浏览器和 Node.js

### 工具库

- **[JSZip](https://stuk.github.io/jszip/)** - 用于创建、读取和编辑 .zip 文件的 JavaScript 库
- **[QRCode](https://github.com/soldair/node-qrcode)** - 二维码生成库
- **[UUID](https://github.com/uuidjs/uuid)** - 生成符合 RFC4122 标准的 UUID
- **[mkdirp](https://github.com/isaacs/node-mkdirp)** - 递归创建目录的 Node.js 模块
- **[Moment.js](https://momentjs.com/)** - 用于解析、验证、操作和显示日期和时间的 JavaScript 库
- **[extract-file-icon](https://github.com/sindresorhus/extract-file-icon)** - 从文件中提取图标的库

### Electron 相关

- **[@electron/remote](https://www.npmjs.com/package/@electron/remote)** - Electron 的主进程和渲染进程之间进行通信的模块
- **[Electron Forge](https://www.electronforge.io/)** - 用于构建、打包和发布 Electron 应用程序的一站式工具

### 开发工具

- **[TypeScript](https://www.typescriptlang.org/)** - JavaScript 的超集，提供类型安全
- **[ESLint](https://eslint.org/)** - JavaScript 代码检查工具
- **[Karma](https://karma-runner.github.io/)** - JavaScript 测试运行器
- **[Jasmine](https://jasmine.github.io/)** - JavaScript 行为驱动开发框架
- **[npm-run-all](https://www.npmjs.com/package/npm-run-all)** - 并行或顺序运行多个 npm-scripts 的 CLI 工具

### 其他

- **@whitecloud-save/binding-addon** - 游戏存档绑定模块
- **@angular-builders/custom-webpack** - Angular 构建器的自定义 webpack 配置
- **angular-mixed-cdk-drag-drop** - Angular CDK 拖放功能的扩展
- **xml2js** - XML 转 JSON 的 JavaScript 库

## 许可证

本项目采用开源许可证。

## 贡献

欢迎贡献代码、报告问题或提出建议。

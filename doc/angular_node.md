# Angular 模块中的 Node API 使用情况

本文档记录了 `src/angular` 目录中所有调用 Node 模块的代码，用于后续进行 Angular 模块的 Node 隔离改造。

## 目录

- [文件系统操作 (fs)](#文件系统操作-fs)
- [路径处理 (path)](#路径处理-path)
- [加密哈希 (crypto)](#加密哈希-crypto)
- [操作系统 (os)](#操作系统-os)
- [子进程 (child_process)](#子进程-child_process)
- [HTTP/HTTPS](#httphttps)
- [Electron API](#electron-api)
- [Electron Remote](#electron-remote)

---

## 文件系统操作 (fs)

### 1. oss.service.ts

**文件位置**: `src/angular/app/service/oss.service.ts`

**功能**: 读取本地文件（file:// 协议）

**使用的模块**: `fs/promises`

**具体使用**:
- **Line 4**: `import fs from 'fs/promises';`
- **Line 115**: `return fs.readFile(decodeURI(urlPath.pathname.slice(1)));`
  - 功能: 读取本地文件内容
  - 使用场景: `readUrl()` 方法中处理 file:// 协议的 URL

---

### 2. game.ts

**文件位置**: `src/angular/app/entity/game.ts`

**功能**: 游戏实体类，包含游戏存档备份、图标加载、状态检查等功能

**使用的模块**: `fs/promises`, `fs`

**具体使用**:

#### fs/promises
- **Line 12**: `import fs from 'fs/promises';`
- **Line 89**: `await fs.writeFile(targetPath, data as NodeJS.ArrayBufferView);`
  - 功能: 写入游戏图标文件
  - 方法: `loadIcon()`
- **Line 197**: `await fs.rm(this.backupSavePath, {recursive: true}).catch((err) => {console.log(err)});`
  - 功能: 删除游戏备份存档目录
  - 方法: `removeFromLocal()`
- **Line 258**: `const content = await fs.readFile(save.filename);`
  - 功能: 读取存档文件内容
  - 方法: `uploadSave()`
- **Line 328**: `const content = await fs.readFile(path.join(this.savePath, file));`
  - 功能: 读取存档目录文件
  - 方法: `createSaveZip()`
- **Line 420**: `const saveStat = await fs.stat(saveZipFilePath);`
  - 功能: 获取存档 ZIP 文件状态
  - 方法: `zipSave()`
- **Line 464-478**: `await fs.access(this.savePath, fs.constants.F_OK);`
  - 功能: 检查存档路径、游戏路径、可执行文件是否存在
  - 方法: `checkState()`
- **Line 486**: `await fs.access(targetPath);`
  - 功能: 检查图标文件是否存在
  - 方法: `checkState()`

#### fs (同步 API)
- **Line 13**: `import oFS from 'fs';`
- **Line 416**: `const fsStream = oFS.createWriteStream(saveZipFilePath);`
  - 功能: 创建写入流
  - 方法: `zipSave()`

---

### 3. utility.ts

**文件位置**: `src/angular/app/library/utility.ts`

**功能**: 工具类，包含目录读取、哈希计算等功能

**使用的模块**: `fs/promises`, `fs`

**具体使用**:

#### fs/promises
- **Line 4**: `import fs from 'fs/promises';`
- **Line 158**: `const files = await fs.readdir(filePath);`
  - 功能: 读取目录内容
  - 方法: `readdir()`
- **Line 160**: `const stat = await fs.stat(path.join(filePath, file));`
  - 功能: 获取文件状态
  - 方法: `readdir()`
- **Line 180**: `const content = await fs.readFile(filePath);`
  - 功能: 读取文件内容
  - 方法: `calculateDirectoryHash()`
- **Line 192**: `const stat = await fs.stat(filePath);`
  - 功能: 获取文件状态
  - 方法: `calculateDirectorySize()`
- **Line 199**: `const content = await fs.readFile(filePath);`
  - 功能: 读取文件内容
  - 方法: `calculateFileHash()`

#### fs (同步 API)
- **Line 5**: `import oFS from 'fs';`
- **Line 274**: `const stat = oFS.statSync(value);`
  - 功能: 同步获取文件状态
  - 方法: `GameValidators.folder()`
- **Line 294**: `const stat = oFS.statSync(value);`
  - 功能: 同步获取文件状态
  - 方法: `GameValidators.file()`

---

### 4. update.service.ts

**文件位置**: `src/angular/app/service/update.service.ts`

**功能**: 应用更新服务，负责下载和验证更新文件

**使用的模块**: `original-fs`

**具体使用**:

#### original-fs (同步 API)
- **Line 8**: `import fs from 'original-fs';`
- **Line 114**: `if (!fs.existsSync(updatesDir)) {`
  - 功能: 检查更新目录是否存在
  - 方法: `downloadUpdate()`
- **Line 115**: `fs.mkdirSync(updatesDir, { recursive: true });`
  - 功能: 创建更新目录
  - 方法: `downloadUpdate()`
- **Line 120**: `if (fs.existsSync(targetPath)) {`
  - 功能: 检查更新文件是否已存在
  - 方法: `downloadUpdate()`
- **Line 124**: `fs.copyFileSync(targetPath, updateAsarPath);`
  - 功能: 复制更新文件
  - 方法: `downloadUpdate()`
- **Line 128**: `fs.unlinkSync(targetPath);`
  - 功能: 删除无效的更新文件
  - 方法: `downloadUpdate()`
- **Line 132-133**: `if (fs.existsSync(tempPath)) { fs.unlinkSync(tempPath); }`
  - 功能: 删除临时文件
  - 方法: `downloadUpdate()`
- **Line 138**: `fs.renameSync(tempPath, targetPath);`
  - 功能: 重命名临时文件
  - 方法: `downloadUpdate()`
- **Line 151**: `const stream = fs.createReadStream(filePath);`
  - 功能: 创建读取流
  - 方法: `verifyFileHash()`
- **Line 173**: `const file = fs.createWriteStream(destPath);`
  - 功能: 创建写入流
  - 方法: `downloadFile()`
- **Line 181, 207, 220, 232**: `fs.unlinkSync(destPath);`
  - 功能: 删除下载失败的文件
  - 方法: `downloadFile()`
- **Line 218, 230**: `if (fs.existsSync(destPath)) {`
  - 功能: 检查文件是否存在
  - 方法: `downloadFile()`

---

### 5. game-basic-setting.component.ts

**文件位置**: `src/angular/app/main/pages/game/game-setting/game-basic-setting/game-basic-setting.component.ts`

**功能**: 游戏基本设置组件，用于配置游戏路径和存档路径

**使用的模块**: `fs/promises`

**具体使用**:
- **Line 7**: `import fs from 'fs/promises';`
- **Line 94**: `await fs.access(dirPath);`
  - 功能: 检查目录是否存在
  - 方法: `updateExePathSelection()`
- **Line 98**: `const files = await fs.readdir(dirPath);`
  - 功能: 读取目录内容
  - 方法: `updateExePathSelection()`
- **Line 104**: `const stat = await fs.lstat(path.join(dirPath, file));`
  - 功能: 获取文件状态
  - 方法: `updateExePathSelection()`

---

### 6. user-setting.component.ts

**文件位置**: `src/angular/app/main/pages/setting/user-setting/user-setting.component.ts`

**功能**: 用户设置组件，包含头像上传功能

**使用的模块**: `fs/promises`

**具体使用**:
- **Line 5**: `import fs from 'fs/promises';`
- **Line 67**: `const content = await fs.readFile(filePath);`
  - 功能: 读取用户头像文件
  - 方法: `changeAvatar()`

---

### 7. setting.service.ts

**文件位置**: `src/angular/app/service/setting.service.ts`

**功能**: 设置服务，管理应用配置

**使用的模块**: `fs/promises`

**具体使用**:
- **Line 3**: `import fs from 'fs/promises';`
- **Line 48**: `const xml = await fs.readFile(path.join(path.dirname(this.LEExePath), 'LEConfig.xml'));`
  - 功能: 读取 LE 配置文件
  - 方法: `updateLEProfile()`

---

### 8. remote-save.ts

**文件位置**: `src/angular/app/entity/remote-save.ts`

**功能**: 远程存档实体类，处理云端存档下载

**使用的模块**: `fs/promises`

**具体使用**:
- **Line 8**: `import fs from 'fs/promises';`
- **Line 25**: `await fs.writeFile(this.filename, Buffer.from(response.data) as NodeJS.ArrayBufferView);`
  - 功能: 写入下载的存档文件
  - 方法: `download()`

---

### 9. save.ts

**文件位置**: `src/angular/app/entity/save.ts`

**功能**: 存档实体类，处理存档的备份、恢复、删除等操作

**使用的模块**: `fs`

**具体使用**:

#### fs (同步 API)
- **Line 5**: `import fs from 'fs';`
- **Line 32**: `fs.accessSync(this.filename);`
  - 功能: 检查存档文件是否存在
  - 方法: `init()`

#### fs.promises
- **Line 51**: `await fs.promises.writeFile(this.filename, Buffer.from(response.data) as any);`
  - 功能: 写入下载的存档文件
  - 方法: `download()`
- **Line 94**: `await fs.promises.rm(this.game_.savePath, {recursive: true, force: true});`
  - 功能: 删除存档目录
  - 方法: `rollback()`
- **Line 96**: `const file = await fs.promises.readFile(this.filename);`
  - 功能: 读取存档 ZIP 文件
  - 方法: `rollback()`
- **Line 104**: `await fs.promises.writeFile(targetPath, decoded as NodeJS.ArrayBufferView);`
  - 功能: 写入解压的存档文件
  - 方法: `rollback()`
- **Line 113**: `await fs.promises.rm(this.filename);`
  - 功能: 删除存档文件
  - 方法: `delete()`

---

### 10. cache-image.ts

**文件位置**: `src/angular/app/library/cache-image.ts`

**功能**: 图片缓存类，负责图片的下载、缓存和加载

**使用的模块**: `fs/promises`

**具体使用**:
- **Line 4**: `import fs from 'fs/promises';`
- **Line 26**: `await fs.access(this.filePath, fs.constants.F_OK);`
  - 功能: 检查缓存文件是否存在
  - 方法: 构造函数
- **Line 32**: `await fs.readFile(decodeURI(urlPath.pathname.slice(1))).then(async (content) => {`
  - 功能: 读取本地文件
  - 方法: 构造函数
- **Line 34**: `await fs.writeFile(this.filePath, content as NodeJS.ArrayBufferView);`
  - 功能: 写入缓存文件
  - 方法: 构造函数
- **Line 44, 53**: `await fs.writeFile(this.filePath, Buffer.from(response.data) as NodeJS.ArrayBufferView);`
  - 功能: 写入下载的图片到缓存
  - 方法: 构造函数
- **Line 63**: `this.nativeImage_ = await fs.readFile(this.filePath);`
  - 功能: 读取缓存文件
  - 方法: 构造函数

---

### 11. game-import.service.ts

**文件位置**: `src/angular/app/main/dialog/game-import-dialog/game-import.service.ts`

**功能**: 游戏导入服务，处理游戏导入流程

**使用的模块**: `fs/promises`

**具体使用**:
- **Line 5**: `import fs from 'fs/promises';`
- **Line 48**: `const files = await fs.readdir(dirPath);`
  - 功能: 读取游戏目录内容
  - 方法: `selectGamePath()`
- **Line 55**: `const stat = await fs.lstat(path.join(dirPath, file));`
  - 功能: 获取文件状态
  - 方法: `selectGamePath()`
- **Line 63**: `const stat = await fs.lstat(dir);`
  - 功能: 获取目录状态
  - 方法: `selectGamePath()`

---

## 路径处理 (path)

### 1. game.ts

**文件位置**: `src/angular/app/entity/game.ts`

**功能**: 路径拼接、解析、目录名获取

**使用的模块**: `path`

**具体使用**:
- **Line 14**: `import path from 'path';`
- **Line 87**: `const targetPath = path.resolve(process.cwd(), this.backupSavePath, 'icon.png');`
  - 功能: 解析图标路径
  - 方法: `loadIcon()`
- **Line 307**: `cwd: path.dirname(this.exeFilePath),`
  - 功能: 获取可执行文件目录
  - 方法: `startGame()`
- **Line 328**: `const content = await fs.readFile(path.join(this.savePath, file));`
  - 功能: 拼接存档文件路径
  - 方法: `createSaveZip()`
- **Line 414**: `const saveZipFilePath = path.join(this.backupSavePath, id + '.zip');`
  - 功能: 拼接存档 ZIP 文件路径
  - 方法: `zipSave()`
- **Line 415**: `await mkdirp(path.dirname(saveZipFilePath));`
  - 功能: 获取目录名
  - 方法: `zipSave()`
- **Line 485**: `const targetPath = path.resolve(process.cwd(), this.backupSavePath, 'icon.png');`
  - 功能: 解析图标路径
  - 方法: `checkState()`
- **Line 696**: `return path.join('.', 'data', 'saves', this.id);`
  - 功能: 获取备份存档路径
  - 属性: `backupSavePath`
- **Line 718**: `return path.join(this.db_.gamePath, this.db_.exeFile);`
  - 功能: 获取可执行文件完整路径
  - 属性: `exeFilePath`

---

### 2. utility.ts

**文件位置**: `src/angular/app/library/utility.ts`

**功能**: 路径判断、拼接、POSIX 路径处理

**使用的模块**: `path`

**具体使用**:
- **Line 3**: `import path from 'path';`
- **Line 36**: `if (path.isAbsolute(dirPath))`
  - 功能: 判断是否为绝对路径
  - 方法: `decodePath()`
- **Line 160**: `const stat = await fs.stat(path.join(filePath, file));`
  - 功能: 拼接文件路径
  - 方法: `readdir()`
- **Line 162**: `const folderResult = await this.readdir(path.posix.join(filePath, file), path.posix.join(prefix, file));`
  - 功能: POSIX 路径拼接
  - 方法: `readdir()`
- **Line 167**: `result.push(path.posix.join(prefix, file));`
  - 功能: POSIX 路径拼接
  - 方法: `readdir()`
- **Line 179**: `const filePath = path.join(dirPath, file);`
  - 功能: 拼接文件路径
  - 方法: `calculateDirectoryHash()`
- **Line 191**: `const filePath = path.join(dirPath, file);`
  - 功能: 拼接文件路径
  - 方法: `calculateDirectorySize()`

---

### 3. update.service.ts

**文件位置**: `src/angular/app/service/update.service.ts`

**功能**: 路径拼接

**使用的模块**: `path`

**具体使用**:
- **Line 7**: `import path from 'path';`
- **Line 112**: `const updatesDir = path.join('data', 'updates');`
  - 功能: 拼接更新目录路径
  - 方法: `downloadUpdate()`
- **Line 118**: `const targetPath = path.join(updatesDir, `update-${version.version}.asar`);`
  - 功能: 拼接更新文件路径
  - 方法: `downloadUpdate()`
- **Line 123**: `const updateAsarPath = path.join(process.resourcesPath, 'update.asar');`
  - 功能: 拼接 update.asar 路径
  - 方法: `downloadUpdate()`
- **Line 131**: `const tempPath = path.join(updatesDir, `update-${version.version}.asar.tmp`);`
  - 功能: 拼接临时文件路径
  - 方法: `downloadUpdate()`

---

### 4. game-basic-setting.component.ts

**文件位置**: `src/angular/app/main/pages/game/game-setting/game-basic-setting/game-basic-setting.component.ts`

**功能**: 路径拼接、扩展名判断

**使用的模块**: `path`

**具体使用**:
- **Line 8**: `import path from 'path';`
- **Line 101**: `if (path.extname(file) !== '.exe')`
  - 功能: 判断文件扩展名
  - 方法: `updateExePathSelection()`
- **Line 104**: `const stat = await fs.lstat(path.join(dirPath, file));`
  - 功能: 拼接文件路径
  - 方法: `updateExePathSelection()`

---

### 5. sync-remote-game-dialog.component.ts

**文件位置**: `src/angular/app/main/dialog/sync-remote-game-dialog/sync-remote-game-dialog.component.ts`

**功能**: 路径处理

**使用的模块**: `path`

**具体使用**:
- **Line 7**: `import path from 'path';`
- **Line 56**: `if (path.basename(filePath) !== this.nzModalData.game.exePath) {`
  - 功能: 获取文件名
  - 方法: `openGamePathDialog()`
- **Line 88**: `const gamePath = path.dirname(exePath);`
  - 功能: 获取目录名
  - 方法: `submit()`

---

### 6. setting.service.ts

**文件位置**: `src/angular/app/service/setting.service.ts`

**功能**: 路径拼接、目录名获取

**使用的模块**: `path`

**具体使用**:
- **Line 4**: `import path from 'path';`
- **Line 48**: `const xml = await fs.readFile(path.join(path.dirname(this.LEExePath), 'LEConfig.xml'));`
  - 功能: 拼接 LE 配置文件路径
  - 方法: `updateLEProfile()`

---

### 7. remote-save.ts

**文件位置**: `src/angular/app/entity/remote-save.ts`

**功能**: 路径拼接

**使用的模块**: `path`

**具体使用**:
- **Line 7**: `import path from 'path';`
- **Line 49**: `return path.join(this.game_.backupSavePath, this.id + '.zip');`
  - 功能: 获取存档文件名
  - 属性: `filename`

---

### 8. save.ts

**文件位置**: `src/angular/app/entity/save.ts`

**功能**: 路径拼接

**使用的模块**: `path`

**具体使用**:
- **Line 1**: `import path from 'path';`
- **Line 99**: `const targetPath = path.join(this.game_.savePath, filePath);`
  - 功能: 拼接存档文件路径
  - 方法: `rollback()`
- **Line 137**: `return path.join(this.game_.backupSavePath, this.db_.id + '.zip');`
  - 功能: 获取存档文件名
  - 属性: `filename`

---

### 9. cache-image.ts

**文件位置**: `src/angular/app/library/cache-image.ts`

**功能**: 路径拼接、目录名获取

**使用的模块**: `path`

**具体使用**:
- **Line 6**: `import path from 'path';`
- **Line 33**: `await mkdirp(path.dirname(this.filePath));`
  - 功能: 获取目录名
  - 方法: 构造函数
- **Line 43, 52**: `await mkdirp(path.dirname(this.filePath));`
  - 功能: 获取目录名
  - 方法: 构造函数

---

### 10. game-import.service.ts

**文件位置**: `src/angular/app/main/dialog/game-import-dialog/game-import.service.ts`

**功能**: 路径拼接、扩展名判断、基础名获取

**使用的模块**: `path`

**具体使用**:
- **Line 6**: `import path from 'path';`
- **Line 52**: `if (path.extname(file) !== '.exe')`
  - 功能: 判断文件扩展名
  - 方法: `selectGamePath()`
- **Line 55**: `const stat = await fs.lstat(path.join(dirPath, file));`
  - 功能: 拼接文件路径
  - 方法: `selectGamePath()`
- **Line 62**: `const dir = path.join(dirPath, file);`
  - 功能: 拼接目录路径
  - 方法: `selectGamePath()`
- **Line 72**: `name: path.basename(this.setting.gamePath),`
  - 功能: 获取目录基础名
  - 方法: `selectGamePath()`

---

## 加密哈希 (crypto)

### 1. utility.ts

**文件位置**: `src/angular/app/library/utility.ts`

**功能**: 创建 SHA1、SHA256 哈希

**使用的模块**: `crypto`

**具体使用**:
- **Line 1**: `import {createHash} from 'crypto';`
- **Line 145**: `const hash = createHash('sha1');`
  - 功能: 创建 SHA1 哈希
  - 方法: `stringHash()`
- **Line 151**: `const hash = createHash('sha256');`
  - 功能: 创建 SHA256 哈希
  - 方法: `passwordHash()`
- **Line 177**: `const hash = createHash('sha1');`
  - 功能: 创建 SHA1 哈希
  - 方法: `calculateDirectoryHash()`
- **Line 200**: `const hash = createHash('sha1');`
  - 功能: 创建 SHA1 哈希
  - 方法: `calculateFileHash()`

---

### 2. update.service.ts

**文件位置**: `src/angular/app/service/update.service.ts`

**功能**: 创建 SHA1 哈希验证文件完整性

**使用的模块**: `crypto`

**具体使用**:
- **Line 9**: `import crypto from 'crypto';`
- **Line 150**: `const hash = crypto.createHash('sha1');`
  - 功能: 创建 SHA1 哈希
  - 方法: `verifyFileHash()`
- **Line 174**: `const hash = crypto.createHash('sha1');`
  - 功能: 创建 SHA1 哈希
  - 方法: `downloadFile()`

---

## 操作系统 (os)

### 1. game.ts

**文件位置**: `src/angular/app/entity/game.ts`

**功能**: 获取主机名

**使用的模块**: `os`

**具体使用**:
- **Line 19**: `import {hostname} from 'os';`
- **Line 222**: `host: hostname(),`
  - 功能: 获取主机名
  - 方法: `onGameProcessExit()`
- **Line 429**: `hostname: hostname(),`
  - 功能: 获取主机名
  - 方法: `zipSave()`

---

## 子进程 (child_process)

### 1. game.ts

**文件位置**: `src/angular/app/entity/game.ts`

**功能**: 启动游戏进程

**使用的模块**: `child_process`

**具体使用**:
- **Line 16**: `import {spawn} from 'child_process';`
- **Line 304**: `spawn(this.settingService_.LEExePath, ['-runas', this.extractSetting.LEProfile, this.exeFilePath]);`
  - 功能: 使用 LE 启动游戏
  - 方法: `startGame()`
- **Line 306**: `spawn(this.exeFilePath, { cwd: path.dirname(this.exeFilePath), });`
  - 功能: 直接启动游戏
  - 方法: `startGame()`

---

## HTTP/HTTPS

### 1. update.service.ts

**文件位置**: `src/angular/app/service/update.service.ts`

**功能**: 下载更新文件

**使用的模块**: `http`, `https`

**具体使用**:
- **Line 10**: `import http from 'http';`
- **Line 11**: `import https from 'https';`
- **Line 176**: `const protocol = url.startsWith('https://') ? https : http;`
  - 功能: 根据 URL 选择协议
  - 方法: `downloadFile()`
- **Line 177**: `const request = protocol.get(url, (response: any) => {`
  - 功能: 发起 HTTP/HTTPS 请求
  - 方法: `downloadFile()`

---

## Electron API

### 1. game.ts

**文件位置**: `src/angular/app/entity/game.ts`

**功能**: IPC 通信

**使用的模块**: `electron`

**具体使用**:
- **Line 22**: `import {ipcRenderer} from 'electron';`
- **Line 245**: `await ipcRenderer.invoke('closeGameGuideWindow', this.guideWindowId_);`
  - 功能: 关闭游戏攻略窗口
  - 方法: `onGameProcessExit()`
- **Line 270**: `const id = await ipcRenderer.invoke('createGameGuideWindow', { uuid: this.id, title: `${this.name} 攻略`, });`
  - 功能: 创建游戏攻略窗口
  - 方法: `openGameGuide()`

---

### 2. basic-setting.component.ts

**文件位置**: `src/angular/app/main/pages/setting/basic-setting/basic-setting.component.ts`

**功能**: IPC 通信（重启安装更新）

**使用的模块**: `electron`

**具体使用**:
- **Line 8**: `import {ipcRenderer} from 'electron';`
- **Line 83**: `ipcRenderer.invoke('quit-and-install');`
  - 功能: 重启并安装更新
  - 方法: `confirmInstallUpdate()`

---

### 3. game-guide.component.ts

**文件位置**: `src/angular/app/game-guide/game-guide.component.ts`

**功能**: IPC 通信（设置窗口置顶）

**使用的模块**: `electron`

**具体使用**:
- **Line 7**: `import {ipcRenderer} from 'electron';`
- **Line 37**: `await ipcRenderer.invoke('setTop', value);`
  - 功能: 设置窗口置顶
  - 方法: 构造函数

---

### 4. game-cover.component.ts

**文件位置**: `src/angular/app/main/components/game-cover/game-cover.component.ts`

**功能**: 创建原生图片缩略图

**使用的模块**: `electron`

**具体使用**:
- **Line 4**: `import {MenuItem, MenuItemConstructorOptions, nativeImage} from 'electron';`
- **Line 51**: `icon = await nativeImage.createThumbnailFromPath(game.iconPath, {width: 16, height: 16});`
  - 功能: 创建图标缩略图
  - 方法: `openGameContextMenu()`

---

## Electron Remote

### 1. game.ts

**文件位置**: `src/angular/app/entity/game.ts`

**功能**: 打开路径（文件管理器）

**使用的模块**: `@electron/remote`

**具体使用**:
- **Line 9**: `import {shell} from '@electron/remote';`
- **Line 317**: `return shell.openPath(this.savePath);`
  - 功能: 打开存档路径
  - 方法: `openSavePath()`
- **Line 321**: `return shell.openPath(this.gamePath);`
  - 功能: 打开游戏路径
  - 方法: `openGamePath()`

---

### 2. utility.ts

**文件位置**: `src/angular/app/library/utility.ts`

**功能**: 获取应用路径（appData, userData）

**使用的模块**: `@electron/remote`

**具体使用**:
- **Line 2**: `import {app} from '@electron/remote';`
- **Line 24**: `if (dirPath.indexOf(app.getPath('appData')) === 0) {`
  - 功能: 获取 appData 路径
  - 方法: `encodePath()`
- **Line 28**: `if (dirPath.indexOf(app.getPath('userData')) === 0) {`
  - 功能: 获取 userData 路径
  - 方法: `encodePath()`
- **Line 44**: `return dirPath.replace(GamePathMark.AppPath, app.getPath('appData'));`
  - 功能: 获取 appData 路径
  - 方法: `decodePath()`
- **Line 48**: `return dirPath.replace(GamePathMark.UserData, app.getPath('userData'));`
  - 功能: 获取 userData 路径
  - 方法: `decodePath()`

---

### 3. update.service.ts

**文件位置**: `src/angular/app/service/update.service.ts`

**功能**: 获取应用版本、打开外部链接

**使用的模块**: `@electron/remote`

**具体使用**:
- **Line 6**: `import {app, shell} from '@electron/remote';`
- **Line 74**: `const currentVersion = app.getVersion();`
  - 功能: 获取当前版本
  - 方法: `checkForUpdates()`
- **Line 243**: `shell.openExternal('https://whitecloud.xyyaya.com');`
  - 功能: 打开外部链接
  - 方法: `openWebsite()`

---

### 4. basic-setting.component.ts

**文件位置**: `src/angular/app/main/pages/setting/basic-setting/basic-setting.component.ts`

**功能**: 获取/设置开机启动、获取版本

**使用的模块**: `@electron/remote`

**具体使用**:
- **Line 3**: `import {app} from '@electron/remote';`
- **Line 22**: `openWithSystem = new FormControl({value: app.getLoginItemSettings().openAtLogin, disabled: !app.isPackaged});`
  - 功能: 获取开机启动设置
  - 属性: `openWithSystem`
- **Line 39**: `app.setLoginItemSettings({ openAtLogin: value, });`
  - 功能: 设置开机启动
  - 方法: 构造函数
- **Line 52**: `this.version = app.getVersion();`
  - 功能: 获取应用版本
  - 方法: 构造函数

---

### 5. game-basic-setting.component.ts

**文件位置**: `src/angular/app/main/pages/game/game-setting/game-basic-setting/game-basic-setting.component.ts`

**功能**: 显示文件选择对话框

**使用的模块**: `@electron/remote`

**具体使用**:
- **Line 6**: `import {dialog} from '@electron/remote';`
- **Line 112**: `const res = await dialog.showOpenDialog({ properties: ['openDirectory'], title: '请选择存档文件夹', });`
  - 功能: 显示文件夹选择对话框
  - 方法: `openSavePathDialog()`
- **Line 125**: `const res = await dialog.showOpenDialog({ properties: ['openDirectory'], title: '请选择游戏文件夹', });`
  - 功能: 显示文件夹选择对话框
  - 方法: `openGamePathDialog()`

---

### 6. game-cover.component.ts

**文件位置**: `src/angular/app/main/components/game-cover/game-cover.component.ts`

**功能**: 创建右键菜单

**使用的模块**: `@electron/remote`

**具体使用**:
- **Line 3**: `import {Menu, Tray} from '@electron/remote';`
- **Line 85**: `const menu = Menu.buildFromTemplate(template); menu.popup({});`
  - 功能: 创建并显示右键菜单
  - 方法: `openGameContextMenu()`
- **Line 131**: `const menu = Menu.buildFromTemplate(template); menu.popup({});`
  - 功能: 创建并显示右键菜单
  - 方法: `openGameContextMenu()`

---

### 7. user-setting.component.ts

**文件位置**: `src/angular/app/main/pages/setting/user-setting/user-setting.component.ts`

**功能**: 显示文件选择对话框

**使用的模块**: `@electron/remote`

**具体使用**:
- **Line 4**: `import {dialog} from '@electron/remote';`
- **Line 52**: `const res = await dialog.showOpenDialog({ properties: ['openFile'], title: '请选择用户头像', filters: [{name: '图片文件', extensions: ['png', 'jpg']}], });`
  - 功能: 显示文件选择对话框
  - 方法: `changeAvatar()`

---

### 8. sync-remote-game-dialog.component.ts

**文件位置**: `src/angular/app/main/dialog/sync-remote-game-dialog/sync-remote-game-dialog.component.ts`

**功能**: 显示文件选择对话框

**使用的模块**: `@electron/remote`

**具体使用**:
- **Line 6**: `import {dialog} from '@electron/remote';`
- **Line 40**: `const res = await dialog.showOpenDialog({ properties: ['openFile'], title: `请选择${this.nzModalData.game.exePath}`, filters: [{name: '可执行文件', extensions: ['exe']}], });`
  - 功能: 显示文件选择对话框
  - 方法: `openGamePathDialog()`
- **Line 67**: `const res = await dialog.showOpenDialog({ properties: ['openDirectory'], title: '请选择游戏存档文件夹', });`
  - 功能: 显示文件夹选择对话框
  - 方法: `openSavePathDialog()`

---

## Process 全局对象

### 1. game.ts

**文件位置**: `src/angular/app/entity/game.ts`

**功能**: 获取当前工作目录

**具体使用**:
- **Line 87**: `const targetPath = path.resolve(process.cwd(), this.backupSavePath, 'icon.png');`
  - 功能: 获取当前工作目录
  - 方法: `loadIcon()`
- **Line 485**: `const targetPath = path.resolve(process.cwd(), this.backupSavePath, 'icon.png');`
  - 功能: 获取当前工作目录
  - 方法: `checkState()`

---

### 2. update.service.ts

**文件位置**: `src/angular/app/service/update.service.ts`

**功能**: 获取资源路径

**具体使用**:
- **Line 123**: `const updateAsarPath = path.join(process.resourcesPath, 'update.asar');`
  - 功能: 获取资源路径
  - 方法: `downloadUpdate()`

---

## 第三方 Node 模块

### 1. extract-file-icon

**文件位置**: `src/angular/app/entity/game.ts`

**功能**: 提取可执行文件图标

**具体使用**:
- **Line 29**: `import fileIcon from 'extract-file-icon';`
- **Line 88**: `const data = fileIcon(this.exeFilePath, 32);`
  - 功能: 提取 32x32 图标
  - 方法: `loadIcon()`

---

## 总结

### 文件统计

总计 15 个文件使用了 Node API：

1. `src/angular/app/service/oss.service.ts`
2. `src/angular/app/entity/game.ts`
3. `src/angular/app/library/utility.ts`
4. `src/angular/app/service/update.service.ts`
5. `src/angular/app/main/pages/setting/basic-setting/basic-setting.component.ts`
6. `src/angular/app/main/pages/game/game-setting/game-basic-setting/game-basic-setting.component.ts`
7. `src/angular/app/main/components/game-cover/game-cover.component.ts`
8. `src/angular/app/main/pages/setting/user-setting/user-setting.component.ts`
9. `src/angular/app/main/dialog/sync-remote-game-dialog/sync-remote-game-dialog.component.ts`
10. `src/angular/app/game-guide/game-guide.component.ts`
11. `src/angular/app/service/setting.service.ts`
12. `src/angular/app/entity/remote-save.ts`
13. `src/angular/app/entity/save.ts`
14. `src/angular/app/library/cache-image.ts`
15. `src/angular/app/main/dialog/game-import-dialog/game-import.service.ts`

### Node API 使用分类

#### 文件系统操作
- **fs/promises**: 异步文件操作（读取、写入、删除、访问、状态获取）
- **fs**: 同步文件操作、文件流
- **original-fs**: Electron 原生文件系统（用于 ASAR 文件操作）

#### 路径处理
- **path**: 路径拼接、解析、扩展名判断、基础名获取、目录名获取

#### 加密哈希
- **crypto**: SHA1、SHA256 哈希计算

#### 操作系统
- **os**: 主机名获取

#### 子进程
- **child_process**: spawn 启动子进程

#### HTTP/HTTPS
- **http/https**: HTTP/HTTPS 请求

#### Electron API
- **electron**: IPC 通信、原生图片处理
- **@electron/remote**: 应用 API、对话框、菜单、Shell 操作

#### Process 全局对象
- **process.cwd()**: 当前工作目录
- **process.resourcesPath**: 资源路径

#### 第三方模块
- **extract-file-icon**: 提取可执行文件图标

### 建议

为了实现 Angular 模块的 Node 隔离，建议：

1. **创建 IPC 通信层**: 将所有 Node API 调用封装到 Electron 主进程，通过 IPC 暴露给渲染进程
2. **抽象文件系统接口**: 创建统一的文件系统接口，屏蔽底层实现
3. **使用依赖注入**: 在 Angular 服务中注入 Node API 的抽象接口，便于测试和替换
4. **分离关注点**: 将文件操作、进程管理等 Node 特有功能从 Angular 组件中分离到独立的服务中
5. **考虑使用 Preload 脚本**: 使用 contextBridge 暴露安全的 API 给渲染进程

# 实体层迁移计划

## 概述
实体层包含三个核心文件，它们包含大量的 Node API 调用，需要全部迁移到 WorkerAPI。

## 文件统计

| 文件 | 行数 | 复杂度 | 优先级 |
|------|------|--------|--------|
| game.ts | 937 | 高 | P0 |
| save.ts | ~400 | 中 | P1 |
| remote-save.ts | ~300 | 中 | P2 |

## game.ts 迁移分析

### 使用的 Node API

1. **文件系统** (fs, fs/promises)
   - `fs.writeFile` - 写文件
   - `fs.readFile` - 读文件
   - `fs.access` - 检查文件存在
   - `fs.stat` - 文件状态
   - `fs.readdir` - 读取目录
   - `fs.unlink` - 删除文件
   - `fs.rm` - 删除目录
   - `mkdirp` - 创建目录

2. **路径操作** (path)
   - `path.join` - 路径拼接
   - `path.resolve` - 路径解析
   - `path.dirname` - 获取目录名
   - `path.basename` - 获取文件名

3. **进程管理** (child_process)
   - `spawn` - 启动进程

4. **Shell 操作** (shell)
   - `shell.openPath` - 打开路径
   - `shell.openExternal` - 打开外部链接

5. **图标提取** (extract-file-icon)
   - `fileIcon` - 提取文件图标

6. **ZIP 压缩** (jszip)
   - 创建 ZIP 文件
   - 解压 ZIP 文件

7. **数据库操作** (typeorm)
   - 保存游戏
   - 查询游戏
   - 删除游戏
   - 存档操作
   - 历史记录操作

### 主要方法

1. **初始化相关**
   - `init()` - 初始化游戏
   - `loadIcon()` - 加载图标

2. **游戏管理**
   - `check()` - 检查游戏状态
   - `start()` - 启动游戏
   - `backup()` - 备份存档
   - `restore()` - 恢复存档
   - `delete()` - 删除游戏

3. **存档管理**
   - `saveSave()` - 保存存档
   - `deleteSave()` - 删除存档
   - `loadSaves()` - 加载存档列表

4. **云存档**
   - `uploadSave()` - 上传存档
   - `downloadSave()` - 下载存档
   - `syncSaves()` - 同步存档

5. **历史记录**
   - `recordHistory()` - 记录游戏历史
   - `syncHistory()` - 同步历史

## 迁移策略

### 方案 1: 完整迁移（推荐）
**优点**:
- 一次性解决所有问题
- 彻底实现隔离

**缺点**:
- 工作量大（预计 3-5 天）
- 需要全面测试

**步骤**:
1. 创建 game.ts 的迁移版本
2. 替换所有 Node API 调用
3. 更新所有方法为异步
4. 测试所有功能

### 方案 2: 渐进式迁移
**优点**:
- 风险小
- 可以逐步验证

**缺点**:
- 周期长
- 临时方案多

**步骤**:
1. 先迁移文件操作
2. 再迁移进程和 Shell
3. 最后迁移数据库

## 迁移优先级

### P0 - 立即迁移
1. **文件操作** - 最常用，影响最大
2. **数据库操作** - 核心功能

### P1 - 尽快迁移
3. **ZIP 压缩** - 存档功能依赖
4. **进程管理** - 游戏启动依赖

### P2 - 后续迁移
5. **Shell 操作** - 辅助功能
6. **图标提取** - 显示功能

## 预计工作量

| 任务 | 预计时间 | 负责人 |
|------|----------|--------|
| game.ts 迁移 | 2-3 天 | AI |
| save.ts 迁移 | 1-2 天 | AI |
| remote-save.ts 迁移 | 1 天 | AI |
| 测试验证 | 1-2 天 | 开发者 |

**总计**: 5-8 天

## 风险评估

### 高风险
- 数据库操作迁移 - 可能影响数据完整性
- 进程启动迁移 - 可能影响游戏启动

### 中风险
- 文件操作迁移 - 可能影响存档功能
- ZIP 压缩迁移 - 可能影响存档备份

### 低风险
- Shell 操作迁移 - 仅影响辅助功能
- 图标提取迁移 - 仅影响显示

## 建议

鉴于：
1. game.ts 文件非常大（937行）
2. 包含大量 Node API 调用
3. 是核心实体，影响范围广

**建议采用渐进式迁移**:
1. 先完成基础设施（已完成✅）
2. 先迁移简单的服务层（如 setting.service）
3. 积累经验后再迁移复杂的实体层
4. 或者等待更好的时机（如重构时）

**当前阶段建议**:
- 先完成基础设施搭建
- 提供完整的迁移指南和示例
- 让开发者根据实际情况选择迁移时机
- 我们可以先迁移 1-2 个简单的服务作为示例

## 替代方案

**创建适配器层**:
```typescript
// src/angular/app/library/node-adapter.ts
export class NodeAdapter {
  static async readFile(path: string) {
    return await workerAPI.fs.readFile(path);
  }

  static async writeFile(path: string, data: Buffer) {
    return await workerAPI.fs.writeFile({path, data});
  }

  // ... 其他方法
}
```

这样：
1. 不需要立即修改所有实体
2. 可以逐步替换实现
3. 降低风险

## 相关文档
- [迁移指南](migration-guide.md)
- [第一阶段总结](stage1-summary.md)

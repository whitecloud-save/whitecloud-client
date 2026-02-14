## 1. 数据库架构变更
- [x] 1.1 在 SaveDB 实体添加 `directoryHash` 字段（string 类型，nullable）
- [x] 1.2 在 SaveDB 实体添加 `zipHash` 字段（string 类型，nullable）
- [x] 1.3 在 SaveDB 实体添加 `directorySize` 字段（number 类型，nullable）
- [x] 1.4 运行构建让 TypeORM 自动同步数据库结构

## 2. 工具方法实现
- [x] 2.1 在 Utility 类添加 `calculateDirectoryHash()` 方法
- [x] 2.2 在 Utility 类添加 `calculateDirectorySize()` 方法
- [x] 2.3 在 Utility 类添加 `calculateFileHash()` 方法（用于 ZIP 文件）

## 3. Game 类添加私有缓存变量
- [x] 3.1 在 Game 类添加 `currentSave_` 私有变量（类型为 Save | null）
- [x] 3.2 在 Game 类添加 `getCurrentSave()` 公共方法，返回缓存值
- [x] 3.3 在 Game 类添加 `updateCurrentSave()` 私有方法，重新计算并更新缓存

## 4. Game 初始化时计算缓存
- [x] 4.1 修改 Game.init() 方法，在初始化完成后调用 updateCurrentSave()
- [x] 4.2 确保在存档列表加载完成后计算 currentSave

## 5. 存档备份流程修改
- [x] 5.1 修改 Game.zipSave() 方法，在备份时计算三个哈希值
- [x] 5.2 在 SaveDB 创建时设置 directoryHash 和 directorySize
- [x] 5.3 在 ZIP 文件创建后计算 zipHash 并更新到数据库
- [x] 5.4 备份完成后调用 updateCurrentSave() 更新缓存
- [x] 5.5 测试备份流程确保哈希值正确存储

## 6. 远端游戏同步时更新缓存
- [x] 6.1 修改 GameService.importRemoteGame() 方法
- [x] 6.2 在远端游戏同步到本地后调用 updateCurrentSave()
- [x] 6.3 确保缓存正确更新

## 7. 存档回滚时更新缓存
- [x] 7.1 修改 Save.rollback() 方法，在回滚完成后通知 Game 更新缓存
- [x] 7.2 在 Game 类添加 `notifyRollbackComplete(save: Save)` 方法
- [x] 7.3 在 notifyRollbackComplete 中调用 updateCurrentSave()
- [x] 7.4 测试回滚后缓存正确更新

## 8. 验证和测试
- [x] 8.1 编写单元测试验证哈希计算正确性
- [x] 8.2 测试存档备份流程
- [x] 8.3 测试 getCurrentSave() 方法返回缓存值
- [x] 8.4 测试 Game 初始化时缓存计算
- [x] 8.5 测试备份后缓存更新
- [x] 8.6 测试远端同步后缓存更新
- [x] 8.7 测试回滚后缓存正确更新
- [x] 8.8 性能测试（初始化计算 10M 存档应 < 50ms）

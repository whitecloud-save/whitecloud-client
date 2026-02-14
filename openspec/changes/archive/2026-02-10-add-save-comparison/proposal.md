# 变更：添加存档对比功能

## 为什么
用户需要快速识别当前游戏存档与数据库中已备份存档是否一致，避免不必要的重复备份或错误的回滚操作。当前系统无法判断当前存档与历史存档的差异。

## 变更内容
- 在 SaveDB 实体新增三个字段：`directoryHash`（目录哈希）、`zipHash`（ZIP文件哈希）、`directorySize`（未压缩大小）
- 在 Utility 工具类新增 `calculateDirectoryHash()` 方法，用于计算目录哈希
- 在 Game 类新增 `getCurrentSave()` 方法，获取与当前存档一致的最新备份
- 在 Game 类添加 `currentSave_` 私有缓存变量
- 在 Game 初始化时计算并缓存 currentSave
- 在创建新存档时（自动备份、手动备份、回滚）更新缓存
- 提供快速的存档对比功能（基于大小 + 哈希的双层检查）

## 影响
- 受影响规范：新增 `save-management` 规范
- 受影响代码：
  - `src/app/database/save.ts`（SaveDB 实体）
  - `src/app/library/utility.ts`（Utility 工具类）
  - `src/app/entity/game.ts`（Game 类）

## 新增需求
### 需求：存档目录哈希计算
系统必须提供计算目录哈希的功能，用于判断存档内容是否变化。

#### 场景：计算目录哈希
- **当** 调用 Utility.calculateDirectoryHash(directoryPath)
- **那么** 必须递归读取目录下所有文件
- **并且** 按文件路径排序确保一致性
- **并且** 将文件路径和内容一起计算 SHA256 哈希
- **并且** 返回哈希字符串（16 进制格式）

#### 场景：计算目录大小
- **当** 调用 Utility.calculateDirectorySize(directoryPath)
- **那么** 必须递归计算目录下所有文件的总大小
- **并且** 返回总大小（字节数）

#### 场景：计算文件哈希
- **当** 调用 Utility.calculateFileHash(filePath)
- **那么** 必须使用 SHA256 算法计算文件哈希
- **并且** 返回哈希字符串（16 进制格式）

### 需求：存档对比缓存机制
系统必须使用缓存机制提供存档对比功能，避免重复计算。

#### 场景：Game 初始化时计算缓存
- **当** Game.init() 方法执行
- **并且** 存档列表加载完成
- **那么** 必须计算与当前存档一致的最新备份
- **并且** 将结果缓存到 `currentSave_` 私有变量
- **并且** 如果没有匹配，缓存 null

#### 场景：获取与当前一致的最新存档（返回缓存）
- **当** 调用 Game.getCurrentSave()
- **那么** 必须返回缓存的 `currentSave_` 值
- **并且** 不进行任何哈希计算

#### 场景：创建新存档后更新缓存
- **当** Game.zipSave() 备份存档完成
- **那么** 必须调用 updateCurrentSave() 更新缓存
- **并且** 重新计算与当前存档一致的最新备份
- **并且** 将结果更新到 `currentSave_` 私有变量

#### 场景：存档回滚后更新缓存
- **当** Save.rollback() 执行完成
- **那么** 必须通知 Game 对象更新缓存
- **并且** Game 调用 updateCurrentSave() 重新计算
- **并且** 将结果更新到 `currentSave_` 私有变量

#### 场景：远端游戏同步后更新缓存
- **当** GameService.importRemoteGame() 将远端游戏同步到本地
- **那么** 必须调用 Game.updateCurrentSave() 更新缓存
- **并且** 重新计算与当前存档一致的最新备份
- **并且** 将结果更新到 `currentSave_` 私有变量

### 需求：存档对比内部实现
系统必须提供存档对比的内部实现方法，用于缓存更新。

#### 场景：重新计算当前存档匹配
- **当** 调用 Game.updateCurrentSave()
- **并且** 当前存档目录有效
- **那么** 必须计算当前存档目录的大小和哈希
- **并且** 先筛选 directorySize 相同的存档
- **并且** 再在筛选结果中匹配 directoryHash
- **并且** 如果有多个匹配，返回创建时间最晚的
- **并且** 更新 `currentSave_` 私有变量

#### 场景：无匹配存档
- **当** 调用 Game.updateCurrentSave()
- **并且** 没有存档与当前存档匹配
- **那么** 将 `currentSave_` 设置为 null

#### 场景：目录大小不同立即返回
- **当** 调用 Game.updateCurrentSave()
- **并且** 当前存档大小与所有已备份存档不同
- **那么** 将 `currentSave_` 设置为 null，不计算哈希

### 需求：存档备份时计算哈希
系统必须在存档备份时计算并存储哈希值。

#### 场景：备份存档时计算哈希
- **当** Game.zipSave() 备份存档
- **那么** 必须在 ZIP 文件创建前计算 directoryHash 和 directorySize
- **并且** 在 ZIP 文件创建后计算 zipHash
- **并且** 将三个哈希值存储到 SaveDB
- **并且** 更新 SaveDB 记录到数据库
- **并且** 调用 updateCurrentSave() 更新缓存

#### 场景：兼容旧存档
- **当** 加载没有哈希字段的旧存档
- **那么** directoryHash、zipHash、directorySize 应为 null
- **并且** 不影响存档的正常使用

## 修改需求
### 需求：存档数据模型
SaveDB 实体必须扩展以支持存档对比功能。

#### 场景：创建存档记录时存储哈希
- **当** 创建新的 SaveDB 记录
- **并且** 备份存档时
- **那么** directoryHash 字段必须存储目录哈希
- **并且** zipHash 字段必须存储 ZIP 文件哈希
- **并且** directorySize 字段必须存储未压缩大小
- **并且** 三个字段可为 null（兼容旧数据）

### 需求：Game 初始化流程
Game 类必须在初始化时计算存档对比缓存。

#### 场景：Game 初始化完成后计算缓存
- **当** Game.init() 方法执行
- **并且** 存档列表加载完成（init() 中的存档加载逻辑）
- **那么** 必须调用 updateCurrentSave() 计算与当前存档一致的最新备份
- **并且** 将结果缓存到 `currentSave_` 私有变量

## 1. 数据模型更新

- [x] 1.1 在 `LocalGameDB` 实体中添加 `saveBackupLimit` 字段（默认 100，单位 MB）
- [x] 1.2 在 `LocalGameDB` 实体中添加 `useCustomSaveBackupLimit` 字段（默认 false）
- [x] 1.3 在 `GameState` 枚举中添加 `SaveSizeExceeded = 5` 状态

## 2. 全局设置

- [x] 2.1 在 `SettingService` 中添加 `globalSaveBackupLimit` 属性（默认 100MB）
- [x] 2.2 在 `SettingService.load()` 中加载全局备份上限设置
- [x] 2.3 在 `SettingService.save()` 中保存全局备份上限设置
- [x] 2.4 在 `basic-setting.component.html` 中添加"本地存档备份上限"设置项
- [x] 2.5 在 `basic-setting.component.ts` 中添加表单控件和保存逻辑
- [x] 2.6 添加设置项说明：存档原始体积超过该设置值的游戏将不会进行自动本地存档备份（手动备份不受影响）

## 3. 游戏设置

- [x] 3.1 在 `GameSaveSettingComponent` 中添加"使用自定义备份上限"开关
- [x] 3.2 在 `GameSaveSettingComponent` 中添加"备份上限"滑块（10M-100M）
- [x] 3.3 在 `Game` 类中添加 `saveBackupLimit` 和 `useCustomSaveBackupLimit` 属性
- [x] 3.4 实现游戏设置的保存逻辑

## 4. 状态检测逻辑

- [x] 4.1 在 `Game.init()` 中添加存档文件夹大小检测
- [x] 4.2 实现获取有效备份上限的逻辑（优先游戏设置，否则使用全局设置）
- [x] 4.3 当存档超过上限时，设置状态为 `SaveSizeExceeded`
- [x] 4.4 在 `onGameProcessExit()` 中检查状态，`SaveSizeExceeded` 时不自动备份
- [x] 4.5 在 `zipSave()` 中备份前检测存档大小，超限时设置状态为 `SaveSizeExceeded` 并中止备份

## 5. UI 提示条

- [x] 5.1 在 `game.component.html` 导航栏下方添加条件渲染的黄底提示条
- [x] 5.2 提示文案：本游戏存档文件夹容量过大，当前禁用自动备份存档功能
- [x] 5.3 添加"去设置"按钮，根据游戏设置状态跳转对应设置页面

## 6. 手动备份确认

- [x] 6.1 找到手动备份的触发位置（game-home 组件）
- [x] 6.2 添加 `SaveSizeExceeded` 状态下的确认对话框
- [x] 6.3 确认文案：本游戏存档文件夹容量过大，备份可能消耗较长时间与硬盘空间，是否确认继续
- [x] 6.4 提供"继续"和"取消"两个选项

## 7. 测试验证

- [x] 7.1 验证全局设置保存和加载
- [x] 7.2 验证游戏设置的保存和加载
- [x] 7.3 验证初始化时存档大小检测和状态切换
- [x] 7.4 验证备份时存档大小检测和状态切换
- [x] 7.5 验证 UI 提示条显示和跳转
- [x] 7.6 验证手动备份确认对话框

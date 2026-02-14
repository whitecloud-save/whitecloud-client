# 变更：添加存档文件夹大小限制的备份功能

## 为什么

部分游戏的存档文件夹非常大（如视频录制、截图、日志等），自动备份会消耗大量时间和硬盘空间。用户需要一种机制来：
1. 设置全局的存档备份大小上限
2. 为特定游戏单独设置备份上限
3. 当存档超过上限时，自动禁用备份功能并提示用户
4. 手动备份时给予确认提示，让用户知情决定

## 变更内容

- **全局设置**：在基础设置页面添加"本地存档备份上限"设置项（10M-100M，默认100M）
- **游戏设置**：在游戏存档设置页面添加"使用自定义备份上限"开关和"备份上限"设置
- **游戏状态**：新增 `SaveSizeExceeded` 状态，表示存档超过备份上限
- **状态检测**：Game 初始化时检测存档文件夹大小，超过限制则进入该状态
- **UI 提示**：游戏导航栏下方显示黄底提示条，提供"去设置"快捷入口
- **手动备份确认**：存档超限时点击备份弹出确认对话框

## 影响

- 受影响规范：save-management
- 受影响代码：
  - `src/app/database/game.ts` - 新增字段
  - `src/app/entity/game.ts` - 新增状态枚举值、初始化检测逻辑
  - `src/app/service/setting.service.ts` - 新增全局设置
  - `src/app/main/pages/setting/basic-setting/` - 全局设置 UI
  - `src/app/main/pages/game/game-setting/game-save-setting/` - 游戏设置 UI
  - `src/app/main/pages/game/game.component.html` - 提示条 UI
  - `src/app/main/pages/game/game-home/` - 手动备份确认对话框

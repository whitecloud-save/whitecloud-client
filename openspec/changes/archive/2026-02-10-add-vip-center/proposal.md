# 变更：添加会员中心模块

## 为什么

当前用户设置页面缺少会员中心功能，用户无法查看 VIP 状态、会员到期时间和云存储空间使用情况。需要添加会员中心模块以提供这些信息。

## 变更内容

- 在用户设置页面添加会员中心模块
- 修改 UserService 以存储 VIP 信息和存储信息
- 根据 VIP 状态显示不同的 UI
- 显示云存储空间使用情况（进度条）

## 影响

- 受影响规范：user-management（新建）
- 受影响代码：
  - `src/app/service/user.service.ts` - 添加 VIP 信息和存储信息存储
  - `src/app/main/pages/setting/user-setting/user-setting.component.ts` - 添加会员中心功能
  - `src/app/main/pages/setting/user-setting/user-setting.component.html` - 添加会员中心 UI
  - `src/app/main/pages/setting/user-setting/user-setting.component.scss` - 添加样式
  - `src/app/main/main.module.ts` - 添加 NzProgressModule 导入

---
description: 归档已完成的 OpenSpec 变更提案
argument-hint: <change-id>
---

# OpenSpec 归档变更

本命令用于归档已完成的 OpenSpec 变更提案。

## 调用方式

```
/openspec-archive add-steam-import
```

## 执行步骤

1. **验证变更完成**
   - 确认所有任务已完成
   - 确认代码已通过测试
   - 确认文档已更新

2. **移动变更目录**
   - 移动 `changes/<change-id>/` → `changes/archive/YYYY-MM-DD-<change-id>/`

3. **更新规范（如果需要）**
   - 如果功能发生变化，更新 `specs/` 目录
   - 将增量合并到主规范文件

4. **验证归档**
   - 运行 `openspec-cn validate <change-id> --strict --no-interactive`
   - 确认归档的变更通过检查

## 参考

详细的 OpenSpec 使用说明请参考：
- [openspec/AGENTS.md](../../openspec/AGENTS.md)

## 注意

- 只能归档已完成的变更
- 归档前必须验证所有任务已完成
- 归档后变更不能再修改
- 使用 `--skip-specs` 跳过规范更新（仅工具变更）
- 使用 `--yes` 或 `-y` 跳过确认提示

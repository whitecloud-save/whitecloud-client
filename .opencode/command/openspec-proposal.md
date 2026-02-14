---
description: 创建 OpenSpec 变更提案
argument-hint: <变更描述>
---

# OpenSpec 变更提案

本命令用于创建 OpenSpec 变更提案，规范驱动开发流程。

## 调用方式

```
/openspec-proposal 添加 Steam 游戏导入功能
```

或仅提示创建：

```
/openspec-proposal
```

## 执行步骤

1. **了解项目上下文**
   - 阅读 `openspec/project.md`
   - 运行 `openspec-cn list` 查看活动变更
   - 运行 `openspec-cn list --specs` 查看现有规范

2. **创建变更目录**
   - 选择唯一的 `change-id`（短横线命名法，动词开头）
   - 创建 `openspec/changes/<change-id>/` 目录

3. **编写提案文件**
   - 创建 `proposal.md`（为什么、什么、影响）
   - 创建 `tasks.md`（实施清单）
   - 创建 `design.md`（技术决策，可选）
   - 创建规范增量 `specs/<capability>/spec.md`

4. **验证提案**
   - 运行 `openspec-cn validate <change-id> --strict --no-interactive`
   - 修复所有验证错误

## 参考

详细的 OpenSpec 使用说明请参考：
- [openspec/AGENTS.md](../../openspec/AGENTS.md)

## 注意

- 提案必须包含至少一个规范增量
- 每个需求必须包含至少一个场景
- 使用 `## 新增需求|修改需求|移除需求` 格式编写增量
- 必须通过严格验证才能提交

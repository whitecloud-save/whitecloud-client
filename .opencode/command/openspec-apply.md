---
description: 应用已批准的 OpenSpec 变更提案
argument-hint: <change-id>
---

# OpenSpec 应用变更

本命令用于应用已批准的 OpenSpec 变更提案。

## 调用方式

```
/openspec-apply add-steam-import
```

## 执行步骤

1. **阅读提案文件**
   - 阅读 `proposal.md` 了解变更内容
   - 阅读 `design.md`（如果存在）查看技术决策
   - 阅读 `tasks.md` 获取实施清单

2. **阅读项目文档**
   - 阅读 `.ai/doc/project.md` 了解项目架构
   - 阅读 `.ai/README.md` 了解项目约定

3. **加载相关经验**
   - 根据 `.ai/exp/index.md` 加载相关经验文档

4. **按顺序实施任务**
   - 按照 `tasks.md` 中的任务顺序实施
   - 每完成一个任务，在 `tasks.md` 中标记为完成
   - 实施过程中更新相关文档

5. **验证实施**
   - 运行 `ng build` 构建项目
   - 运行 `ng lint` 检查代码
   - 测试变更功能

6. **更新文档**
   - 更新 `.ai/doc/project.md`
   - 更新相关技术文档

## 参考

详细的 OpenSpec 使用说明请参考：
- [openspec/AGENTS.md](../../openspec/AGENTS.md)

## 注意

- 必须严格按照 `tasks.md` 的顺序实施任务
- 每个任务完成后必须标记为完成
- 实施过程中必须更新相关文档
- 实施完成后必须进行测试验证

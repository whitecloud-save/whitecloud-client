---
description: 生成符合 Conventional Commits 标准的 git 提交信息（中文）
argument-hint: [提交信息]
---

# Git 提交

本命令用于生成符合 Conventional Commits 标准的 git commit 信息并执行提交操作。

## 调用方式

```
/commit
```

或指定提交信息：

```
/commit feat: 添加游戏导入功能
```

## 执行步骤

1. **检查变更状态**
   - 检查暂存变更
   - 检查未暂存变更
   - 根据情况询问用户是否自动暂存

2. **代码质量检查**
   - 运行 `ng lint` 检查代码
   - 如果有错误，提示用户修复

3. **分析变更**
   - 根据变更的文件和内容
   - 识别变更类型和作用域
   - 生成提交信息（如果未指定）

4. **确认并提交**
   - 显示生成的提交信息
   - 询问用户是否确认
   - 执行 `git commit`

## 参考

详细的执行流程和规范请参考：
- [Commit Skill](../skills/commit-message/SKILL.md)

## 注意

- 本命令会自动处理暂存逻辑
- 如果只指定类型（如 `feat:`），会自动生成完整提交信息
- 必须先通过 ESLint 检查才能提交
- **禁止使用 `git reset`**

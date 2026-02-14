# OpenCode 命令

本目录存放 whitecloud-client 项目的 AI 助手命令。

## 命令说明

### commit
**功能**：生成符合 Conventional Commits 标准的 git 提交信息（中文）

**调用方式**：
```
/commit
/commit feat: 添加游戏导入功能
```

**执行流程**：
1. 检查变更状态（暂存、未暂存）
2. 根据情况询问用户是否自动暂存
3. 运行代码质量检查（ng lint）
4. 分析变更并生成提交信息
5. 确认后执行提交

### openspec-proposal
**功能**：创建 OpenSpec 变更提案

**调用方式**：
```
/openspec-proposal 添加 Steam 游戏导入功能
```

**执行流程**：
1. 了解项目上下文（openspec/project.md、活动变更、现有规范）
2. 创建变更目录和文件（proposal.md、tasks.md、design.md、spec 增量）
3. 使用 `openspec-cn validate <id> --strict --no-interactive` 验证

### openspec-apply
**功能**：应用已批准的 OpenSpec 变更提案

**调用方式**：
```
/openspec-apply add-steam-import
```

**执行流程**：
1. 阅读提案文件（proposal.md、design.md、tasks.md）
2. 阅读项目文档（.ai/doc/project.md）
3. 加载相关经验
4. 按顺序实施任务
5. 验证实施（构建、测试）
6. 更新文档

### openspec-archive
**功能**：归档已完成的 OpenSpec 变更提案

**调用方式**：
```
/openspec-archive add-steam-import
```

**执行流程**：
1. 验证变更完成
2. 移动变更目录到 archive
3. 更新规范（如果需要）
4. 验证归档

### sync-api
**功能**：同步服务器 API 定义文件到客户端

**调用方式**：
```
/sync-api
```

**执行流程**：
1. 执行复制命令，将服务器端的 `dist-api-declaration/api.ts` 复制到客户端的 `src/app/service/server/api.ts`
2. 验证文件是否成功复制

**使用场景**：
- 手动触发 API 定义文件同步
- 确保客户端使用最新的接口定义

## 命令目录结构

```
.opencode/command/
└── <command-name>.md    # 命令定义文件
```

## 创建新命令

1. 在 `.opencode/command/` 目录下创建 `<command-name>.md` 文件
2. 文件必须包含：
   - YAML frontmatter（description、argument-hint）
   - **步骤**部分：说明如何执行
   - **参考**部分：相关文档
   - **注意**部分：重要提醒

Frontmatter 示例：
```yaml
---
description: 命令描述
argument-hint: [参数说明]
---
```

## 命令约束

所有命令必须遵守 `.ai/README.md` 中的约束：

- **语言**：使用中文输出
- **禁止事项**：
  - 禁止使用 `git reset`
  - 禁止直接操作数据库
  - 禁止运行危险操作
  - **禁止自动提交代码**：在没有用户明确指令的情况下，禁止执行 `git commit` 操作
- **安全性**：确保操作安全可控

**重要提醒**：
- 即使是 `commit` 命令，也需要在执行前明确告知用户将要提交的内容，并获得用户确认
- 执行任何 git commit 操作前，必须确保用户明确要求提交

## 参考资源

- [Commands 官方文档](https://code.claude.com/docs/en/commands)
- 项目指南：`.ai/README.md`
- Skills 指南：`.opencode/skills/README.md`

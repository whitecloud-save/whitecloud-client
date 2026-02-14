# OpenCode Skills 目录

本目录存放 whitecloud-client 项目的 AI 助手 Skills。

## Skills 目录结构

```
.opencode/skills/
└── <skill-name>/
    ├── SKILL.md              # 主指令文件（必需）
    ├── reference.md          # 参考文档（可选）
    ├── examples.md           # 示例（可选）
    └── templates/           # 模板文件（可选）
```

## 创建新 Skills

### 1. 创建目录
```bash
mkdir -p .opencode/skills/<skill-name>
```

### 2. 编写 SKILL.md
必须包含：
- YAML frontmatter（配置技能行为）
- 指令内容（AI 遵循的具体步骤）

Frontmatter 示例：
```yaml
---
name: skill-name
description: 技能描述，AI 据此判断何时使用
disable-model-invocation: true  # 可选：禁止 AI 自动调用
allowed-tools: Bash(git:*), Read  # 可选：限制可用工具
---
```

### 3. 添加辅助文件（可选）
- `reference.md` - 详细参考文档
- `examples.md` - 使用示例
- `templates/` - 模板文件

### 4. 更新 .ai/README.md
在"Skills 机制"部分添加新技能的说明。

### 5. 创建对应的 Command 文件
为需要频繁调用的技能创建简化的 command 定义：

**判断是否需要创建 Command**：
- ✅ 需要用户频繁手动调用的技能（如 commit）
- ❌ 主要由 AI 自动调用的技能
- ❓ 不确定时倾向于创建（宁滥勿缺）

**创建步骤**：
1. 在 `.opencode/command/` 目录下创建 `<command-name>.md` 文件
2. 参考现有 command 文件格式（如 `commit.md`）
3. Command 文件应包含：
   - YAML frontmatter（description、argument-hint）
   - **步骤**部分：参考 SKILL.md 中的执行步骤
   - **参考**部分：链接到对应的 skill
   - **注意**部分：重要的安全提醒
4. 更新 `.opencode/command/README.md` 中的命令列表

## 使用 Skills

### 手动调用
```
/skill-name [arguments]
```

### AI 自动调用
如果 skill 没有设置 `disable-model-invocation: true`，AI 会根据描述自动加载。

## Skills 约束

所有 Skills 必须遵守 `.ai/README.md` 中的约束：

- **语言**：使用中文输出
- **禁止事项**：
  - 禁止使用 `git reset`
  - 禁止直接操作数据库
  - 禁止运行危险操作
  - **禁止自动提交代码**：在没有用户明确指令的情况下，禁止执行 `git commit` 操作
- **代码风格**：遵循项目约定
- **安全性**：确保操作安全可控

**重要提醒**：
- 即使技能完成所有任务，也**禁止**自动执行 git commit
- 即使是 commit-message skill，也只在用户明确要求时才提交
- 每个技能都必须遵守"禁止自动提交"的核心原则

## 参考资源

- [Skills 官方文档](https://code.claude.com/docs/en/skills)
- [Conventional Commits 规范](https://www.conventionalcommits.org/)
- [Angular 官方文档](https://angular.io/docs)
- 项目指南：`.ai/README.md`
- Command 命令指南：`.opencode/command/README.md`

## 已实现 Skills

| Skill | 功能 | 调用方式 |
|-------|------|---------|
| angular | Angular 框架编程助手（组件、路由、表单、HTTP、依赖注入等） | `/angular` (手动) 或 AI 自动调用 |
| ng-zorro | NG-ZORRO Ant Design UI 组件库开发助手（70+ 企业级 UI 组件） | `/ng-zorro` (手动) 或 AI 自动调用 |
| sync-api | 同步服务器 API 定义文件 | `/sync-api` (手动) 或 AI 自动调用 |
| commit-message | Git 提交信息生成（基于 Conventional Commits 标准） | `/commit [message]` |

---
name: commit
description: 生成符合 Conventional Commits 标准的 git commit 信息（中文）。在需要提交代码时使用
disable-model-invocation: true
allowed-tools: Bash(git:*), Bash(npm:*), Read, Grep
argument-hint: [提交信息]
---

# Git Commit 信息生成

本技能用于生成符合 Conventional Commits 标准的 git commit 信息，并安全地执行提交操作。

**重要提示**：本技能需要创建对应的 command 文件以方便用户调用。
参考 `.opencode/command/README.md` 了解如何创建 command。

## 使用方式

### 基本用法
```
/commit
```
自动检查变更状态：
- **有暂存变更**：只分析暂存变更，生成 2-3 个候选提交信息
- **只有未暂存变更**：询问是否自动 `git add .`，暂存所有变更
- **没有任何变更**：提示没有变更，建议检查工作目录

### 指定提交信息
```
/commit feat: 添加游戏导入功能
```
使用提供的提交信息，但会验证格式并建议优化。同样遵循上述变更检查逻辑。

## 执行流程

### 1. 变更状态检查
```bash
# 检查暂存变更
git diff --cached --stat

# 检查未暂存变更
git diff --stat

# 显示完整状态
git status
```

#### 变更处理逻辑

**情况 1：有暂存变更**
- 只分析暂存变更（`git diff --cached`）
- 忽略未暂存的变更
- 直接进入代码质量检查

**情况 2：只有未暂存变更**
- 提示用户检测到未暂存的变更
- 询问用户是否执行 `git add .` 暂存所有变更
- 如果用户同意，执行 `git add .` 后继续
- 如果用户不同意，提示用户手动选择需要暂存的文件

**情况 3：没有任何变更**
- 提示没有检测到任何变更
- 建议用户检查工作目录或创建新的变更
- 询问用户是否需要查看当前分支的其他信息

### 2. 代码质量检查
```bash
# 运行 ESLint 检查
ng lint
```

如果检查失败，提示用户修复后再提交。

### 3. 分析变更
根据变更的文件和内容，识别：
- **变更类型**：feat、fix、refactor、chore、docs、style、perf、test
- **作用域**（可选）：game、user、setting、save、server、ui 等
- **变更范围**：哪些模块或功能受到影响

### 4. 生成提交信息
遵循以下规则：

#### 类型说明
- `feat:` - 新功能、新特性
- `fix:` - 修复 bug
- `refactor:` - 代码重构（不改变功能）
- `chore:` - 构建、工具、依赖更新
- `docs:` - 文档更新
- `style:` - 代码格式调整（不影响运行）
- `perf:` - 性能优化
- `test:` - 测试相关

#### 作用域（可选）
- `game:` - 游戏相关
- `user:` - 用户相关
- `setting:` - 设置相关
- `save:` - 存档相关
- `server:` - 服务端通信相关
- `ui:` - UI 组件相关
- `dialog:` - 对话框相关

#### 描述格式
- 使用中文
- 简洁明了（不超过 50 字）
- 使用动词开头
- 说明"做了什么"而非"为什么"

#### 破坏性变更
如果涉及破坏性变更，使用 `!` 标记：
```
feat!: 修改游戏导入接口参数格式
```
并在正文或脚注中添加：
```
BREAKING CHANGE: 移除旧版本参数，新增必需字段
```

#### 完整格式
```
<类型>[可选的作用域]: <描述>

[可选的正文]

[可选的脚注]
```

### 5. 确认并提交
```bash
# 执行提交（使用已暂存的变更）
git commit -m "<提交信息>"

# 验证提交
git log -1
git status
```

**注意**：不再需要手动执行 `git add`，因为在前置检查阶段已经处理了暂存逻辑。

## 示例

### 变更状态处理

#### 有暂存变更
```bash
# 用户已有暂存的变更
$ git status
On branch main
Changes to be committed:
  modified:   src/app/main/pages/game/game.component.ts

$ /commit
# AI 检测到暂存变更，只分析暂存的文件
# 生成提交信息：fix(game): 修复游戏启动逻辑
```

#### 只有未暂存变更
```bash
# 用户修改了文件但未暂存
$ git status
On branch main
Changes not staged for commit:
  modified:   src/app/service/game.service.ts

$ /commit
# AI 检测到未暂存变更
AI: 检测到未暂存的变更：
  - src/app/service/game.service.ts

是否执行 git add . 暂存所有变更？(y/n)

# 用户选择 y
$ git add .
$ git commit -m "fix(game): 修复游戏导入逻辑"
```

#### 没有任何变更
```bash
# 工作目录是干净的
$ git status
On branch main
nothing to commit, working tree clean

$ /commit
# AI 检测到没有任何变更
AI: 没有检测到任何变更（包括暂存和未暂存）。

建议：
- 检查是否在正确的分支
- 创建新的代码变更
- 查看 git status 了解当前状态
```

### 新功能
```
feat: 添加游戏导入功能
feat: 用户系统添加第三方登录支持
feat: 更新游戏创建方法，支持同时扫描游戏和手动添加
```

### 修复
```
fix: 修复游戏启动失败问题
fix: 修复存档同步错误
fix: 修复 WebSocket 连接断开后无法重连
```

### 重构
```
refactor: 使用 RxJS 替换 EventEmitter
refactor: 优化组件生命周期管理
refactor: 重构游戏服务代码结构
```

### 依赖更新
```
chore: 更新依赖
chore: 更新 Angular 版本到 17.2.0
chore: 更新 Electron 版本到 30.0.0
```

### 带作用域
```
feat(game): 添加游戏封面自动识别功能
fix(user): 修复登录验证逻辑
chore(setting): 优化设置页面性能
```

### 破坏性变更
```
feat!: 移除旧版本 API 接口
BREAKING CHANGE: 删除旧的组件接口，请迁移到新接口

chore!: 移除 Node 18 支持
BREAKING CHANGE: Node 18 已停止维护，最低版本要求升级到 Node 20
```

## 约束和规则

### 安全约束
- ✅ 使用 `git commit` 提交代码
- ❌ **禁止使用** `git reset` 命令
- ✅ 需要撤销提交时使用 `git revert <commit>`
- ✅ 必须先通过代码检查（ESLint）
- ❌ **禁止**直接操作数据库

### 语言约定
- ✅ 提交信息使用中文
- ✅ 辅助说明使用中文
- ✅ 错误提示使用中文

### 格式约定
- ✅ 类型使用小写（feat、fix）
- ✅ 作用域使用小写（game、user）
- ✅ 描述简洁明了（50 字以内）
- ✅ 如有破坏性变更，必须使用 `!` 标记和 `BREAKING CHANGE`

### 错误处理
- 如果没有任何变更，提示用户检查工作目录
- 如果只有未暂存变更，询问用户是否自动暂存
- 如果 ESLint 检查失败，不执行提交并提示修复
- 如果 git commit 失败，显示错误信息并建议解决方案
- 如果用户拒绝自动暂存，提示用户手动选择文件

## 参考资源

- 完整的 Conventional Commits 规范：[reference.md](reference.md)
- 提交信息模板：[templates/](templates/)

## 注意事项

1. **一次提交一个逻辑**：如果修改涉及多个不相关的功能，拆分为多个提交
2. **描述要准确**：确保提交信息真实反映代码变更
3. **先验证后提交**：确保代码通过检查后再提交
4. **保持一致性**：使用与项目历史提交一致的风格
5. **不使用 reset**：绝对禁止使用 `git reset`，如需撤销使用 `git revert`

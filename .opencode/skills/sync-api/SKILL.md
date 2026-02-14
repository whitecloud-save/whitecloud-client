---
name: sync-api
description: 同步服务器 API 定义文件。在进行代码分析前自动调用，确保服务器接口定义保持最新
disable-model-invocation: false
allowed-tools: Bash
argument-hint: 无需参数
---

# 同步 API 定义文件

本技能用于将服务器端的最新 API 定义文件同步到客户端，确保代码分析时使用最新的接口定义。

## 使用场景

本技能会在以下情况下自动调用：
- 进行代码分析前
- 需要检查服务器接口定义时
- 修改服务器端接口后需要同步更新

## 执行步骤

### 1. 执行复制操作

使用以下命令将服务器 API 定义文件复制到客户端：

```bash
copy "D:\Project\whitecloud\whitecloud-server\dist-api-declaration\api.ts" "src\app\service\server\api.ts" /Y
```

`/Y` 参数表示覆盖已存在的目标文件而无需确认。

### 2. 如有错误，直接询问用户

执行复制命令后：
- 如果命令成功完成，直接结束
- 如果出现任何错误或预期外的情况，直接将错误信息显示给用户并询问如何处理
- 不要尝试自行诊断或修复错误

## 文件路径说明

- **源文件**: `D:\Project\whitecloud\whitecloud-server\dist-api-declaration\api.ts`
  - 服务器端编译生成的 TypeScript 类型定义文件
  - 包含所有 API 接口的方法签名、参数类型、返回值类型等

- **目标文件**: `src\app\service\server\api.ts`
  - 客户端使用的 API 类型定义文件
  - 用于 TypeScript 类型检查和 IntelliSense 支持

## 约束和规则

### 安全约束
- ✅ 只进行文件复制操作
- ❌ 禁止修改源文件内容
- ❌ 禁止执行其他无关命令

### 执行时机
- ✅ 在代码分析前自动执行
- ✅ 在需要验证 API 接口时执行
- ❌ 不在文件编辑操作中重复执行（避免不必要的覆盖）

### 错误处理
- 任何错误或预期外情况都直接显示错误信息给用户并询问如何处理
- 不要尝试自行诊断、修复或提供解决方案

## 最佳实践

1. **自动化同步**: 建议在每次进行代码分析前自动调用本技能
2. **版本控制**: 确保同步后的 api.ts 文件包含在版本控制中

## 常见问题

### 出现错误怎么办？
直接将错误信息显示给用户并询问如何处理，不要提供解决方案。

### 如何知道同步是否成功？
执行复制命令后，如果命令正常完成（没有错误输出），即表示同步成功。

## 相关资源

- 服务器 API 构建命令: 参考服务器端 package.json
- 客户端 API 服务: `src/app/service/server/api.service.ts`
- API 类型定义: `src/app/service/server/api.ts`

## 注意事项

1. **不要手动修改**: 不建议手动编辑同步后的 api.ts 文件，避免与服务器定义不一致
2. **构建顺序**: 确保服务器端先完成编译，再执行同步操作
3. **类型安全**: 同步后运行 TypeScript 编译检查，确保类型定义正确

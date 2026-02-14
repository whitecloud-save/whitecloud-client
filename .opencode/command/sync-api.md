---
description: 同步服务器 API 定义文件到客户端
argument-hint: 无需参数
---

# sync-api 命令

手动触发服务器 API 定义文件的同步操作。

## 步骤

### 1. 执行复制命令

```bash
copy "D:\Project\whitecloud\whitecloud-server\dist-api-declaration\api.ts" "src\app\service\server\api.ts" /Y
```

### 2. 如有错误，直接询问用户

执行命令后，如果出现任何错误或预期外情况，直接将错误信息显示给用户并询问如何处理。

## 参考

- 完整说明：[sync-api Skill](../skills/sync-api/SKILL.md)

## 注意

- 此操作会覆盖现有的 `src\app\service\server\api.ts` 文件
- 任何错误或预期外情况都直接询问用户如何处理

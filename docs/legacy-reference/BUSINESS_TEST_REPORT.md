# 儿童每日学习计划管理应用 - 业务测试报告

**测试日期**: 2026-11-02  
**测试范围**: Server (NestJS) / Web (Vue 3) / Mobile (Flutter) 全端业务逻辑审查  
**测试方法**: 代码级深度审查（因 Docker 权限限制未能启动实际服务）

---

## 执行摘要

### 问题统计

| 严重级别 | 数量 | 说明 |
|---------|------|------|
| **P0 - 安全漏洞** | 5 | 必须立即修复，存在数据泄露或权限绕过风险 |
| **P1 - 业务逻辑错误** | 13 | 核心功能不可用或行为错误 |
| **P2 - 功能缺失** | 15 | 影响用户体验，但系统可运行 |
| **P3 - 代码质量** | 16 | 冗余代码、不一致、潜在风险 |
| **总计** | **49** | — |

### 构建状态

- ✅ Server TypeScript 编译通过
- ✅ Server Vitest 测试通过（62/62）
- ✅ Web Vite 构建成功（1.07s）
- ✅ Flutter 静态分析通过（21 个 info 级别 lint 问题）

---

## P0 - 安全漏洞（5 个）

### 1. WebSocket 认证绕过
**位置**: `server/src/websocket/sync.gateway.ts:36-47`, `notification.gateway.ts:23-39`

**问题描述**:
- SyncGateway 在无 token 时允许通过 user_id 参数连接
- NotificationGateway 完全无认证机制
- 两个网关均设置 `cors: { origin: '*' }`

**影响**: 任何人可伪造身份连接 WebSocket，窃听通知和同步数据

**修复建议**:
```typescript
// sync.gateway.ts
async handleConnection(client: Socket) {
  const token = client.handshake.query['token'] as string;
  if (!token) {
    client.disconnect();
    return;
  }
  // 必须验证 token
}

// notification.gateway.ts - 添加相同的 JWT 认证逻辑
```

---

### 2. 奖励兑换无角色检查
**位置**: `server/src/modules/reward/reward.controller.ts:45-52`

**问题描述**: 任何家庭成员（包括孩子）可调用兑换接口，且 `user_id` 参数可为任意用户，导致孩子可扣减他人积分

**影响**: 积分系统可被恶意利用

**修复建议**:
```typescript
@Post('redeem')
async redeemReward(
  @Body() dto: RedeemRewardDto,
  @CurrentUser() user: JwtPayload,
) {
  if (user.role !== 'parent') {
    throw new BusinessException('FORBIDDEN', 'Only parents can redeem rewards', 403);
  }
  // 强制使用当前用户 ID
  return this.rewardService.redeemReward(dto.reward_id, user.sub, user.family_id);
}
```

---

### 3. 手机号明文存储
**位置**: `server/src/modules/auth/auth.service.ts` 全文，`user.entity.ts:29-30`

**问题描述**: 
- 项目中存在完整的 AES-256-GCM 加密工具 `src/common/utils/phone-encryption.ts`
- 但从未在任何地方导入或使用
- 所有手机号操作均为明文存储和查询

**影响**: 儿童隐私数据泄露风险，违反《儿童个人信息网络保护规定》

**修复建议**:
1. 在 User entity 中添加 phone 字段的加密转换
2. 所有涉及手机号的查询先加密再查询
3. 返回时解密

---

### 4. SMS 验证码为 Mock 实现
**位置**: `server/src/modules/auth/auth.service.ts:412-422`

**问题描述**: `verifySmsCode()` 仅验证格式（6位数字），不与 Redis 中存储的实际验证码比对，任何 6 位数字都能通过验证

**影响**: 注册流程可被绕过，任意手机号可被注册

**修复建议**:
```typescript
async verifySmsCode(phone: string, code: string): Promise<boolean> {
  const key = `sms:register:${phone}`;
  const storedCode = await this.redis.get(key);
  if (!storedCode || storedCode !== code) {
    throw new BusinessException('INVALID_SMS_CODE', '验证码错误', 400);
  }
  await this.redis.del(key);
  return true;
}
```

---

### 5. Sync Push 绕过业务校验
**位置**: `server/src/modules/sync/sync.service.ts:127`

**问题描述**: 客户端推送的 payload 直接写入数据库，绕过所有业务校验（状态转换、优先级权限、审批等）

**影响**: 恶意客户端可通过 sync push 直接修改任务状态或优先级

**修复建议**:
```typescript
// 在 apply payload 前重新走业务校验流程
if (change.action === 'updated') {
  await this.validateTaskUpdate(change.payload, userRole);
}
await this.taskRepo.update(task.id, change.payload as any);
```

---

## P1 - 业务逻辑错误（13 个）

### 6. 审批模式硬编码
**位置**: `server/src/modules/task/task.controller.ts:76`

**问题**: 硬编码为"只要孩子是创建者就启用审批"，未读取 `Family.approval_mode` 字段

**影响**: 家长无法关闭审批模式

---

### 7. 重复任务生成未实现
**位置**: `server/src/jobs/repeat-task.job.ts:8-13`

**问题**: 定时任务为空壳占位符，不会产生 daily/weekly/weekdays 的重复任务实例

**影响**: 重复任务功能完全不可用

---

### 8. 相似标题检测未接入
**位置**: `server/src/modules/task/task.controller.ts` 的 `createTask` 端点

**问题**: `checkSimilarTitle` 方法存在但从未被调用

**影响**: 家长可创建重复任务，前端警告功能失效

---

### 9. 删除权限检查字段错误
**位置**: `server/src/modules/task/task.service.ts:461`

**问题**: 检查 `creator_id` 而非 `assignee_id`，孩子无法删除分配给自己但由家长创建的任务

**影响**: 孩子权限受限，无法删除应属于自己的任务

---

### 10. 审批操作无审计记录
**位置**: `server/src/modules/task/task.service.ts:581-641`

**问题**: `approveTask` 未写入 AuditLog，AuditAction 枚举缺少 TASK_APPROVED/TASK_REJECTED

**影响**: 审批流程无痕迹，无法追溯

---

### 11. 备注操作无审计记录
**位置**: `server/src/modules/note/note.service.ts` 全文

**问题**: create/update/delete 均未写入 AuditLog

**影响**: 备注变更无审计追踪

---

### 12. PIN 登录使用 Mock 数据
**位置**: `mobile/lib/screens/auth/pin_login_screen.dart:136,188`

**问题**: 
- 家庭选择器硬编码 `'mock-family-id'`
- 头像选择使用 `'child-$index'` 作为 ID
- 从未调用 `AuthApi.getFamiliesForPinLogin()` 和 `AuthApi.getChildrenInFamily()`

**影响**: 孩子完全无法通过 PIN 码登录

---

### 13. 任务操作不走离线同步路径
**位置**: `mobile/lib/providers/task.provider.dart` 全文

**问题**: `loadTasks()`、`createTask()`、`updateTaskStatus()`、`deleteTask()` 全部直接调用 `TaskApi`，不经过 `SyncService.enqueueOperation()`

**影响**: 离线时所有任务操作直接失败

---

### 14. 个人资料 API 路径不匹配
**位置**: 
- 前端: `web-admin/src/api/auth.api.ts:66-71` 调用 `GET/PATCH /auth/profile`
- 后端: `server/src/modules/user/user.controller.ts` 实际端点是 `GET/PATCH /users/me`

**影响**: 个人资料功能完全不可用（404）

---

### 15. 任务审计日志 API 路径不匹配
**位置**: 
- 前端: `web-admin/src/api/task.api.ts:84` 调用 `GET /tasks/${taskId}/audit-logs`
- 后端: `server/src/modules/audit/audit.controller.ts` 端点是 `GET /audit-logs/tasks/:taskId`

**影响**: 任务详情页审计历史无法加载（404）

---

### 16. 成员移除是假操作
**位置**: `web-admin/src/views/FamilySettingsView.vue:95-102`

**问题**: `handleRemoveMember` 显示成功提示但未调用任何 API

**影响**: 用户看到成功提示但实际未移除成员

---

### 17. 三个 Job 全为空壳
**位置**: 
- `server/src/jobs/reminder.job.ts:9-13`
- `server/src/jobs/overtime.job.ts:9-13`
- `server/src/jobs/repeat-task.job.ts:9-13`

**问题**: 提醒、超时检测、重复任务生成均无实际实现

**影响**: 通知提醒功能完全不可用

---

### 18. 徽章类型不匹配
**位置**: 
- 种子数据: `badge.seed.ts:5-13` 使用 `'streak_3'`、`'points_50'` 等
- 评估逻辑: `achievement.service.ts:200-211` 只匹配 `'streak'`、`'points'` 等

**影响**: 所有种子徽章永远无法被授予

---

## P2 - 功能缺失（15 个）

### 19. 移动端 WebSocket URL 硬编码
**位置**: `mobile/lib/services/websocket.service.dart:30`

**问题**: 硬编码为 `'wss://ws.example.com/v1/sync'`，未使用环境变量

**影响**: 生产环境无法建立实时连接

---

### 20. 短信发送按钮空实现
**位置**: `mobile/lib/screens/auth/register_screen.dart:127`

**问题**: `onPressed: () {}` 为空回调

**影响**: 用户无法收到验证码，注册流程不可完成

---

### 21. 同步序列未持久化
**位置**: `mobile/lib/db/local_database.dart:37-43`

**问题**: `_loadSyncState()` 始终返回 0，`_saveSyncState()` 为空实现

**影响**: 每次 App 重启后全量重拉变更

---

### 22. 孩子可设置高优先级（UI 层）
**位置**: 
- `mobile/lib/screens/task/create_task_screen.dart:157-184`
- `mobile/lib/screens/task/edit_task_screen.dart:126-150`
- `web-admin/src/components/task/TaskForm.vue:19-31`

**问题**: 前端未根据角色过滤优先级选项，`PermissionUtils.canSetHighPriority()` 未在 UI 层调用

**影响**: 孩子可在 UI 上选择高优先级（虽然后端会拒绝）

---

### 23. Token 刷新并发问题
**位置**: `mobile/lib/api/client.dart:59`

**问题**: `_isRefreshing` 标志仅防止自身重入，多个请求同时 401 时其他请求直接报错

**影响**: 网络不稳定时用户体验差

---

### 24. 状态切换无权限控制（UI 层）
**位置**: `mobile/lib/widgets/task_card.dart:33-58`

**问题**: 所有用户都可执行取消操作，未使用 `PermissionUtils.getAllowedStatusTransitions()`

**影响**: 孩子可执行超出权限的状态转换（后端会拒绝，但 UI 体验差）

---

### 25. 冲突无用户解决 UI
**位置**: `mobile/lib/services/sync.service.dart:126-129`

**问题**: 冲突操作被标记但无 UI 入口让用户查看和解决

**影响**: 离线冲突无法手动解决

---

### 26. 3 个后端 API 缺失
**位置**: 
- `GET /auth/families` - PIN 登录获取家庭列表
- `GET /auth/families/:id/children` - 获取家庭孩子列表
- `GET /tasks/check-similar` - 相似任务检测

**影响**: 移动端和 Web 端相关功能失效

---

### 27. ProfileView color_tag 不持久化
**位置**: `web-admin/src/views/ProfileView.vue:66`

**问题**: `handleSave` 只发送 `nickname`，`color_tag` 仅本地更新

**影响**: 修改标识颜色下次登录时丢失

---

### 28. 通知 Store 缺少 fetchNotifications
**位置**: `web-admin/src/stores/notification.store.ts`

**问题**: 没有从 API 拉取历史通知的方法，仅依赖 WebSocket 实时推送

**影响**: 用户首次打开应用时通知中心为空

---

### 29. Sync Push 缺少批量限制
**位置**: `server/src/modules/sync/sync.service.ts:98-144`

**问题**: 定义了 `SYNC_BATCH_TOO_LARGE` 错误码但未使用

**影响**: 客户端可推送任意数量的变更

---

### 30. 设备 last_sync_seq 永不更新
**位置**: `server/src/modules/sync/sync.service.ts:67`

**问题**: `updateDeviceSync()` 更新了 `last_sync_at` 但未更新 `last_sync_seq`

**影响**: 设备同步进度追踪失效

---

### 31. 奖励缺少下架/编辑接口
**位置**: `server/src/modules/reward/reward.controller.ts`

**问题**: `Reward` 实体有 `is_active` 字段，但没有任何 API 可以修改

**影响**: 奖励一旦创建永远无法下架

---

### 32. 评价缺少修改/删除接口
**位置**: `server/src/modules/review/review.controller.ts`

**问题**: 只有创建和查询接口

**影响**: 家长写错评价后无法修改或删除

---

### 33. 缺少兑换记录查询接口
**位置**: `server/src/modules/reward/reward.controller.ts`

**问题**: 只有取消接口，没有列表查询

**影响**: 前端无法展示兑换历史

---

## P3 - 代码质量（16 个）

### 34. init() 冗余调用
**位置**: `web-admin/src/App.vue:9`, `web-admin/src/router/index.ts:81`

**问题**: `authStore.init()` 每次路由跳转都被调用

---

### 35. joinFamily 角色硬编码
**位置**: `web-admin/src/stores/auth.store.ts:77`

**问题**: `role: 'parent'` 硬编码

---

### 36. createTask 双重请求
**位置**: `web-admin/src/stores/task.store.ts:54`, `web-admin/src/views/TodayView.vue:65`

**问题**: 创建任务后触发两次 `fetchTasks()`

---

### 37. WeekView 是占位符
**位置**: `web-admin/src/views/WeekView.vue:5`

**问题**: 显示"将在 Phase 2 中实现"

---

### 38. 邀请码生成算法不一致
**位置**: 
- `server/src/modules/auth/auth.service.ts:404` - 36 字符集
- `server/src/modules/family/family.service.ts:158` - 32 字符集（排除易混淆字符）

---

### 39. RolesGuard 缺失
**位置**: `server/src/modules/auth/auth.controller.ts:57-58`

**问题**: `@Roles(UserRole.PARENT)` 装饰器仅设置 metadata，无对应 Guard

---

### 40. 手机号无唯一约束
**位置**: `server/src/modules/user/entities/user.entity.ts:29-30`

**问题**: `phone` 字段无 `unique: true`，仅应用层检查

---

### 41. 加入家庭无需短信验证
**位置**: `server/src/modules/auth/dto/join-family.dto.ts`

**问题**: 无 `sms_code` 字段

---

### 42. 恢复任务强制重置状态为 TODO
**位置**: `server/src/modules/task/task.service.ts:546`

**问题**: 无论删除前是什么状态，恢复后一律变成 TODO

---

### 43. 按组删除审计日志不完整
**位置**: `server/src/modules/task/task.service.ts:471-498`

**问题**: 批量删除时只记录了一条审计日志

---

### 44. 孩子可查看非本人任务的审计日志
**位置**: `server/src/modules/audit/audit.controller.ts:63-67`

**问题**: 代码注释承认问题存在但未做过滤

---

### 45. 审批模式下任务可被孩子自行推进状态
**位置**: `server/src/modules/task/task.service.ts:335`

**问题**: 未检查 `approval_status === 'pending'`

---

### 46. 查看备注不校验任务分配关系
**位置**: `server/src/modules/note/note.service.ts:21-47`

**问题**: 孩子能看到任意任务的备注

---

### 47. 创建标签权限拒绝方式不规范
**位置**: `server/src/modules/tag/tag.controller.ts:38-40`

**问题**: 返回 HTTP 200 + 自定义错误体，而非 403 异常

---

### 48. 注册页无手机号格式校验
**位置**: `mobile/lib/screens/auth/register_screen.dart`

**问题**: 无正则检查

---

### 49. Token 刷新失败后未触发登出
**位置**: `mobile/lib/api/client.dart`

**问题**: 刷新失败后用户会持续收到 401 错误

---

## 测试结论

### 整体评估

**当前状态**: 核心架构完整，但存在多个阻断性问题和功能缺失

**可上线程度**: 
- ❌ **不可直接上线** - 存在 5 个 P0 安全漏洞
- ⚠️ **需修复 P0 + P1 后可内测** - 修复 18 个问题后可进行内部测试
- ✅ **修复全部 P0-P2 后可公测** - 修复 33 个问题后可公开测试

### 优先修复建议

**第一阶段（1-2 天）- 修复 P0 安全漏洞**:
1. WebSocket 认证加固
2. 奖励兑换角色检查
3. 手机号加密存储
4. SMS 验证码真实校验
5. Sync Push 业务校验

**第二阶段（3-5 天）- 修复 P1 业务逻辑**:
1. 审批模式读取 Family 配置
2. 实现重复任务生成
3. 接入相似标题检测
4. 修复删除权限检查字段
5. 补全审计日志
6. 修复 PIN 登录 mock 数据
7. 任务操作走离线同步路径
8. 对齐 API 路径
9. 实现成员移除功能
10. 实现三个 Job 功能
11. 修复徽章类型匹配

**第三阶段（1 周）- 补全 P2 功能缺失**:
1. WebSocket URL 环境变量化
2. 实现短信发送功能
3. 持久化同步序列
4. UI 层权限控制
5. Token 刷新并发优化
6. 实现缺失的 API 端点
7. 补全奖励/评价/兑换管理接口

### 架构亮点

✅ 技术选型合理（NestJS + Vue 3 + Flutter）  
✅ 离线同步协议设计完整（change_sequence + 增量同步）  
✅ 权限框架完整（CASL + 角色隔离）  
✅ 审计日志体系健全（操作追踪 + 不可篡改）  
✅ 单元测试覆盖（62 个测试通过）  

### 主要风险

⚠️ 儿童隐私数据保护不足（手机号明文存储）  
⚠️ WebSocket 安全漏洞（无认证/全开 CORS）  
⚠️ 多个核心功能未实现（重复任务/提醒/审批）  
⚠️ 前后端 API 路径不一致  
⚠️ 离线同步路径未真正使用  

---

**报告生成时间**: 2026-11-02  
**测试团队**: 5 个并行测试 Agent  
**报告版本**: v1.0

# 小计划 — 实现规格

> 需求见 [kids-todo-requirements.md](kids-todo-requirements.md)。
> 本文描述当前实现（KeelBase v1.3.0 应用根：`Server-NestJS` / `Front-Flutter` / `Web-Admin-Vue` / `Front-Taro`）。

## 1. 应用结构

应用根即 KeelBase 仓库拷贝，业务模块通过 `node scripts/keelbase-init.mjs --spec specs/<module>.json` 生成并自动接线。

| 路径 | 说明 |
|------|------|
| `Server-NestJS/src/tasks/` | 任务（生成 + 手写扩展） |
| `Server-NestJS/src/task_notes/` | 任务备注 |
| `Server-NestJS/src/families/` | 家庭与邀请码 |
| `Server-NestJS/src/rewards/` | 奖励 + 兑换逻辑 |
| `Server-NestJS/src/reward_redemptions/` | 兑换记录 |
| `Server-NestJS/src/daily_reviews/` | 家长每日评价 |
| `Server-NestJS/src/badges/` | 徽章定义 |
| `Server-NestJS/src/badge_awards/` | 徽章授予 |
| `Server-NestJS/src/checkins/` | 每日打卡记录 |
| `Server-NestJS/src/achievements/` | 积分/连签 |
| `Server-NestJS/src/stats/` | 家庭与个人统计（手写） |
| `Server-NestJS/src/common/services/family-scope.service.ts` | 家庭范围解析（控制器传 JWT，AI 工具传 userId） |
| `Front-Flutter/lib/features/auth/presentation/pages/child_login_page.dart` | 孩子 PIN 登录页（手写） |
| `Front-Flutter/lib/features/tasks/presentation/pages/tasks_page.dart` | 任务列表 + 完成/审批操作 |
| `specs/*.json` | 10 个生成模块的输入协议 |

## 2. 身份与家庭

### 2.1 User 扩展字段

`Server-NestJS/src/common/entities/user.entity.ts`：

| 字段 | 类型 | 说明 |
|------|------|------|
| `familyId` | int, nullable | 所属家庭 |
| `familyRole` | `parent` \| `child` | 家庭内角色 |
| `pinHash` | varchar, select:false | 孩子 PIN（bcrypt） |
| `parentLabel` | varchar | 家长标识（预留） |
| `colorTag` | varchar | 成员标识色 |
| `isActive` | bool | 账号启用 |
| `lastLoginAt` | timestamp | 最近登录 |

JWT payload 增加 `familyId` / `familyRole`（`src/auth/interfaces/jwt-payload.interface.ts`）。

### 2.2 认证端点

| Method | Path | 说明 |
|--------|------|------|
| POST | `/api/v1/auth/register` | 家长注册；自动创建家庭并成为 parent |
| POST | `/api/v1/auth/child-login` | `{ username, pin, deviceId, inviteCode? }` → token（邀请码选填；不填时按全局唯一的登录账号匹配孩子，填了则限定该家庭） |
| POST | `/api/v1/auth/children` | 家长创建孩子 `{ nickname, pin, username?, colorTag? }`；`username` 可选（3-32 位字母/数字/下划线），不填自动生成 |
| PATCH | `/api/v1/auth/children/:id` | 家长修改自己孩子的登录账号、昵称或 PIN `{ username?, nickname?, pin? }`（至少一项；pin 为 4-6 位数字） |
| POST | `/api/v1/auth/join-family` | 已有账号用邀请码加入（最多 2 位家长） |
| GET | `/api/v1/auth/family` | 当前家庭 + 成员（不含手机号） |
| PATCH | `/api/v1/auth/family/settings` | 家庭创建者修改家庭名称/审批模式/可用时段/状态（其他家长与孩子只读） |
| POST | `/api/v1/auth/family/regenerate-invite` | 家庭创建者重置邀请码 |

家庭 `status` 为 `active` / `inactive`；删除家庭只把状态置为 `inactive`，不做物理删除，可恢复。

## 3. 权限模型

- 角色：`user` / `admin` 仍是平台角色；家庭内角色由 `familyRole` 表达。
- CASL 规则：共享模块（Task / TaskNote / Reward / RewardRedemption / DailyReview / Familie）的 `ownerField = familyId`，条件值取 JWT 的 `familyId`；个人模块（Achievement / Checkin / BadgeAward）仍按 `userId`。
- 规则位置：`src/authz/generated-role-rules.ts`（生成器接线，按家庭共享调整）。
- 身份缺失一律 DENY：`familyId` 为空时不下发 `familyId = undefined` 的条件（避免匹配空家庭行）。
- 家长专属操作（审批、家庭设置、创建孩子）在服务层校验 `familyRole === 'parent'`。

## 4. 数据模型（业务字段）

### Task（`tasks`）

`title, description, priority, status, taskDate, estimatedMinutes, repeatRule, approvalStatus, helpRequested, helpRequestNote, sortOrder` + 扩展：

`familyId, assigneeId, completedAt, approvedBy, approvedAt, repeatGroupId, userId, version, deletedAt`

### 其他实体

| 实体 | 关键字段 |
|------|---------|
| TaskNote | `taskId(→tasks), content, contentType, mediaUrl, familyId, userId` |
| Familie | `name, inviteCode(unique), approvalMode, useTimeStart, useTimeEnd, userId` |
| Reward | `title, description, pointsCost, isActive, familyId, userId` |
| RewardRedemption | `rewardId(→rewards), pointsSpent, isCancelled, note, familyId, userId` |
| DailyReview | `reviewDate, content, rating, familyId, userId` |
| Badge | `name, description, badgeType, threshold, iconUrl` |
| BadgeAward | `badgeId(→badges), earnedOn, userId` |
| Checkin | `checkDate, totalTasks, doneTasks, isPerfect, pointsEarned, familyId, userId` |
| Achievement | `totalPoints, currentStreak, longestStreak, lastActiveDate, familyId, userId` |

## 5. 任务工作流

| Method | Path | 说明 |
|--------|------|------|
| GET | `/api/v1/tasks?q=&status=&date=&assigneeId=` | 家庭任务列表（`date` 按日期前缀匹配） |
| GET | `/api/v1/tasks/:id` | 任务详情 |
| GET | `/api/v1/tasks/:id/history` | 任务操作历史（读 `change_sequence`，不可删除；每行含操作者 `userId`、动作、状态快照、时间） |
| POST | `/api/v1/tasks` | 创建；孩子创建时按家庭审批开关置 `pending` |
| PATCH | `/api/v1/tasks/:id` | 更新（乐观锁 version）；可改标题/描述/优先级/日期/重复规则/预计时长/附件 `attachmentUrl`。孩子只能改自己创建的（`userId` 为本人）否则 403；家长可改家庭内任何任务 |
| PATCH | `/api/v1/tasks/:id/complete` | 完成：`status=done`、写 `completedAt`、结算积分/连签/打卡、生成重复任务下一实例（单向，已完成再调原样返回） |
| PATCH | `/api/v1/tasks/:id/uncomplete` | 撤销完成：`status=todo`、清 `completedAt`，扣回该任务的 10 分并重算当天打卡（徽章与连签不回收）。归属规则同 PATCH 更新 |
| PATCH | `/api/v1/tasks/:id/approve` | 家长审批通过 |
| PATCH | `/api/v1/tasks/:id/reject` | 家长驳回 |
| PATCH | `/api/v1/tasks/:id/help` | 请求帮助 `{ note? }` |
| DELETE | `/api/v1/tasks/:id` | 软删（回收站可恢复）。归属规则同 PATCH 更新：孩子不能删家长创建的任务 |

积分规则：每完成一个任务 +10 分；连签按 `lastActiveDate` 是否等于昨天递增，否则重置为 1。

任务编辑权限：任务创建者记在 `tasks.user_id`。孩子（JWT `familyRole = 'child'`）对 `userId` 不是自己的任务执行更新 / 撤销完成 / 删除时返回 403；家长可操作家庭内任何任务。完成（complete）不设此限制——家长布置给孩子的任务本来就由孩子勾选完成。App 任务详情页按同一规则隐藏编辑 / 删除 / 标记未完成入口。

列表展示：任务页按当前展示顺序自动编号（1、2、3…），并支持本地排序——默认（服务端顺序：`sortOrder` 升序、创建时间倒序）、优先级（高→低）、状态（待办→进行中→已完成→已取消）、创建时间（新→旧）。Web 工作台任务表同样提供序号列与优先级 / 状态 / 创建时间排序。

附件：文件先 `POST /api/v1/upload`（multipart，字段 `file`）拿到 URL，再写入任务的 `attachmentUrl` / `attachmentName` 或备注的 `mediaUrl`。允许图片（jpg/png/gif/webp）、PDF、ZIP、Office 文档（docx/xlsx/pptx）与 txt；App 端支持拍照、从相册选择、选文件，单任务单附件，重新上传即替换。图片在详情页内全屏预览（可缩放），其他文件用系统外部应用打开。

### 5.1 任务备注（对话）

| Method | Path | 说明 |
|--------|------|------|
| GET | `/api/v1/task_notes?taskIdId=<id>` | 某任务的备注，按时间正序 |
| GET | `/api/v1/task_notes/unread` | 每个任务的未读备注数（`counts`，不含自己发的）+ 别人对该任务的未读变更数（`changes`，按 `change_sequence` 与已读位置 `task_note_reads.last_read_change_id` 计算） |
| POST | `/api/v1/task_notes/read` | `{ taskId }`：打开详情时标记已读 |
| POST | `/api/v1/task_notes` | `{ taskIdId, content, contentType }`；`mediaUrl` 可选（`contentType=image` 时展示图片并可全屏预览；`contentType=file` 时 `content` 存文件名，点击用系统应用打开） |

备注只追加不覆盖；App 任务详情页按「自己/对方」左右气泡展示，每条都显示作者（自己显示「我 · 昵称」）与时间。任务列表页对存在未读备注的任务显示红色「N 条新备注」，对别人改过、自己还没打开过的任务显示蓝色「有更新」；两者都在打开任务详情时（`POST /task_notes/read` 推进备注与变更两个已读位置）清除。

## 6. 奖励兑换

| Method | Path | 说明 |
|--------|------|------|
| GET | `/api/v1/rewards` | 家庭奖励列表 |
| POST | `/api/v1/rewards` | 创建奖励 |
| POST | `/api/v1/rewards/:id/redeem` | 校验积分 → 扣分 → 生成兑换记录 |
| GET | `/api/v1/rewards/redemptions` | 家庭兑换记录 |
| PATCH | `/api/v1/rewards/redemptions/:id/cancel` | 取消兑换并退分 |

## 7. 统计

| Method | Path | 说明 |
|--------|------|------|
| GET | `/api/v1/stats/overview?date=YYYY-MM-DD` | 今日任务总数/完成数/完成率、成员数、家庭总积分；`date` 为调用方本地日期（与任务列表同口径），不传按 UTC 当天 |
| GET | `/api/v1/stats/completion-rate?days=7` | 最近 N 天每日完成率（1-30） |
| GET | `/api/v1/stats/child-created-ratio` | 孩子创建任务占比 |
| GET | `/api/v1/stats/streak` | 本人总积分、当前/最长连签、最近 30 天打卡 |

## 8. 前端

- Flutter：保留 KeelBase `core/` + `features/` 结构；外壳为小计划——品牌 `小计划`、默认中文、引导页/登录页文案、底部恰好 5 个 Tab「今日/任务/家庭/奖励/我的」；`TodayPage` 展示今日完成率、家庭积分、连签与今日任务；任务页为月历 + 日期联动 + 儿童风彩色卡片；任务列表对未读备注显示「N 条新备注」；任务详情页含备注对话（每条显示作者）与默认折叠、点击展开的操作历史（谁 · 做了什么 · 状态 · 时间），未完成任务可编辑（共用新增表单），完成后可「标记未完成」，返回列表时自动重载；任务可拍照/选图作为附件，备注可发图片；家庭页对家长支持改名、邀请码、审批模式、成员、停用/恢复，孩子只看到「家庭成员」卡片；奖励页家长可增删，孩子只读（兑换入口在 Web 工作台）；新增孩子登录页。
- Web-Admin-Vue：登录页与品牌已改为小计划；普通家长登录后落到 `/workbench` 小计划工作台（今日任务/家庭/奖励/每日评价），首页展示完成率、家庭积分、成员数与任务操作（日期选择器默认本地今天，可切换日期查看当天任务与完成情况；任务表序号 + 优先级/状态/创建时间排序；「编辑」按与服务端相同的归属规则显示——家长每行可编辑，孩子只在自己创建的任务上可见；审批按钮仅家长可见）；管理台新增「小计划」数据分组（任务/家庭/奖励/兑换/评价/徽章/成就/打卡等），其余 KeelBase 管理页保留。
- Taro：使用生成的 H5 页面。

## 8.5 离线同步

| Method | Path | 说明 |
|--------|------|------|
| POST | `/api/v1/sync/register-device` | 登记/更新设备（userId+deviceId 唯一） |
| GET | `/api/v1/sync/changes?since=&limit=&deviceId=` | 按家庭拉取 `change_sequence` 增量 |
| POST | `/api/v1/sync/push` | 推送离线变更（task 的 insert/update/delete/complete），逐条返回 applied/conflict/error |
| POST | `/api/v1/sync/ack` | 确认已处理到的序号 |

- 变更流水由 `ChangeLogService` 写入；任务与备注的 create/update/delete/complete/approve/reject/help 均记录。
- 客户端队列：`Front-Flutter/lib/features/sync/data/services/offline_sync_service.dart` + `pending_ops_service.dart`；任务列表加载前先 flush 队列。
- 冲突：update 走乐观锁；`update`/`complete` 失败会回传服务端当前行，客户端保留条目等待下轮。

## 8.6 徽章自动授予

任务完成结算后，`TaskProgressService` 按以下规则补发徽章（同一 badgeType 只发一枚）：

| 类型 | 条件 |
|------|------|
| `streak_3/7/30/100` | 当前连签 ≥ 阈值 |
| `points_50/200/500` | 累计积分 ≥ 阈值 |
| `perfect_day` | 当日全部任务完成 |
| `perfect_week` | 最近 7 天打卡全部 `isPerfect` |

## 9. 验证

```bash
# 结构合规
node scripts/keelbase-doctor.mjs

# 后端
cd Server-NestJS
npm run build
npm test -- "tasks|families|rewards|daily_reviews|badges|checkins|achievements|task_notes|reward_redemptions|badge_awards" --runInBand

# Flutter
cd Front-Flutter
flutter analyze
flutter test

# Web
cd Web-Admin-Vue
npm run typecheck
npm run build

# Taro
cd Front-Taro
npm run build:h5
```

## 10. 迁移

| 文件 | 驱动 | 说明 |
|------|------|------|
| `1846000000000-AddKidsTodoModulesAndSync.ts` | sqlite | 10 个模块表 + 家庭/任务扩展列 + 同步表 |
| `1847000000000-AddKidsTodoModulesAndSyncPostgres.ts` | postgres | 同内容的 PostgreSQL 方言版本，已登记 `POSTGRES_MIGRATION_GLOBS` |
| `1848000000000-AddFamilyStatus.ts` | sqlite | 家庭 `status` 列（删除只改状态） |
| `1849000000000-AddFamilyStatusPostgres.ts` | postgres | 家庭 `status` 列的 PostgreSQL 版本 |
| `1850000000000-AddTaskNoteMediaNullable.ts` | sqlite | `task_notes.mediaUrl` 改为可空 |
| `1851000000000-AddTaskNoteMediaNullablePostgres.ts` | postgres | 同上的 PostgreSQL 版本 |
| `1852000000000-AddTaskNoteReads.ts` | sqlite | 任务备注已读位置表 `task_note_reads` |
| `1853000000000-AddTaskNoteReadsPostgres.ts` | postgres | 同上的 PostgreSQL 版本 |

验证：两个空库分别执行 `migration:run` 后 `migration:generate` 均返回 “No changes”。

## 11. 未实现 / 后续

- 任务提醒（可复用框架 ReminderWorker，需要 `QUEUE_ENABLED=true` + Redis）。
- Web/Taro 端的离线队列（当前仅 Flutter 主 App 接入）。
- 徽章定义的管理端维护（当前通过生成模块 CRUD 管理）。

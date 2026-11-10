# KeelBase 开发计划：儿童每日学习计划管理应用

> 基于 KeelBase 全栈协议驱动运行时 | 2026-11-02
> 关联文档：kids-todo-prd.md, kids-todo-spec.md

---

## 技术栈确认（KeelBase 适配）

| 层级 | 技术 | 说明 |
|------|------|------|
| 后端框架 | NestJS + TypeScript | KeelBase Server 层 |
| ORM | TypeORM | KeelBase 内置 |
| 数据库 | PostgreSQL | 主库 |
| 认证 | JWT + CASL | KeelBase 内置权限框架 |
| Web 管理端 | Vue 3 + TypeScript | KeelBase Web-Admin 层 |
| 移动端 | Flutter + Dart (仅 Android) | KeelBase Front 层 |
| 实时通信 | WebSocket (NestJS Gateway) | KeelBase 协议驱动 |
| 部署 | Docker Compose | KeelBase 标准部署 |

---

## 项目结构（KeelBase 规范）

```
kids-todo/
├── docker-compose.yml
├── .env
├── README.md
│
├── server/                          # KeelBase Server - NestJS
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   │
│   │   ├── common/                  # 公共模块
│   │   │   ├── decorators/
│   │   │   │   ├── current-user.decorator.ts
│   │   │   │   ├── roles.decorator.ts
│   │   │   │   └── family-member.decorator.ts
│   │   │   ├── filters/
│   │   │   │   └── global-exception.filter.ts
│   │   │   ├── interceptors/
│   │   │   │   ├── audit-log.interceptor.ts
│   │   │   │   ├── transform.interceptor.ts
│   │   │   │   └── ws-sync.interceptor.ts
│   │   │   ├── guards/
│   │   │   │   ├── jwt-auth.guard.ts
│   │   │   │   ├── casl.guard.ts
│   │   │   │   └── use-time-limit.guard.ts
│   │   │   └── pipes/
│   │   │       └── validation.pipe.ts
│   │   │
│   │   ├── config/
│   │   │   ├── database.config.ts
│   │   │   ├── jwt.config.ts
│   │   │   ├── redis.config.ts
│   │   │   └── app.config.ts
│   │   │
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   │   ├── auth.module.ts
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── strategies/
│   │   │   │   │   ├── jwt.strategy.ts
│   │   │   │   │   └── local.strategy.ts
│   │   │   │   ├── dto/
│   │   │   │   │   ├── register.dto.ts
│   │   │   │   │   ├── login.dto.ts
│   │   │   │   │   ├── join-family.dto.ts
│   │   │   │   │   └── add-child.dto.ts
│   │   │   │   └── guards/
│   │   │   │       └── sms-code.guard.ts
│   │   │   │
│   │   │   ├── family/
│   │   │   │   ├── family.module.ts
│   │   │   │   ├── family.controller.ts
│   │   │   │   ├── family.service.ts
│   │   │   │   ├── entities/
│   │   │   │   │   └── family.entity.ts
│   │   │   │   └── dto/
│   │   │   │       ├── update-family.dto.ts
│   │   │   │       └── invite-code.dto.ts
│   │   │   │
│   │   │   ├── user/
│   │   │   │   ├── user.module.ts
│   │   │   │   ├── user.controller.ts
│   │   │   │   ├── user.service.ts
│   │   │   │   ├── entities/
│   │   │   │   │   └── user.entity.ts
│   │   │   │   └── dto/
│   │   │   │       └── update-user.dto.ts
│   │   │   │
│   │   │   ├── task/
│   │   │   │   ├── task.module.ts
│   │   │   │   ├── task.controller.ts
│   │   │   │   ├── task.service.ts
│   │   │   │   ├── entities/
│   │   │   │   │   ├── task.entity.ts
│   │   │   │   │   └── task-tag.entity.ts
│   │   │   │   ├── dto/
│   │   │   │   │   ├── create-task.dto.ts
│   │   │   │   │   ├── update-task.dto.ts
│   │   │   │   │   └── query-task.dto.ts
│   │   │   │   └── task.state-machine.ts
│   │   │   │
│   │   │   ├── note/
│   │   │   │   ├── note.module.ts
│   │   │   │   ├── note.controller.ts
│   │   │   │   ├── note.service.ts
│   │   │   │   ├── entities/
│   │   │   │   │   └── task-note.entity.ts
│   │   │   │   └── dto/
│   │   │   │       ├── create-note.dto.ts
│   │   │   │       └── update-note.dto.ts
│   │   │   │
│   │   │   ├── tag/
│   │   │   │   ├── tag.module.ts
│   │   │   │   ├── tag.controller.ts
│   │   │   │   ├── tag.service.ts
│   │   │   │   └── entities/
│   │   │   │       └── tag.entity.ts
│   │   │   │
│   │   │   ├── audit/
│   │   │   │   ├── audit.module.ts
│   │   │   │   ├── audit.controller.ts
│   │   │   │   ├── audit.service.ts
│   │   │   │   └── entities/
│   │   │   │       └── audit-log.entity.ts
│   │   │   │
│   │   │   ├── achievement/
│   │   │   │   ├── achievement.module.ts
│   │   │   │   ├── achievement.controller.ts
│   │   │   │   ├── achievement.service.ts
│   │   │   │   ├── entities/
│   │   │   │   │   ├── achievement.entity.ts
│   │   │   │   │   ├── badge-definition.entity.ts
│   │   │   │   │   ├── user-badge.entity.ts
│   │   │   │   │   └── check-in-record.entity.ts
│   │   │   │   └── points-calculator.ts
│   │   │   │
│   │   │   ├── reward/
│   │   │   │   ├── reward.module.ts
│   │   │   │   ├── reward.controller.ts
│   │   │   │   ├── reward.service.ts
│   │   │   │   └── entities/
│   │   │   │       ├── reward.entity.ts
│   │   │   │       └── reward-redemption.entity.ts
│   │   │   │
│   │   │   ├── review/
│   │   │   │   ├── review.module.ts
│   │   │   │   ├── review.controller.ts
│   │   │   │   ├── review.service.ts
│   │   │   │   └── entities/
│   │   │   │       └── daily-review.entity.ts
│   │   │   │
│   │   │   ├── stats/
│   │   │   │   ├── stats.module.ts
│   │   │   │   ├── stats.controller.ts
│   │   │   │   └── stats.service.ts
│   │   │   │
│   │   │   └── sync/
│   │   │       ├── sync.module.ts
│   │   │       ├── sync.controller.ts
│   │   │       ├── sync.service.ts
│   │   │       └── entities/
│   │   │           ├── device-sync.entity.ts
│   │   │           └── change-sequence.entity.ts
│   │   │
│   │   ├── websocket/
│   │   │   ├── sync.gateway.ts
│   │   │   ├── notification.gateway.ts
│   │   │   └── ws-auth.guard.ts
│   │   │
│   │   ├── casl/
│   │   │   ├── casl.module.ts
│   │   │   ├── casl-ability.factory.ts
│   │   │   └── policies/
│   │   │       ├── task.policy.ts
│   │   │       ├── note.policy.ts
│   │   │       ├── reward.policy.ts
│   │   │       └── family.policy.ts
│   │   │
│   │   ├── jobs/
│   │   │   ├── reminder.job.ts
│   │   │   ├── overtime.job.ts
│   │   │   ├── repeat-task.job.ts
│   │   │   └── approval-timeout.job.ts
│   │   │
│   │   └── database/
│   │       ├── migrations/
│   │       └── seeds/
│   │           ├── badge.seed.ts
│   │           └── tag.seed.ts
│   │
│   ├── test/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── e2e/
│   │
│   ├── package.json
│   ├── tsconfig.json
│   ├── nest-cli.json
│   └── Dockerfile
│
├── web-admin/                       # KeelBase Web-Admin - Vue 3
│   ├── src/
│   │   ├── main.ts
│   │   ├── App.vue
│   │   ├── router/
│   │   │   └── index.ts
│   │   ├── stores/
│   │   │   ├── auth.store.ts
│   │   │   ├── task.store.ts
│   │   │   ├── family.store.ts
│   │   │   ├── sync.store.ts
│   │   │   └── notification.store.ts
│   │   ├── api/
│   │   │   ├── client.ts            # Axios 封装
│   │   │   ├── auth.api.ts
│   │   │   ├── task.api.ts
│   │   │   ├── family.api.ts
│   │   │   ├── note.api.ts
│   │   │   ├── audit.api.ts
│   │   │   ├── stats.api.ts
│   │   │   ├── achievement.api.ts
│   │   │   ├── reward.api.ts
│   │   │   ├── review.api.ts
│   │   │   └── sync.api.ts
│   │   ├── composables/
│   │   │   ├── useAuth.ts
│   │   │   ├── useWebSocket.ts
│   │   │   ├── usePermissions.ts
│   │   │   └── useSync.ts
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── AppHeader.vue
│   │   │   │   ├── AppSidebar.vue
│   │   │   │   ├── UserAvatar.vue
│   │   │   │   ├── PriorityDot.vue
│   │   │   │   ├── TagChips.vue
│   │   │   │   ├── CreatorBadge.vue
│   │   │   │   ├── StatusButton.vue
│   │   │   │   └── DateNavigator.vue
│   │   │   ├── task/
│   │   │   │   ├── TaskCard.vue
│   │   │   │   ├── TaskList.vue
│   │   │   │   ├── TaskForm.vue
│   │   │   │   ├── TaskDetail.vue
│   │   │   │   ├── TaskGroupHeader.vue
│   │   │   │   └── SimilarTaskWarning.vue
│   │   │   ├── note/
│   │   │   │   ├── NotesTimeline.vue
│   │   │   │   ├── NoteBubble.vue
│   │   │   │   └── AddNoteInput.vue
│   │   │   ├── audit/
│   │   │   │   ├── AuditTimeline.vue
│   │   │   │   └── AuditEntry.vue
│   │   │   ├── stats/
│   │   │   │   ├── CompletionRateChart.vue
│   │   │   │   ├── CategoryPieChart.vue
│   │   │   │   ├── TrendLineChart.vue
│   │   │   │   └── StreakCalendar.vue
│   │   │   ├── achievement/
│   │   │   │   ├── PointsDisplay.vue
│   │   │   │   ├── BadgeGrid.vue
│   │   │   │   └── RewardList.vue
│   │   │   └── family/
│   │   │       ├── MemberList.vue
│   │   │       ├── InviteCode.vue
│   │   │       └── FamilySettings.vue
│   │   ├── views/
│   │   │   ├── LoginView.vue
│   │   │   ├── RegisterView.vue
│   │   │   ├── JoinFamilyView.vue
│   │   │   ├── TodayView.vue
│   │   │   ├── WeekView.vue
│   │   │   ├── MonthView.vue
│   │   │   ├── TaskDetailView.vue
│   │   │   ├── AuditLogView.vue
│   │   │   ├── StatsView.vue
│   │   │   ├── AchievementsView.vue
│   │   │   ├── RewardsView.vue
│   │   │   ├── ReviewView.vue
│   │   │   ├── FamilySettingsView.vue
│   │   │   └── ProfileView.vue
│   │   ├── types/
│   │   │   ├── task.types.ts
│   │   │   ├── user.types.ts
│   │   │   ├── family.types.ts
│   │   │   └── api.types.ts
│   │   ├── styles/
│   │   │   ├── variables.scss
│   │   │   └── global.scss
│   │   └── utils/
│   │       ├── date.ts
│   │       ├── permission.ts
│   │       └── similarity.ts
│   │
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── Dockerfile
│
├── mobile/                          # KeelBase Front - Flutter (Android Only)
│   ├── lib/
│   │   ├── main.dart
│   │   ├── app/
│   │   │   ├── app.dart
│   │   │   ├── routes.dart
│   │   │   └── theme.dart
│   │   ├── api/
│   │   │   ├── client.dart          # Dio 封装
│   │   │   ├── auth.api.dart
│   │   │   ├── task.api.dart
│   │   │   ├── note.api.dart
│   │   │   ├── sync.api.dart
│   │   │   └── stats.api.dart
│   │   ├── models/
│   │   │   ├── task.model.dart
│   │   │   ├── user.model.dart
│   │   │   ├── family.model.dart
│   │   │   ├── note.model.dart
│   │   │   ├── achievement.model.dart
│   │   │   └── sync.model.dart
│   │   ├── providers/               # Riverpod 状态管理
│   │   │   ├── auth.provider.dart
│   │   │   ├── task.provider.dart
│   │   │   ├── family.provider.dart
│   │   │   ├── sync.provider.dart
│   │   │   └── notification.provider.dart
│   │   ├── screens/
│   │   │   ├── auth/
│   │   │   │   ├── login_screen.dart
│   │   │   │   ├── register_screen.dart
│   │   │   │   ├── pin_login_screen.dart
│   │   │   │   └── join_family_screen.dart
│   │   │   ├── home/
│   │   │   │   ├── today_screen.dart
│   │   │   │   └── home_shell.dart
│   │   │   ├── task/
│   │   │   │   ├── task_detail_screen.dart
│   │   │   │   ├── create_task_screen.dart
│   │   │   │   └── edit_task_screen.dart
│   │   │   ├── stats/
│   │   │   │   └── stats_screen.dart
│   │   │   ├── achievement/
│   │   │   │   └── achievements_screen.dart
│   │   │   └── settings/
│   │   │       ├── family_settings_screen.dart
│   │   │       └── profile_screen.dart
│   │   ├── widgets/
│   │   │   ├── task_card.dart
│   │   │   ├── task_swipe_actions.dart
│   │   │   ├── priority_indicator.dart
│   │   │   ├── creator_badge.dart
│   │   │   ├── progress_ring.dart
│   │   │   ├── note_bubble.dart
│   │   │   ├── points_animation.dart
│   │   │   └── streak_badge.dart
│   │   ├── services/
│   │   │   ├── websocket.service.dart
│   │   │   ├── notification.service.dart
│   │   │   ├── offline.service.dart
│   │   │   └── sync.service.dart
│   │   ├── db/
│   │   │   ├── local_database.dart   # Isar 本地存储
│   │   │   └── collections/
│   │   │       ├── task_collection.dart
│   │   │       ├── note_collection.dart
│   │   │       └── pending_op_collection.dart
│   │   └── utils/
│   │       ├── date_utils.dart
│   │       └── permission_utils.dart
│   │
│   ├── android/
│   ├── test/
│   ├── pubspec.yaml
│   └── analysis_options.yaml
│
└── shared/                          # 前后端共享类型定义
    ├── src/
    │   ├── types/
    │   │   ├── enums.ts
    │   │   ├── task.types.ts
    │   │   ├── user.types.ts
    │   │   ├── api.types.ts
    │   │   └── ws.types.ts
    │   ├── constants/
    │   │   ├── error-codes.ts
    │   │   └── points-rules.ts
    │   └── validators/
    │       ├── task.schema.ts
    │       └── user.schema.ts
    ├── package.json
    └── tsconfig.json
```

---

## 开发阶段与任务分解

### Phase 1: MVP 核心（第 1-6 周）

> 目标：跑通「注册 → 建家庭 → 创建任务 → 完成任务 → 查看流水」核心链路

#### Sprint 1（第 1-2 周）：基础架构 + 认证

| # | 任务 | 端 | 优先级 | 预估工时 | 依赖 |
|---|------|-----|--------|----------|------|
| 1.1 | 项目初始化：NestJS + Vue3 + Flutter 脚手架搭建 | 全端 | P0 | 4h | — |
| 1.2 | Docker Compose 编排：PostgreSQL + Redis + API + Web |  infra | P0 | 3h | 1.1 |
| 1.3 | 数据库 Migration 框架搭建（TypeORM migrations） | Server | P0 | 2h | 1.1 |
| 1.4 | Family 实体 + 模块 CRUD | Server | P0 | 4h | 1.3 |
| 1.5 | User 实体 + 角色枚举（parent/child） | Server | P0 | 3h | 1.4 |
| 1.6 | JWT 认证：注册/登录/Token刷新 | Server | P0 | 6h | 1.5 |
| 1.7 | CASL 权限框架集成 + 角色策略定义 | Server | P0 | 4h | 1.6 |
| 1.8 | 家庭邀请码：生成/加入/过期管理 | Server | P0 | 4h | 1.4 |
| 1.9 | 孩子账号：PIN码创建与登录 | Server | P0 | 3h | 1.6, 1.8 |
| 1.10 | Web 端：登录/注册页面 | Web | P0 | 6h | 1.6 |
| 1.11 | Web 端：加入家庭页面 | Web | P0 | 3h | 1.8, 1.10 |
| 1.12 | Web 端：路由守卫 + 权限中间件 | Web | P0 | 3h | 1.7, 1.10 |
| 1.13 | Flutter 端：登录/注册页面（Android） | Mobile | P0 | 8h | 1.6 |
| 1.14 | Flutter 端：PIN码登录页面 | Mobile | P0 | 4h | 1.9, 1.13 |
| 1.15 | 单元测试：认证模块全覆盖 | Server | P0 | 4h | 1.6-1.9 |

**Sprint 1 交付物**：用户可注册、创建/加入家庭、孩子PIN登录、三端鉴权跑通

#### Sprint 2（第 3-4 周）：任务核心

| # | 任务 | 端 | 优先级 | 预估工时 | 依赖 |
|---|------|-----|--------|----------|------|
| 2.1 | Task 实体 + TypeORM Repository | Server | P0 | 4h | 1.5 |
| 2.2 | Tag 实体 + 预置标签种子数据 | Server | P0 | 2h | 1.4 |
| 2.3 | Task CRUD API（创建/读取/更新/软删除） | Server | P0 | 8h | 2.1, 2.2 |
| 2.4 | 任务状态机实现（含合法转换校验） | Server | P0 | 4h | 2.3 |
| 2.5 | AuditLog 实体 + 不可变触发器 + 自动记录拦截器 | Server | P0 | 6h | 2.3 |
| 2.6 | TaskNote 实体 + CRUD API | Server | P0 | 4h | 2.3 |
| 2.7 | 标题相似度检测 | Server | P1 | 3h | 2.3 |
| 2.8 | 审批模式（approval_mode）逻辑 | Server | P1 | 4h | 2.3, 1.7 |
| 2.9 | WebSocket Gateway：任务变更广播 | Server | P0 | 5h | 2.3 |
| 2.10 | Web 端：今日任务列表页（日视图） | Web | P0 | 8h | 2.3, 2.9 |
| 2.11 | Web 端：任务卡片组件（状态切换/拖拽/创建人标识） | Web | P0 | 6h | 2.10 |
| 2.12 | Web 端：创建/编辑任务表单 | Web | P0 | 6h | 2.10 |
| 2.13 | Web 端：任务详情页（含备注时间线） | Web | P0 | 6h | 2.6, 2.10 |
| 2.14 | Web 端：WebSocket 实时同步集成 | Web | P0 | 4h | 2.9, 2.10 |
| 2.15 | Flutter 端：今日任务列表页 | Mobile | P0 | 8h | 2.3, 2.9 |
| 2.16 | Flutter 端：任务卡片（滑动操作/状态切换） | Mobile | P0 | 6h | 2.15 |
| 2.17 | Flutter 端：创建/编辑任务页面 | Mobile | P0 | 6h | 2.15 |
| 2.18 | Flutter 端：任务详情 + 备注页 | Mobile | P0 | 5h | 2.15, 2.16 |
| 2.19 | 集成测试：任务全链路 | Server | P0 | 5h | 2.1-2.9 |

**Sprint 2 交付物**：完整的任务创建/编辑/完成/取消/备注/操作流水，三端实时同步

#### Sprint 3（第 5-6 周）：流水 + 通知 + MVP 收尾

| # | 任务 | 端 | 优先级 | 预估工时 | 依赖 |
|---|------|-----|--------|----------|------|
| 3.1 | 操作流水查询 API（全局/按任务/按人/按日期） | Server | P0 | 4h | 2.5 |
| 3.2 | Web 端：操作流水页面（筛选/分页） | Web | P0 | 5h | 3.1 |
| 3.3 | Flutter 端：操作流水查看（任务维度） | Mobile | P1 | 3h | 3.1 |
| 3.4 | 通知服务基础框架（应用内通知） | Server | P0 | 4h | 2.9 |
| 3.5 | Web 端：通知中心组件 | Web | P0 | 3h | 3.4 |
| 3.6 | Flutter 端：推送通知集成（FCM Android） | Mobile | P0 | 5h | 3.4 |
| 3.7 | 家庭设置页面（Web） | Web | P0 | 4h | 1.8 |
| 3.8 | 成员管理页面（Web） | Web | P0 | 3h | 1.8 |
| 3.9 | 家庭设置页面（Flutter） | Mobile | P1 | 4h | 1.8 |
| 3.10 | 使用时间锁定（防沉迷） | Server+Mobile | P1 | 4h | 1.7 |
| 3.11 | 全局异常处理 + 错误码体系集成 | Server | P0 | 3h | 全模块 |
| 3.12 | MVP 端到端测试 + Bug修复 | 全端 | P0 | 8h | 全模块 |

**Sprint 3 交付物**：MVP 完整可用，含操作流水、通知、家庭管理、防沉迷

---

### Phase 2: 体验增强（第 7-12 周）

#### Sprint 4（第 7-8 周）：积分 + 奖励 + 统计

| # | 任务 | 端 | 优先级 | 预估工时 | 依赖 |
|---|------|-----|--------|----------|------|
| 4.1 | Achievement / CheckInRecord / Badge 实体 | Server | P1 | 4h | 2.4 |
| 4.2 | 积分计算引擎（任务完成/连续打卡/完美日） | Server | P1 | 6h | 4.1 |
| 4.3 | 徽章自动授予逻辑 | Server | P1 | 3h | 4.2 |
| 4.4 | Reward / Redemption 实体 + API | Server | P1 | 5h | 4.2 |
| 4.5 | 重复任务生成器（daily/weekly/weekdays） | Server | P1 | 5h | 2.3 |
| 4.6 | Web 端：积分中心页面 | Web | P1 | 5h | 4.2 |
| 4.7 | Web 端：奖励商城页面 | Web | P1 | 4h | 4.4 |
| 4.8 | Web 端：打卡日历组件 | Web | P1 | 4h | 4.1 |
| 4.9 | Flutter 端：积分/徽章/奖励页面 | Mobile | P1 | 8h | 4.2, 4.4 |
| 4.10 | Stats 统计 API（日/周/趋势） | Server | P1 | 6h | 4.1 |
| 4.11 | Web 端：统计图表页面（ECharts） | Web | P1 | 8h | 4.10 |
| 4.12 | Flutter 端：简要统计概览 | Mobile | P2 | 5h | 4.10 |

#### Sprint 5（第 9-10 周）：高级视图 + 评价 + 离线

| # | 任务 | 端 | 优先级 | 预估工时 | 依赖 |
|---|------|-----|--------|----------|------|
| 5.1 | Web 端：周视图（FullCalendar） | Web | P1 | 6h | 2.10 |
| 5.2 | Web 端：月视图（日历形式） | Web | P2 | 5h | 5.1 |
| 5.3 | DailyReview 实体 + API | Server | P1 | 3h | 1.5 |
| 5.4 | Web 端：每日评价页面 | Web | P1 | 4h | 5.3 |
| 5.5 | Flutter 端：每日评价查看 | Mobile | P2 | 3h | 5.3 |
| 5.6 | 离线存储层（Isar / IndexedDB） | Mobile | P1 | 8h | 2.15 |
| 5.7 | 离线操作队列 + 同步协议 | Mobile+Server | P1 | 10h | 5.6 |
| 5.8 | 冲突检测与解决逻辑 | Server | P1 | 5h | 5.7 |
| 5.9 | ChangeSequence 实体 + 增量同步 API | Server | P1 | 5h | 5.7 |
| 5.10 | 任务提醒定时任务（cron job） | Server | P1 | 4h | 3.4 |
| 5.11 | 超时提醒逻辑 | Server | P2 | 3h | 5.10 |

#### Sprint 6（第 11-12 周）：打磨 + 性能

| # | 任务 | 端 | 优先级 | 预估工时 | 依赖 |
|---|------|-----|--------|----------|------|
| 6.1 | WebSocket 心跳 + 断线重连 + 指数退避 | 全端 | P1 | 5h | 2.9 |
| 6.2 | 家长间 @mention 通知 | Server | P2 | 3h | 2.6 |
| 6.3 | 数据导出功能（JSON/CSV） | Server | P2 | 5h | 全模块 |
| 6.4 | 账户注销 + 数据彻底删除 | Server | P1 | 4h | 全模块 |
| 6.5 | Web 端 UI 打磨（动画/响应式/大字体） | Web | P1 | 8h | 全页面 |
| 6.6 | Flutter 端 UI 打磨（动画/适配） | Mobile | P1 | 8h | 全页面 |
| 6.7 | 性能优化：API P99 < 500ms | Server | P1 | 6h | 全模块 |
| 6.8 | 集成测试 + E2E 测试补全 | 全端 | P1 | 10h | 全模块 |
| 6.9 | Phase 2 验收 + 发布候选 | 全端 | P0 | 4h | 全模块 |

---

### Phase 3: 生态扩展（第 13-16 周）

| # | 任务 | 端 | 优先级 | 预估工时 |
|---|------|-----|--------|----------|
| 7.1 | 多孩子支持 | Server+Web | P2 | 12h |
| 7.2 | 语音备注（上传+播放） | Server+Mobile | P2 | 8h |
| 7.3 | 图片备注 | Server+Mobile+Web | P2 | 6h |
| 7.4 | 学习报告 PDF 导出 | Server | P2 | 8h |
| 7.5 | 家长端使用数据分析（趋势对比） | Web | P2 | 6h |
| 7.6 | 安全审计 + 渗透测试 | infra | P1 | 8h |
| 7.7 | 生产环境部署 + 监控 | infra | P1 | 6h |

---

## 子会话开发分工

基于 KeelBase 团队任务协作，按模块拆分为以下并行开发流：

### 子会话 1：Server 核心（NestJS 后端）

**职责范围**：
- 数据库实体与 Migration
- 认证模块（JWT + CASL）
- 家庭/用户管理
- 任务 CRUD + 状态机
- 备注/标签/流水
- WebSocket Gateway
- 定时任务（提醒/超时/重复）

**技术要点**：
- TypeORM Entity 映射 spec 中的 DDL
- CASL Ability Factory 实现 spec 中的权限矩阵
- Audit Log Interceptor 自动记录所有变更
- WebSocket Gateway 实现 spec 中的消息类型

### 子会话 2：Web 管理端（Vue 3）

**职责范围**：
- 登录/注册/加入家庭
- 今日/周/月视图
- 任务创建/编辑/详情
- 备注时间线
- 操作流水查看
- 统计图表
- 积分/奖励/评价
- 家庭设置

**技术要点**：
- Pinia 状态管理
- Vue Router 路由守卫
- WebSocket 客户端集成
- ECharts 图表
- FullCalendar 日历
- 响应式布局（移动端适配）

### 子会话 3：移动端（Flutter Android）

**职责范围**：
- PIN码/手机号登录
- 今日任务列表（滑动操作）
- 任务创建/编辑/详情
- 备注与通知
- 积分/徽章展示
- 离线存储与同步
- FCM 推送集成

**技术要点**：
- Riverpod 状态管理
- Dio HTTP 客户端
- Isar 本地数据库
- WebSocket 连接管理
- Flutter 滑动/拖拽手势
- Android FCM 集成

---

## 关键里程碑

| 里程碑 | 目标日期 | 验收标准 |
|--------|----------|----------|
| M1: 基础架构就绪 | Week 2 | 三端可登录，家庭可创建/加入 |
| M2: 任务核心可用 | Week 4 | 任务 CRUD + 状态流转 + 备注 + 流水，三端实时同步 |
| M3: MVP 发布 | Week 6 | 完整核心链路可用，含通知和防沉迷 |
| M4: 激励系统上线 | Week 8 | 积分/徽章/奖励/统计/重复任务 |
| M5: 离线+高级视图 | Week 10 | 离线同步、周/月视图、每日评价 |
| M6: Phase 2 发布 | Week 12 | 全功能打磨完成，性能达标 |
| M7: Phase 3 发布 | Week 16 | 多孩子、语音备注、PDF报告、生产部署 |

---

## 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| KeelBase 框架限制 | 某些自定义需求可能需绕路 | 提前 PoC 验证关键功能点 |
| Flutter 离线同步复杂度 | 可能超工时 | Phase 2 初期先做简化版（仅缓存+手动刷新） |
| WebSocket 多端一致性 | 状态不同步 | 引入 change_sequence 作为单一事实源 |
| CASL 权限粒度 | 规则复杂易出错 | 每个权限点写集成测试 |
| 儿童隐私合规审查 | 上线前必须通过 | 从第一天就按合规要求实现 |

---

*计划制定完成。下一步：起子会话，按 Sprint 1 任务开始执行。*

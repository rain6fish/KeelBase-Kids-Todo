# 技术规格说明书（Technical Spec）：儿童每日学习计划管理应用

> 版本：v1.0 | 日期：2026-11-02 | 关联文档：kids-todo-prd.md

---

## 目录

1. [技术架构总览](#1-技术架构总览)
2. [技术栈选型](#2-技术栈选型)
3. [数据库设计](#3-数据库设计)
4. [认证与授权](#4-认证与授权)
5. [API 接口规格](#5-api-接口规格)
6. [WebSocket 实时同步协议](#6-websocket-实时同步协议)
7. [离线同步策略](#7-离线同步策略)
8. [权限矩阵](#8-权限矩阵)
9. [业务规则与状态机](#9-业务规则与状态机)
10. [前端组件规格](#10-前端组件规格)
11. [通知系统](#11-通知系统)
12. [错误码体系](#12-错误码体系)
13. [安全规格](#13-安全规格)
14. [部署架构](#14-部署架构)
15. [测试要求](#15-测试要求)

---

## 1. 技术架构总览

```
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│  iOS / Android  │   │   Web (SPA)  │   │  管理后台     │
│  (Flutter/RN)   │   │  (React/Vue) │   │  (React)     │
└───────┬────────┘   └───────┬──────┘   └──────┬───────┘
        │                    │                  │
        └────────────┬───────┴──────────────────┘
                     │
              ┌──────┴──────┐
              │  API Gateway │  ← Nginx / Kong
              │  (REST+WS)   │
              └──────┬──────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
  ┌─────┴─────┐ ┌───┴───┐ ┌─────┴─────┐
  │ Auth Svc  │ │Task   │ │ Notify    │
  │           │ │Svc    │ │ Svc       │
  └─────┬─────┘ └───┬───┘ └─────┬─────┘
        │            │            │
        └────────────┼────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
  ┌─────┴─────┐ ┌───┴───┐ ┌─────┴─────┐
  │ PostgreSQL │ │ Redis │ │ 消息队列   │
  │ (主库)    │ │(缓存) │ │ (可选)    │
  └───────────┘ └───────┘ └───────────┘
```

### 1.1 架构原则

- **前后端分离**：移动端与 Web 端共用同一套 RESTful API
- **无状态服务**：所有后端服务无状态，Session 通过 JWT 管理
- **事件驱动**：任务变更、通知推送等通过事件总线解耦
- **最终一致性**：离线同步采用"最后写入胜出 + 冲突标记"策略

### 1.2 服务拆分

| 服务 | 职责 | 语言建议 |
|------|------|----------|
| auth-service | 注册/登录/Token管理/家庭邀请 | Go / Node.js |
| task-service | 任务CRUD/状态流转/重复任务生成 | Go / Node.js |
| note-service | 备注/评论管理 | Go / Node.js |
| audit-service | 操作流水记录与查询 | Go / Node.js |
| sync-service | WebSocket实时推送/离线同步协调 | Go / Node.js |
| notify-service | 推送通知/定时提醒/超时检测 | Go / Node.js |
| gamification-service | 积分/打卡/徽章/奖励 | Go / Node.js |
| file-service | 头像/语音备注/图片附件存储 | Go / Node.js |

> **MVP 阶段**：可以合并为单体应用（monolith），按模块划分包结构，后续按需拆分。

---

## 2. 技术栈选型

### 2.1 后端

| 组件 | 选型 | 版本要求 | 说明 |
|------|------|----------|------|
| 语言 | Go 或 Node.js (TypeScript) | Go 1.21+ / Node 20+ | Go 适合高并发；Node 适合快速迭代 |
| 框架 | Go: Gin / Echo；Node: NestJS | 最新稳定版 | 成熟、社区活跃 |
| 数据库 | PostgreSQL | 15+ | 支持 JSONB、全文搜索 |
| 缓存 | Redis | 7+ | Session缓存、在线状态、排行榜 |
| ORM | Go: GORM / Ent；Node: Prisma / TypeORM | — | 类型安全 |
| 认证 | JWT (RS256) + Refresh Token | — | Access Token 15min，Refresh Token 7d |
| WebSocket | gorilla/websocket (Go) / ws (Node) | — | 实时推送 |
| 推送 | FCM (Android) + APNs (iOS) | — | 移动端系统级推送 |
| 对象存储 | MinIO / 阿里云OSS / AWS S3 | — | 头像、语音、图片 |
| 定时任务 | cron (内置) / Bull (Node) | — | 提醒、超时检测、重复任务生成 |

### 2.2 前端

| 组件 | 选型 | 说明 |
|------|------|------|
| Web SPA | React 18+ / Vue 3+ | 组件化开发 |
| 状态管理 | Zustand (React) / Pinia (Vue) | 轻量级 |
| UI 组件库 | Ant Design / Element Plus | 管理后台复用 |
| 移动端 | Flutter 3+ 或 React Native | 跨平台 |
| 图表 | ECharts / Recharts | 统计报表 |
| 日历 | FullCalendar | 月视图/周视图 |
| 拖拽 | dnd-kit (React) / vue-draggable | 任务排序 |
| 离线存储 | IndexedDB (Dexie.js) | 移动端离线 |

### 2.3 基础设施

| 组件 | 选型 | 说明 |
|------|------|------|
| 容器化 | Docker + Docker Compose | 开发/部署一致性 |
| CI/CD | GitHub Actions / GitLab CI | 自动测试+部署 |
| 监控 | Prometheus + Grafana | 服务监控 |
| 日志 | ELK / Loki | 集中日志 |
| CDN | 阿里云CDN / CloudFlare | 静态资源加速 |

---

## 3. 数据库设计

### 3.1 ER 关系总览

```
Family 1──N User
Family 1──N Task
Family 1──N Reward
User  1──N Task (creator)
User  1──N Task (assignee)
User  1──N TaskNote
User  1──N AuditLog
Task  1──N TaskNote
Task  1──N AuditLog
Task  N──N Tag
User  1──N Achievement
Family 1──N DailyReview
```

### 3.2 完整 DDL（PostgreSQL）

```sql
-- ============================================================
-- 启用扩展
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 枚举类型
-- ============================================================
CREATE TYPE user_role AS ENUM ('parent', 'child');
CREATE TYPE parent_label AS ENUM ('parent_a', 'parent_b');
CREATE TYPE task_priority AS ENUM ('high', 'medium', 'low');
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'done', 'cancelled');
CREATE TYPE repeat_rule AS ENUM ('none', 'daily', 'weekly', 'weekdays');
CREATE TYPE audit_action AS ENUM (
    'task_created', 'task_updated', 'task_status_changed',
    'task_deleted', 'task_restored',
    'note_created', 'note_updated', 'note_deleted',
    'reward_created', 'reward_redeemed', 'reward_cancelled',
    'review_created', 'settings_updated'
);

-- ============================================================
-- families 家庭表
-- ============================================================
CREATE TABLE families (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(50) NOT NULL,
    invite_code     VARCHAR(8) NOT NULL UNIQUE,
    approval_mode   BOOLEAN NOT NULL DEFAULT FALSE,  -- 孩子创建任务是否需要家长审批
    use_time_start  TIME,          -- 孩子端可用时间起始（如 '08:00'）
    use_time_end    TIME,          -- 孩子端可用时间结束（如 '21:00'）
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_families_invite_code ON families(invite_code);

-- ============================================================
-- users 用户表
-- ============================================================
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id       UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    role            user_role NOT NULL,
    parent_label    parent_label,          -- 仅家长有值
    phone           VARCHAR(20),           -- 仅家长有值，加密存储
    password_hash   VARCHAR(255),          -- 仅家长有值，bcrypt
    nickname        VARCHAR(30) NOT NULL,
    avatar_url      VARCHAR(500),
    color_tag       VARCHAR(7) NOT NULL DEFAULT '#4A90D9',  -- 头像边框/标识颜色
    fcm_token       VARCHAR(500),          -- 移动端推送token
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_family_parent_label UNIQUE (family_id, parent_label),
    CONSTRAINT uq_family_phone UNIQUE (family_id, phone),
    CONSTRAINT chk_max_2_parents CHECK (
        (SELECT COUNT(*) FROM users u2
         WHERE u2.family_id = users.family_id AND u2.role = 'parent') <= 2
    )
);

CREATE INDEX idx_users_family_id ON users(family_id);
CREATE INDEX idx_users_phone ON users(phone);

-- ============================================================
-- tags 标签表（任务分类）
-- ============================================================
CREATE TABLE tags (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id       UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    name            VARCHAR(20) NOT NULL,
    color           VARCHAR(7) NOT NULL DEFAULT '#999999',
    sort_order      INT NOT NULL DEFAULT 0,
    created_by      UUID NOT NULL REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_family_tag_name UNIQUE (family_id, name)
);

-- 系统预置标签（在创建家庭时自动插入）
-- 语文、数学、英语、阅读、运动、其他

-- ============================================================
-- tasks 任务表
-- ============================================================
CREATE TABLE tasks (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id           UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    creator_id          UUID NOT NULL REFERENCES users(id),
    assignee_id         UUID NOT NULL REFERENCES users(id),  -- 通常是孩子

    title               VARCHAR(200) NOT NULL,
    description         TEXT,
    priority            task_priority NOT NULL DEFAULT 'medium',
    status              task_status NOT NULL DEFAULT 'todo',

    -- 时间相关
    task_date           DATE NOT NULL,               -- 任务所属日期
    planned_start       TIMESTAMPTZ,                  -- 计划开始时间
    planned_end         TIMESTAMPTZ,                  -- 计划结束时间
    estimated_minutes   INT CHECK (estimated_minutes > 0 AND estimated_minutes <= 480),
    actual_start        TIMESTAMPTZ,                  -- 实际开始时间
    actual_end          TIMESTAMPTZ,                  -- 实际完成时间

    -- 重复相关
    repeat_rule         repeat_rule NOT NULL DEFAULT 'none',
    repeat_group_id     UUID,                         -- 同一组重复任务的关联ID
    is_repeat_instance  BOOLEAN NOT NULL DEFAULT FALSE,

    -- 审批相关
    approval_status     VARCHAR(20) DEFAULT 'none',   -- none / pending / approved / rejected
    approved_by         UUID REFERENCES users(id),
    approved_at         TIMESTAMPTZ,

    -- 帮助标记
    help_requested      BOOLEAN NOT NULL DEFAULT FALSE,
    help_request_note   TEXT,

    -- 软删除
    is_deleted          BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at          TIMESTAMPTZ,
    deleted_by          UUID REFERENCES users(id),

    -- 排序
    sort_order          INT NOT NULL DEFAULT 0,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tasks_family_date ON tasks(family_id, task_date);
CREATE INDEX idx_tasks_assignee_date ON tasks(assignee_id, task_date);
CREATE INDEX idx_tasks_status ON tasks(status) WHERE is_deleted = FALSE;
CREATE INDEX idx_tasks_repeat_group ON tasks(repeat_group_id) WHERE repeat_group_id IS NOT NULL;
CREATE INDEX idx_tasks_family_notdeleted ON tasks(family_id, is_deleted);

-- ============================================================
-- task_tags 任务-标签关联表
-- ============================================================
CREATE TABLE task_tags (
    task_id     UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    tag_id      UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, tag_id)
);

-- ============================================================
-- task_notes 任务备注表
-- ============================================================
CREATE TABLE task_notes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id         UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    author_id       UUID NOT NULL REFERENCES users(id),
    content         TEXT NOT NULL,
    content_type    VARCHAR(10) NOT NULL DEFAULT 'text',  -- text / voice / image
    media_url       VARCHAR(500),                          -- 语音/图片附件URL
    mentions        UUID[],                                -- @提到的用户ID列表
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_task_notes_task_id ON task_notes(task_id, created_at DESC);

-- ============================================================
-- audit_logs 操作流水表（不可删除、不可篡改）
-- ============================================================
CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id       UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    operator_id     UUID NOT NULL REFERENCES users(id),
    action          audit_action NOT NULL,

    -- 操作对象
    target_type     VARCHAR(20) NOT NULL,  -- task / note / reward / review / family
    target_id       UUID,

    -- 变更详情（JSONB 格式，灵活存储）
    changes         JSONB NOT NULL DEFAULT '{}',
    -- 示例: {"title": {"old": "做数学", "new": "做数学第三单元"}, "priority": {"old": "medium", "new": "high"}}

    -- 快照（可选，用于记录操作时的完整对象状态）
    snapshot        JSONB,

    ip_address      INET,
    user_agent      VARCHAR(500),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 流水表只允许INSERT，不允许UPDATE和DELETE（通过应用层+数据库触发器保障）
CREATE INDEX idx_audit_family_time ON audit_logs(family_id, created_at DESC);
CREATE INDEX idx_audit_target ON audit_logs(target_type, target_id);
CREATE INDEX idx_audit_operator ON audit_logs(operator_id, created_at DESC);

-- 禁止UPDATE和DELETE的触发器
CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'audit_logs are immutable';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_audit_update
    BEFORE UPDATE ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_modification();

CREATE TRIGGER trg_prevent_audit_delete
    BEFORE DELETE ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_modification();

-- ============================================================
-- achievements 成就/积分表
-- ============================================================
CREATE TABLE achievements (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_points    INT NOT NULL DEFAULT 0,
    current_streak  INT NOT NULL DEFAULT 0,   -- 连续打卡天数
    longest_streak  INT NOT NULL DEFAULT 0,   -- 最长连续打卡天数
    last_active_date DATE,                     -- 最后一次完成任务的日期
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_achievements_user ON achievements(user_id);

-- ============================================================
-- badges 徽章定义表（系统级）
-- ============================================================
CREATE TABLE badge_definitions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(50) NOT NULL,
    description     VARCHAR(200) NOT NULL,
    icon_url        VARCHAR(500),
    badge_type      VARCHAR(30) NOT NULL,     -- streak_7 / streak_30 / streak_100 / points_50 / points_200 / perfect_day
    threshold       INT NOT NULL,             -- 达成阈值
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- user_badges 用户已获徽章
-- ============================================================
CREATE TABLE user_badges (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id        UUID NOT NULL REFERENCES badge_definitions(id),
    earned_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_user_badge UNIQUE (user_id, badge_id)
);

-- ============================================================
-- rewards 奖励池表
-- ============================================================
CREATE TABLE rewards (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id       UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    title           VARCHAR(100) NOT NULL,
    description     TEXT,
    points_cost     INT NOT NULL CHECK (points_cost > 0),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_by      UUID NOT NULL REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rewards_family ON rewards(family_id, is_active);

-- ============================================================
-- reward_redemptions 奖励兑换记录
-- ============================================================
CREATE TABLE reward_redemptions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reward_id       UUID NOT NULL REFERENCES rewards(id),
    user_id         UUID NOT NULL REFERENCES users(id),  -- 兑换的孩子
    redeemed_by     UUID NOT NULL REFERENCES users(id),  -- 操作人（家长确认）
    points_spent    INT NOT NULL,
    is_cancelled    BOOLEAN NOT NULL DEFAULT FALSE,
    cancelled_at    TIMESTAMPTZ,
    cancelled_by    UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_redemptions_user ON reward_redemptions(user_id, created_at DESC);

-- ============================================================
-- daily_reviews 家长每日评价
-- ============================================================
CREATE TABLE daily_reviews (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id       UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    child_id        UUID NOT NULL REFERENCES users(id),
    reviewer_id     UUID NOT NULL REFERENCES users(id),  -- 哪个家长写的
    review_date     DATE NOT NULL,
    content         TEXT NOT NULL,
    rating          SMALLINT CHECK (rating >= 1 AND rating <= 5),  -- 1-5星
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_daily_review UNIQUE (child_id, review_date, reviewer_id)
);

CREATE INDEX idx_reviews_child_date ON daily_reviews(child_id, review_date DESC);

-- ============================================================
-- check_in_records 打卡记录表
-- ============================================================
CREATE TABLE check_in_records (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    check_date  DATE NOT NULL,
    total_tasks INT NOT NULL DEFAULT 0,
    done_tasks  INT NOT NULL DEFAULT 0,
    is_perfect  BOOLEAN NOT NULL DEFAULT FALSE,  -- 全部完成
    points_earned INT NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_checkin_user_date UNIQUE (user_id, check_date)
);

CREATE INDEX idx_checkin_user ON check_in_records(user_id, check_date DESC);

-- ============================================================
-- device_sync 设备同步状态表
-- ============================================================
CREATE TABLE device_sync (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id       VARCHAR(100) NOT NULL,
    device_name     VARCHAR(50),
    platform        VARCHAR(20) NOT NULL,  -- ios / android / web
    last_sync_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_sync_seq   BIGINT NOT NULL DEFAULT 0,  -- 最后同步的变更序号
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_device_user UNIQUE (user_id, device_id)
);

-- ============================================================
-- change_sequence 全局变更序列表（用于增量同步）
-- ============================================================
CREATE TABLE change_sequence (
    id          BIGSERIAL PRIMARY KEY,
    entity_type VARCHAR(20) NOT NULL,  -- task / note / achievement / reward
    entity_id   UUID NOT NULL,
    action      VARCHAR(10) NOT NULL,  -- insert / update / delete
    payload     JSONB NOT NULL,
    family_id   UUID NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_change_seq_family ON change_sequence(family_id, id);
CREATE INDEX idx_change_seq_entity ON change_sequence(entity_type, entity_id);
```

### 3.3 预置数据

```sql
-- 徽章定义
INSERT INTO badge_definitions (name, description, badge_type, threshold) VALUES
    ('初出茅庐', '连续打卡 3 天', 'streak_3', 3),
    ('一周坚持', '连续打卡 7 天', 'streak_7', 7),
    ('月度之星', '连续打卡 30 天', 'streak_30', 30),
    ('百日达人', '连续打卡 100 天', 'streak_100', 100),
    ('积分新手', '累计获得 50 积分', 'points_50', 50),
    ('积分高手', '累计获得 200 积分', 'points_200', 200),
    ('积分大师', '累计获得 500 积分', 'points_500', 500),
    ('完美一天', '某天全部任务完成', 'perfect_day', 1),
    ('完美一周', '连续7天全部完成', 'perfect_week', 7);

-- 预置标签模板（创建家庭时复制插入）
-- 语文(#E74C3C) 数学(#3498DB) 英语(#2ECC71) 阅读(#9B59B6) 运动(#F39C12) 其他(#95A5A6)
```

---

## 4. 认证与授权

### 4.1 认证流程

```
┌────────┐                    ┌──────────┐                  ┌──────────┐
│ Client │                    │ Auth Svc │                  │   Redis  │
└───┬────┘                    └────┬─────┘                  └────┬─────┘
    │  1. POST /auth/login         │                              │
    │  {phone, password}           │                              │
    │─────────────────────────────>│                              │
    │                              │  2. 验证手机号+密码           │
    │                              │  3. 生成 JWT pair             │
    │                              │─────> Store refresh_token ──>│
    │  4. {access_token,           │                              │
    │     refresh_token,           │                              │
    │     user{role,family_id}}    │                              │
    │<─────────────────────────────│                              │
    │                              │                              │
    │  5. 请求API                  │                              │
    │  Header: Bearer <access_jwt> │                              │
    │─────────────────────────────>│                              │
    │                              │  6. 验证JWT签名+过期          │
    │                              │  7. 提取user_id, role,       │
    │                              │     family_id                │
    │  8. Response                 │                              │
    │<─────────────────────────────│                              │
    │                              │                              │
    │  9. access_token过期         │                              │
    │  POST /auth/refresh          │                              │
    │  {refresh_token}             │                              │
    │─────────────────────────────>│                              │
    │                              │  10. 验证refresh_token       │
    │                              │─────> Check in Redis ──────>│
    │  11. 新的 JWT pair           │                              │
    │<─────────────────────────────│                              │
```

### 4.2 JWT 规格

**Access Token Payload:**
```json
{
    "sub": "user-uuid",
    "family_id": "family-uuid",
    "role": "parent | child",
    "parent_label": "parent_a | parent_b | null",
    "nickname": "爸爸",
    "iat": 1698900000,
    "exp": 1698900900
}
```

- 签名算法：RS256（RSA 2048-bit）
- Access Token 有效期：15 分钟
- Refresh Token 有效期：7 天
- Refresh Token 轮换策略：每次刷新后旧 token 立即失效

### 4.3 孩子登录方案

孩子不需要手机号，采用以下方式之一：

**方案A（推荐）：PIN码登录**
- 家长创建孩子账号时设置 4-6 位 PIN 码
- 孩子通过选择头像 + 输入 PIN 码登录
- Token 体系与家长相同

**方案B：扫码登录**
- 家长端展示二维码（含临时 token）
- 孩子端扫码完成登录
- 适合平板等共享设备场景

### 4.4 家庭邀请流程

```
1. 家长A注册 → 自动创建家庭 → 生成6位邀请码（如 A3K9M2）
2. 家长B下载App → 选择"加入家庭" → 输入邀请码 → 绑定为家长B
3. 孩子加入：
   - 家长在设置中点击"添加孩子"
   - 设置孩子昵称、头像、PIN码
   - 孩子用自己的PIN码登录
4. 邀请码有效期：7天，可重新生成
5. 每个家庭最多：2家长 + 1孩子（v1.0限制）
```

### 4.5 接口鉴权中间件伪代码

```typescript
// 通用鉴权中间件
async function authMiddleware(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ code: 'AUTH_REQUIRED' });

    try {
        const payload = verifyJWT(token);
        req.user = await getUser(payload.sub);
        req.family_id = payload.family_id;
        req.role = payload.role;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ code: 'TOKEN_EXPIRED' });
        }
        return res.status(401).json({ code: 'INVALID_TOKEN' });
    }
}

// 角色检查中间件
function requireRole(...roles) {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ code: 'FORBIDDEN' });
        }
        next();
    };
}

// 家庭成员校验中间件
function requireFamilyMember(req, res, next) {
    const targetFamilyId = req.params.family_id || req.body.family_id;
    if (targetFamilyId && targetFamilyId !== req.family_id) {
        return res.status(403).json({ code: 'CROSS_FAMILY_DENIED' });
    }
    next();
}
```

---

## 5. API 接口规格

### 5.1 通用约定

**Base URL:** `https://api.example.com/v1`

**请求头:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
X-Device-Id: <device-uuid>           // 用于离线同步识别设备
X-Client-Version: 1.0.0
Accept-Language: zh-CN
```

**统一响应格式:**
```json
{
    "code": "OK",
    "message": "success",
    "data": { ... },
    "meta": {
        "page": 1,
        "page_size": 20,
        "total": 100,
        "sync_seq": 12345
    }
}
```

**错误响应格式:**
```json
{
    "code": "TASK_NOT_FOUND",
    "message": "任务不存在或已被删除",
    "details": {
        "task_id": "xxx-xxx"
    }
}
```

**分页参数（Query String）:**
```
?page=1&page_size=20&sort_by=created_at&sort_order=desc
```

### 5.2 认证模块 API

#### POST /auth/register — 家长注册

```
Request:
{
    "phone": "13800138000",
    "password": "Abc12345!",
    "sms_code": "123456",
    "nickname": "爸爸"
}

Response 201:
{
    "code": "OK",
    "data": {
        "user": {
            "id": "uuid",
            "role": "parent",
            "parent_label": "parent_a",
            "nickname": "爸爸",
            "family_id": "uuid"
        },
        "family": {
            "id": "uuid",
            "invite_code": "A3K9M2",
            "name": "我们的小家"
        },
        "access_token": "eyJ...",
        "refresh_token": "eyJ...",
        "expires_in": 900
    }
}
```

#### POST /auth/login — 登录（家长手机号 / 孩子PIN码）

```
Request (家长):
{
    "login_type": "phone",
    "phone": "13800138000",
    "password": "Abc12345!"
}

Request (孩子):
{
    "login_type": "pin",
    "family_id": "uuid",
    "user_id": "uuid",
    "pin": "1234"
}

Response 200:
{
    "code": "OK",
    "data": {
        "user": { "id": "uuid", "role": "parent", ... },
        "access_token": "eyJ...",
        "refresh_token": "eyJ...",
        "expires_in": 900
    }
}
```

#### POST /auth/refresh — 刷新Token

```
Request:
{
    "refresh_token": "eyJ..."
}

Response 200:
{
    "code": "OK",
    "data": {
        "access_token": "eyJ...",
        "refresh_token": "eyJ...",
        "expires_in": 900
    }
}
```

#### POST /auth/sms/send — 发送短信验证码

```
Request:
{
    "phone": "13800138000",
    "scene": "register | login | reset_password"
}

Response 200:
{
    "code": "OK",
    "data": {
        "expire_in": 300
    }
}

限流规则: 同一手机号60秒内只能发1次，每天最多10次
```

#### POST /auth/join-family — 通过邀请码加入家庭

```
Request:
{
    "invite_code": "A3K9M2",
    "role": "parent",
    "nickname": "妈妈",
    "phone": "13900139000",
    "password": "Xyz67890!"
}

Response 200:
{
    "code": "OK",
    "data": {
        "user": { "id": "uuid", "role": "parent", "parent_label": "parent_b", ... },
        "family": { "id": "uuid", "name": "我们的小家", ... },
        "access_token": "eyJ...",
        "refresh_token": "eyJ...",
        "expires_in": 900
    }
}

错误码:
- INVITE_CODE_INVALID: 邀请码无效
- INVITE_CODE_EXPIRED: 邀请码已过期
- FAMILY_FULL: 家庭已满（2家长+1孩子）
- PARENT_SLOT_TAKEN: 该家长位置已被占用
```

#### POST /auth/child/add — 家长添加孩子

```
Request:
{
    "nickname": "小明",
    "avatar_url": "https://...",
    "pin": "1234",
    "color_tag": "#E74C3C"
}

Response 201:
{
    "code": "OK",
    "data": {
        "child": {
            "id": "uuid",
            "role": "child",
            "nickname": "小明",
            "family_id": "uuid"
        }
    }
}

权限: 仅 parent
```

### 5.3 任务模块 API

#### GET /tasks — 获取任务列表

```
Query Parameters:
- date: string (YYYY-MM-DD)          // 必填，任务日期
- assignee_id?: uuid                  // 可选，筛选特定孩子
- status?: todo|in_progress|done|cancelled  // 可选
- priority?: high|medium|low          // 可选
- tag_id?: uuid                       // 可选
- include_deleted?: boolean           // 默认 false

Response 200:
{
    "code": "OK",
    "data": {
        "tasks": [
            {
                "id": "uuid",
                "title": "完成数学练习册第3单元",
                "description": null,
                "priority": "high",
                "status": "in_progress",
                "task_date": "2026-11-02",
                "planned_start": "2026-11-02T16:00:00+08:00",
                "planned_end": "2026-11-02T17:00:00+08:00",
                "estimated_minutes": 60,
                "actual_start": "2026-11-02T16:05:00+08:00",
                "actual_end": null,
                "repeat_rule": "none",
                "approval_status": "none",
                "help_requested": false,
                "sort_order": 1,
                "creator": {
                    "id": "uuid",
                    "nickname": "爸爸",
                    "role": "parent",
                    "color_tag": "#4A90D9"
                },
                "assignee": {
                    "id": "uuid",
                    "nickname": "小明",
                    "role": "child",
                    "color_tag": "#E74C3C"
                },
                "tags": [
                    { "id": "uuid", "name": "数学", "color": "#3498DB" }
                ],
                "note_count": 2,
                "created_at": "2026-11-02T08:00:00+08:00",
                "updated_at": "2026-11-02T16:05:00+08:00"
            }
        ],
        "summary": {
            "total": 8,
            "done": 3,
            "in_progress": 2,
            "todo": 2,
            "cancelled": 1
        }
    }
}

权限: 家庭成员均可访问
```

#### POST /tasks — 创建任务

```
Request:
{
    "title": "完成数学练习册第3单元",          // 必填, 1-200字
    "description": "注意第三单元的应用题",     // 可选
    "priority": "high",                       // 可选, 默认 medium
    "task_date": "2026-11-02",                // 必填
    "planned_start": "2026-11-02T16:00:00+08:00",  // 可选
    "planned_end": "2026-11-02T17:00:00+08:00",    // 可选
    "estimated_minutes": 60,                  // 可选, 1-480
    "assignee_id": "uuid",                    // 可选, 默认家庭中的孩子
    "tag_ids": ["uuid1", "uuid2"],            // 可选
    "repeat_rule": "daily"                    // 可选, 默认 none
}

Response 201:
{
    "code": "OK",
    "data": {
        "task": { ... }
    }
}

业务规则:
- 孩子创建时，若家庭开启 approval_mode → approval_status = "pending"
- 重复任务为 daily/weekly 时，自动生成未来7天的任务实例（repeat_group_id 相同）
- 标题相似度检测：与当天已有任务标题做模糊匹配，若相似度>80%返回提示
  { "code": "OK", "data": { "task": {...}, "warning": "similar_task", "similar_task": {...} } }

权限: 家庭成员均可创建
```

#### GET /tasks/:id — 获取任务详情

```
Response 200:
{
    "code": "OK",
    "data": {
        "task": { ... },
        "notes": [
            {
                "id": "uuid",
                "content": "这道题注意单位换算",
                "content_type": "text",
                "author": { "id": "uuid", "nickname": "妈妈", "color_tag": "#2ECC71" },
                "created_at": "2026-11-02T15:30:00+08:00"
            }
        ],
        "audit_history": [
            {
                "id": "uuid",
                "operator": { "id": "uuid", "nickname": "爸爸", "color_tag": "#4A90D9" },
                "action": "task_created",
                "changes": {},
                "created_at": "2026-11-02T08:00:00+08:00"
            },
            {
                "id": "uuid",
                "operator": { "id": "uuid", "nickname": "小明", "color_tag": "#E74C3C" },
                "action": "task_status_changed",
                "changes": { "status": { "old": "todo", "new": "in_progress" } },
                "created_at": "2026-11-02T16:05:00+08:00"
            }
        ]
    }
}

权限: 家庭成员均可访问
```

#### PATCH /tasks/:id — 更新任务

```
Request (部分更新，只传需要修改的字段):
{
    "title": "完成数学练习册第3-4单元",
    "priority": "medium",
    "status": "done",
    "planned_start": "2026-11-02T16:00:00+08:00",
    "planned_end": "2026-11-02T17:30:00+08:00",
    "estimated_minutes": 90,
    "tag_ids": ["uuid1"],
    "sort_order": 2,
    "help_requested": true,
    "help_request_note": "应用题不太会做"
}

Response 200:
{
    "code": "OK",
    "data": {
        "task": { ... }
    }
}

业务规则:
- 状态变更为 "done" 时:
  - 记录 actual_end = NOW()
  - 触发积分计算（按 priority 加分）
  - 触发打卡记录更新
  - 触发 WebSocket 通知家长
- 状态变更为 "in_progress" 时:
  - 记录 actual_start = NOW()（如果还没有）
- 状态变更为 "cancelled" 时:
  - 必须提供 cancelled_reason（可选字段，但建议填写）
- 每次字段变更都写入 audit_logs
- 记录 changes 格式: { "field_name": { "old": old_value, "new": new_value } }

权限:
- 孩子: 只能改自己的任务，且不能改 priority 为 high
- 家长: 可以改任何任务
- 只有创建者可以修改 title 和 description（家长例外）
```

#### DELETE /tasks/:id — 删除任务（软删除）

```
Response 200:
{
    "code": "OK",
    "data": {
        "task_id": "uuid",
        "deleted_at": "2026-11-02T18:00:00+08:00"
    }
}

业务规则:
- 软删除: is_deleted = TRUE, deleted_at = NOW(), deleted_by = 当前用户
- 写入 audit_log: action = "task_deleted"
- 如果是重复任务组的一个实例，询问是否删除整组
  - 删除整组: WHERE repeat_group_id = ? AND is_deleted = FALSE → 全部软删除
  - 仅删除此实例: 只软删除当前记录

权限:
- 孩子: 只能删除自己创建的任务
- 家长: 可以删除任何任务
```

#### POST /tasks/:id/restore — 恢复已删除任务

```
Response 200:
{
    "code": "OK",
    "data": { "task": { ... } }
}

权限: 仅家长
```

#### POST /tasks/:id/approve — 审批孩子创建的任务

```
Request:
{
    "approved": true
}

Response 200:
{
    "code": "OK",
    "data": {
        "task": { ... },
        "approval_status": "approved"
    }
}

业务规则:
- 仅当 approval_status = "pending" 时可操作
- approved=true → approval_status = "approved", approved_by = 当前家长
- approved=false → approval_status = "rejected"
- 审批结果通过 WebSocket 推送给孩子

权限: 仅家长
```

### 5.4 备注模块 API

#### GET /tasks/:id/notes — 获取任务备注列表

```
Query Parameters:
- page?: int (默认 1)
- page_size?: int (默认 20, 最大 50)

Response 200:
{
    "code": "OK",
    "data": {
        "notes": [
            {
                "id": "uuid",
                "content": "注意单位换算",
                "content_type": "text",
                "media_url": null,
                "author": {
                    "id": "uuid",
                    "nickname": "妈妈",
                    "role": "parent",
                    "color_tag": "#2ECC71"
                },
                "mentions": [],
                "created_at": "2026-11-02T15:30:00+08:00",
                "updated_at": "2026-11-02T15:30:00+08:00"
            }
        ]
    },
    "meta": { "page": 1, "page_size": 20, "total": 5 }
}
```

#### POST /tasks/:id/notes — 添加备注

```
Request:
{
    "content": "这道题注意单位换算",       // 必填, 1-2000字
    "content_type": "text",               // 可选, text/voice/image, 默认 text
    "media_url": "https://...",           // content_type != text 时必填
    "mentions": ["user-uuid-1"]           // 可选, @的用户ID列表
}

Response 201:
{
    "code": "OK",
    "data": {
        "note": { ... }
    }
}

业务规则:
- 若 mentions 中有用户，向被@用户推送通知
- 家长添加备注时通知孩子；孩子添加备注时通知所有家长
- 写入 audit_log: action = "note_created"

权限: 家庭成员均可
```

#### PATCH /notes/:id — 编辑备注

```
Request:
{
    "content": "修改后的内容"
}

Response 200:
{
    "code": "OK",
    "data": { "note": { ... } }
}

权限: 仅备注作者本人
```

#### DELETE /notes/:id — 删除备注（软删除）

```
Response 200:
{
    "code": "OK",
    "data": { "note_id": "uuid" }
}

权限:
- 备注作者本人
- 家长可以删除任何备注
```

### 5.5 操作流水 API

#### GET /audit-logs — 查询操作流水

```
Query Parameters:
- start_date?: string (YYYY-MM-DD)
- end_date?: string (YYYY-MM-DD)
- operator_id?: uuid
- target_type?: task|note|reward|review
- target_id?: uuid
- action?: audit_action 枚举值
- page?: int (默认 1)
- page_size?: int (默认 50, 最大 200)

Response 200:
{
    "code": "OK",
    "data": {
        "logs": [
            {
                "id": "uuid",
                "operator": {
                    "id": "uuid",
                    "nickname": "爸爸",
                    "role": "parent",
                    "color_tag": "#4A90D9"
                },
                "action": "task_status_changed",
                "target_type": "task",
                "target_id": "uuid",
                "target_summary": "完成数学练习册第3单元",
                "changes": {
                    "status": { "old": "todo", "new": "done" }
                },
                "created_at": "2026-11-02T17:30:00+08:00"
            }
        ]
    },
    "meta": { "page": 1, "page_size": 50, "total": 328 }
}

权限: 仅家长
```

#### GET /tasks/:id/audit-logs — 查询单个任务的操作历史

```
Response 200:
{
    "code": "OK",
    "data": {
        "logs": [ ... ]
    }
}

权限: 家庭成员均可（孩子可以看，但只能看与自己的任务相关的）
```

### 5.6 标签模块 API

#### GET /tags — 获取家庭标签列表

```
Response 200:
{
    "code": "OK",
    "data": {
        "tags": [
            { "id": "uuid", "name": "数学", "color": "#3498DB", "sort_order": 1, "is_system": true },
            { "id": "uuid", "name": "编程", "color": "#1ABC9C", "sort_order": 7, "is_system": false }
        ]
    }
}
```

#### POST /tags — 创建自定义标签

```
Request:
{
    "name": "编程",
    "color": "#1ABC9C"
}

Response 201:
{
    "code": "OK",
    "data": { "tag": { ... } }
}

权限: 仅家长
```

#### PATCH /tags/:id — 编辑标签

```
Request:
{
    "name": "编程学习",
    "color": "#16A085"
}

权限: 仅家长。系统预置标签不可编辑名称，只可改颜色。
```

#### DELETE /tags/:id — 删除标签

```
权限: 仅家长。系统预置标签不可删除。
删除标签时自动解除与任务的关联（不删除任务）。
```

### 5.7 积分与奖励 API

#### GET /achievements/me — 查看自己的积分/成就

```
Response 200:
{
    "code": "OK",
    "data": {
        "total_points": 156,
        "current_streak": 12,
        "longest_streak": 30,
        "badges": [
            {
                "id": "uuid",
                "name": "一周坚持",
                "description": "连续打卡 7 天",
                "icon_url": "https://...",
                "earned_at": "2026-10-20T00:00:00+08:00"
            }
        ],
        "recent_points": [
            {
                "task_title": "完成数学练习册",
                "points": 3,
                "earned_at": "2026-11-02T17:30:00+08:00"
            }
        ]
    }
}

权限: 孩子查看自己的；家长查看孩子的（通过 query param user_id）
```

#### GET /rewards — 获取奖励池

```
Response 200:
{
    "code": "OK",
    "data": {
        "rewards": [
            {
                "id": "uuid",
                "title": "看电影",
                "description": "周末去看一场电影",
                "points_cost": 50,
                "is_active": true,
                "created_by": { "id": "uuid", "nickname": "妈妈" }
            }
        ]
    }
}
```

#### POST /rewards — 创建奖励（家长）

```
Request:
{
    "title": "买一个新玩具",
    "description": "100元以内的玩具",
    "points_cost": 100
}

权限: 仅家长
```

#### POST /rewards/:id/redeem — 兑换奖励

```
Request:
{
    "user_id": "child-uuid"     // 哪个孩子兑换的
}

Response 200:
{
    "code": "OK",
    "data": {
        "redemption": {
            "id": "uuid",
            "reward_title": "看电影",
            "points_spent": 50,
            "remaining_points": 106,
            "redeemed_at": "2026-11-02T18:00:00+08:00"
        }
    }
}

业务规则:
- 检查积分是否足够
- 扣除积分
- 家长确认后生效（可选，通过 family.approval_mode 控制）

权限: 孩子发起兑换请求，家长确认
```

#### POST /reward-redemptions/:id/cancel — 取消兑换（退回积分）

```
权限: 仅家长
```

### 5.8 统计 API

#### GET /stats/daily — 每日统计

```
Query Parameters:
- date: string (YYYY-MM-DD)
- user_id?: uuid (家长查看特定孩子)

Response 200:
{
    "code": "OK",
    "data": {
        "date": "2026-11-02",
        "total_tasks": 8,
        "done_tasks": 6,
        "cancelled_tasks": 1,
        "completion_rate": 0.75,
        "total_estimated_minutes": 300,
        "total_actual_minutes": 280,
        "points_earned": 15,
        "by_category": [
            { "tag": "数学", "count": 3, "done": 2, "minutes": 120 },
            { "tag": "英语", "count": 2, "done": 2, "minutes": 60 },
            { "tag": "阅读", "count": 2, "done": 1, "minutes": 60 }
        ],
        "by_priority": [
            { "priority": "high", "count": 2, "done": 1 },
            { "priority": "medium", "count": 4, "done": 3 },
            { "priority": "low", "count": 2, "done": 2 }
        ]
    }
}
```

#### GET /stats/weekly — 每周统计

```
Query Parameters:
- start_date: string (YYYY-MM-DD, 周一)
- end_date: string (YYYY-MM-DD, 周日)
- user_id?: uuid

Response 200:
{
    "code": "OK",
    "data": {
        "start_date": "2026-10-27",
        "end_date": "2026-11-02",
        "daily_completion": [
            { "date": "2026-10-27", "rate": 0.8 },
            { "date": "2026-10-28", "rate": 1.0 },
            ...
        ],
        "avg_completion_rate": 0.85,
        "total_points_earned": 98,
        "streak_days": 12,
        "category_distribution": [
            { "tag": "数学", "percentage": 0.35 },
            { "tag": "英语", "percentage": 0.25 },
            ...
        ]
    }
}
```

#### GET /stats/trend — 趋势统计

```
Query Parameters:
- period: week|month
- start_date: string
- end_date: string
- user_id?: uuid

Response 200:
{
    "code": "OK",
    "data": {
        "period": "month",
        "completion_trend": [
            { "label": "第1周", "rate": 0.7 },
            { "label": "第2周", "rate": 0.8 },
            { "label": "第3周", "rate": 0.75 },
            { "label": "第4周", "rate": 0.9 }
        ],
        "points_trend": [
            { "label": "第1周", "points": 20 },
            ...
        ]
    }
}

权限: 家长可查看任意孩子的统计；孩子只能查看自己的
```

### 5.9 每日评价 API

#### POST /daily-reviews — 家长写每日评价

```
Request:
{
    "child_id": "uuid",
    "review_date": "2026-11-02",
    "content": "今天表现很棒，数学进步很大！",
    "rating": 5
}

Response 201:
{
    "code": "OK",
    "data": { "review": { ... } }
}

权限: 仅家长。每个家长每天对每个孩子只能写一条。
```

#### GET /daily-reviews — 获取评价列表

```
Query Parameters:
- child_id: uuid
- start_date?: string
- end_date?: string
- page?: int
- page_size?: int

Response 200:
{
    "code": "OK",
    "data": {
        "reviews": [
            {
                "id": "uuid",
                "review_date": "2026-11-02",
                "content": "今天表现很棒",
                "rating": 5,
                "reviewer": { "id": "uuid", "nickname": "妈妈", "color_tag": "#2ECC71" },
                "created_at": "2026-11-02T20:00:00+08:00"
            }
        ]
    }
}

权限: 家庭成员均可。孩子只能看写给自己的。
```

### 5.10 家庭设置 API

#### GET /family — 获取家庭信息

```
Response 200:
{
    "code": "OK",
    "data": {
        "family": {
            "id": "uuid",
            "name": "我们的小家",
            "invite_code": "A3K9M2",
            "approval_mode": false,
            "use_time_start": "08:00",
            "use_time_end": "21:00",
            "members": [
                { "id": "uuid", "role": "parent", "parent_label": "parent_a", "nickname": "爸爸", "color_tag": "#4A90D9" },
                { "id": "uuid", "role": "parent", "parent_label": "parent_b", "nickname": "妈妈", "color_tag": "#2ECC71" },
                { "id": "uuid", "role": "child", "nickname": "小明", "color_tag": "#E74C3C" }
            ]
        }
    }
}

权限: 家庭成员均可
```

#### PATCH /family — 更新家庭设置

```
Request:
{
    "name": "快乐家庭",
    "approval_mode": true,
    "use_time_start": "08:00",
    "use_time_end": "21:00"
}

权限: 仅家长
```

#### POST /family/regenerate-invite-code — 重新生成邀请码

```
Response 200:
{
    "code": "OK",
    "data": { "invite_code": "X7B2K9" }
}

权限: 仅家长
```

### 5.11 同步 API（离线同步用）

#### GET /sync/changes — 获取增量变更

```
Query Parameters:
- since_seq: int (上次同步的 change_sequence.id)
- device_id: string

Response 200:
{
    "code": "OK",
    "data": {
        "changes": [
            {
                "seq": 12346,
                "entity_type": "task",
                "entity_id": "uuid",
                "action": "update",
                "payload": { "status": "done", "actual_end": "..." },
                "timestamp": "2026-11-02T17:30:00+08:00"
            }
        ],
        "latest_seq": 12350
    }
}

业务规则:
- 返回 since_seq 之后的所有变更
- 如果变更量过大（>500条），分页返回并附带 has_more=true
- 过滤掉当前设备自己产生的变更（避免回环）
```

#### POST /sync/push — 上传离线期间的操作

```
Request:
{
    "device_id": "device-uuid",
    "operations": [
        {
            "op_id": "client-op-uuid",      // 客户端生成的唯一ID，用于去重
            "entity_type": "task",
            "entity_id": "uuid",
            "action": "update",
            "payload": { "status": "done" },
            "client_timestamp": "2026-11-02T17:30:00+08:00",
            "server_entity_version": 5       // 客户端最后已知的版本号
        }
    ]
}

Response 200:
{
    "code": "OK",
    "data": {
        "results": [
            {
                "op_id": "client-op-uuid",
                "status": "applied",         // applied / conflict / rejected
                "server_version": 6,
                "conflict_resolution": null   // 如果有冲突，说明解决方式
            }
        ],
        "latest_seq": 12351
    }
}

冲突处理策略:
1. 如果 server_entity_version == 当前服务端版本 → 直接应用
2. 如果版本不一致 → 标记为 conflict
   - 状态变更类操作：以服务端为准（last-write-wins），但在返回中附带冲突提示
   - 内容编辑类操作：保留客户端版本，标记为冲突，由前端提示用户手动解决
3. 去重：相同 op_id 的操作不会重复应用
```

---

## 6. WebSocket 实时同步协议

### 6.1 连接建立

```
WebSocket URL: wss://ws.example.com/v1/sync?token=<access_token>&device_id=<device-uuid>

连接成功后服务端推送:
{
    "type": "connected",
    "data": {
        "server_time": "2026-11-02T18:00:00+08:00",
        "latest_seq": 12350
    }
}
```

### 6.2 消息类型定义

#### 服务端 → 客户端

```typescript
// 任务变更通知
{
    "type": "task_changed",
    "data": {
        "action": "created" | "updated" | "deleted" | "status_changed",
        "task": { ... },           // 完整的任务对象（最新状态）
        "changed_by": {            // 谁做的变更
            "user_id": "uuid",
            "nickname": "爸爸"
        },
        "changes": { ... },        // 变更详情
        "seq": 12351,
        "timestamp": "2026-11-02T18:01:00+08:00"
    }
}

// 新备注通知
{
    "type": "note_added",
    "data": {
        "task_id": "uuid",
        "note": { ... },
        "author": { ... },
        "timestamp": "..."
    }
}

// 积分变动通知（推送给孩子的所有设备）
{
    "type": "points_changed",
    "data": {
        "total_points": 159,
        "delta": 3,
        "reason": "完成任务: 数学练习册",
        "timestamp": "..."
    }
}

// 新徽章通知
{
    "type": "badge_earned",
    "data": {
        "badge": { "name": "一周坚持", ... },
        "timestamp": "..."
    }
}

// 审批结果通知（推送给孩子）
{
    "type": "approval_result",
    "data": {
        "task_id": "uuid",
        "approved": true,
        "reviewed_by": { "nickname": "妈妈" },
        "timestamp": "..."
    }
}

// 帮助请求通知（推送给家长）
{
    "type": "help_requested",
    "data": {
        "task_id": "uuid",
        "task_title": "数学应用题",
        "child_note": "这道题不会做",
        "timestamp": "..."
    }
}

// 心跳
{
    "type": "ping",
    "data": { "server_time": "..." }
}
```

#### 客户端 → 服务端

```typescript
// 订阅特定任务变更
{
    "type": "subscribe",
    "data": {
        "channels": ["task_changes", "notes", "points", "approvals"]
    }
}

// 心跳响应
{
    "type": "pong"
}

// 客户端主动请求同步
{
    "type": "sync_request",
    "data": {
        "last_seq": 12350
    }
}
```

### 6.3 连接管理

```
心跳间隔: 30秒
超时重连: 5秒后第一次重连，指数退避（5s → 10s → 20s → 40s），最大间隔60秒
最大重连次数: 无限（后台状态下暂停，回到前台时重连）
断线期间: 客户端记录断线时间戳，重连后通过 GET /sync/changes?since_seq=xxx 拉取缺失变更
并发连接: 同一用户最多5个WebSocket连接（多设备场景）
```

### 6.4 推送路由规则

| 事件 | 推送给 |
|------|--------|
| 任务创建/修改/删除 | 同家庭所有在线设备 |
| 任务状态变更 | 同家庭所有在线设备 |
| 新备注 | 同家庭所有在线设备 |
| 积分变动 | 孩子的所有在线设备 |
| 审批结果 | 孩子的所有在线设备 |
| 帮助请求 | 家长的所有在线设备 |
| 每日评价 | 孩子的所有在线设备 |

---

## 7. 离线同步策略

### 7.1 离线数据存储

```
存储位置: 移动端 IndexedDB (通过 Dexie.js 封装)
存储内容:
- tasks: 任务全量数据
- tags: 标签数据
- achievements: 积分/徽章
- daily_reviews: 每日评价
- pending_operations: 待同步的操作队列（FIFO）
- last_sync_seq: 上次成功同步的变更序号
- last_sync_time: 上次同步时间
```

### 7.2 离线可用操作

| 操作 | 离线支持 | 说明 |
|------|----------|------|
| 查看任务列表 | ✅ | 使用本地缓存 |
| 查看任务详情 | ✅ | 使用本地缓存 |
| 创建任务 | ✅ | 存入本地+加入待同步队列 |
| 修改任务状态 | ✅ | 存入本地+加入待同步队列 |
| 编辑任务 | ✅ | 存入本地+加入待同步队列 |
| 添加备注 | ✅ | 存入本地+加入待同步队列 |
| 删除任务 | ✅ | 存入本地+加入待同步队列 |
| 查看统计 | ❌ | 需要服务端计算 |
| 查看操作流水 | ⚠️ | 仅本地缓存的部分 |
| 兑换奖励 | ❌ | 需要服务端校验积分 |

### 7.3 同步流程

```
网络恢复时:

1. 客户端检测网络状态变化
2. 等待 2秒 确认网络稳定
3. 发送 POST /sync/push（上传离线操作）
4. 服务端处理每个操作:
   a. 检查 op_id 是否已处理（去重）
   b. 检查版本冲突
   c. 应用或标记冲突
   d. 写入 change_sequence
5. 客户端处理响应:
   a. applied → 从 pending_operations 移除
   b. conflict → 标记本地记录，等待用户处理
   c. rejected → 从 pending_operations 移除，通知用户
6. 发送 GET /sync/changes?since_seq=last_sync_seq（拉取其他设备的变更）
7. 合并到本地数据库
8. 更新 last_sync_seq 和 last_sync_time
```

### 7.4 冲突解决策略

```
场景1: 同一任务被两个设备同时修改
- 字段级合并: 不同字段的修改可以合并
- 同字段冲突: 以时间戳较新的为准（last-write-wins）
- 状态变更冲突: 以服务端为准

场景2: 任务在一端被删除，另一端被修改
- 删除优先: 任务已被删除，修改操作被丢弃
- 通知用户: "该任务已被其他设备删除"

场景3: 两个设备同时创建任务
- 不冲突: 两个任务都保留，各自有独立的 ID
```

---

## 8. 权限矩阵

### 8.1 任务操作权限

| 操作 | 孩子（自己的任务） | 孩子（别人的任务） | 家长 |
|------|:---:|:---:|:---:|
| 查看任务列表 | ✅ | ✅ | ✅ |
| 创建任务 | ✅* | — | ✅ |
| 编辑标题/描述 | ✅ | ❌ | ✅ |
| 修改状态 | ✅ | ❌ | ✅ |
| 修改优先级 | ✅ (不能设为high) | ❌ | ✅ |
| 修改时间 | ✅ | ❌ | ✅ |
| 修改标签 | ✅ | ❌ | ✅ |
| 删除任务 | ✅ | ❌ | ✅ |
| 恢复已删任务 | ❌ | ❌ | ✅ |
| 审批任务 | ❌ | ❌ | ✅ |
| 标记"需要帮助" | ✅ | ❌ | ✅ |

*注：孩子创建任务时，若家庭开启 approval_mode，任务状态为 pending，需家长审批后才正式生效。

### 8.2 备注操作权限

| 操作 | 孩子 | 家长 |
|------|:---:|:---:|
| 查看备注 | ✅ (自己任务的) | ✅ |
| 添加备注 | ✅ | ✅ |
| 编辑自己的备注 | ✅ | ✅ |
| 删除自己的备注 | ✅ | ✅ |
| 删除他人的备注 | ❌ | ✅ |

### 8.3 操作流水权限

| 操作 | 孩子 | 家长 |
|------|:---:|:---:|
| 查看自己任务的流水 | ✅ | ✅ |
| 查看全局流水 | ❌ | ✅ |
| 按人筛选 | ❌ | ✅ |
| 导出流水 | ❌ | ✅ |

### 8.4 积分与奖励权限

| 操作 | 孩子 | 家长 |
|------|:---:|:---:|
| 查看自己的积分 | ✅ | — |
| 查看孩子的积分 | — | ✅ |
| 获取积分（完成任务） | ✅ | — |
| 创建奖励 | ❌ | ✅ |
| 编辑/删除奖励 | ❌ | ✅ |
| 发起兑换 | ✅ | — |
| 确认/取消兑换 | ❌ | ✅ |

### 8.5 统计与评价权限

| 操作 | 孩子 | 家长 |
|------|:---:|:---:|
| 查看自己的统计 | ✅ | — |
| 查看孩子的统计 | — | ✅ |
| 写每日评价 | ❌ | ✅ |
| 查看每日评价 | ✅ (写给自己的) | ✅ |

### 8.6 家庭设置权限

| 操作 | 孩子 | 家长 |
|------|:---:|:---:|
| 查看家庭信息 | ✅ | ✅ |
| 修改家庭名称 | ❌ | ✅ |
| 修改邀请码 | ❌ | ✅ |
| 修改审批模式 | ❌ | ✅ |
| 修改使用时间 | ❌ | ✅ |
| 添加/移除成员 | ❌ | ✅ |

---

## 9. 业务规则与状态机

### 9.1 任务状态机

```
                    ┌──────────────────────────────┐
                    │                              │
                    ▼                              │
              ┌──────────┐    开始执行     ┌───────────────┐
  创建任务 ──>│   todo   │──────────────>│  in_progress  │
              └──────────┘                └───────┬───────┘
                    │                             │
                    │ 取消                        │ 完成
                    ▼                             ▼
              ┌──────────┐                  ┌──────────┐
              │cancelled │                  │   done   │
              └──────────┘                  └──────────┘
                    │                             │
                    │ 恢复（仅家长）               │ 重开（仅家长）
                    └─────────────────────────────┘

合法状态转换:
- todo → in_progress    (孩子/家长)
- todo → cancelled      (孩子/家长)
- in_progress → done    (孩子/家长)
- in_progress → cancelled (孩子/家长)
- cancelled → todo      (仅家长，恢复任务)
- done → todo           (仅家长，重开任务)
- done → in_progress    (仅家长)

非法转换:
- cancelled → in_progress (必须先恢复为todo)
- done → cancelled      (已完成的不能取消)
```

### 9.2 积分计算规则

```typescript
const POINTS_RULES = {
    // 完成任务基础积分
    complete: {
        high: 3,
        medium: 2,
        low: 1
    },
    // 连续打卡奖励
    streak_bonus: {
        3: 5,     // 连续3天全部完成，额外+5
        7: 20,    // 连续7天，额外+20
        30: 100,  // 连续30天，额外+100
        100: 500  // 连续100天，额外+500
    },
    // 完美日奖励（当天所有任务完成）
    perfect_day: 5,
    // 提前完成奖励（实际时间 < 预计时间的80%）
    early_complete_bonus: 1,
    // 帮助标记不扣分，但家长备注后额外+1
    help_resolved_bonus: 1
};

// 积分计算触发时机
function onTaskCompleted(task, user) {
    // 1. 基础积分
    let points = POINTS_RULES.complete[task.priority];

    // 2. 提前完成奖励
    if (task.actual_start && task.actual_end && task.estimated_minutes) {
        const actualMinutes = (task.actual_end - task.actual_start) / 60000;
        if (actualMinutes < task.estimated_minutes * 0.8) {
            points += POINTS_RULES.early_complete_bonus;
        }
    }

    // 3. 更新积分
    await addPoints(user.id, points);

    // 4. 检查打卡
    await updateCheckIn(user.id, task.task_date);

    // 5. 检查徽章
    await checkAndAwardBadges(user.id);

    // 6. 推送通知
    await notifyPointsChanged(user.id, points, task.title);
}
```

### 9.3 打卡与连续天数计算

```typescript
async function updateCheckIn(userId: string, date: Date) {
    const today = formatDate(date);

    // 获取或创建今日打卡记录
    let record = await getCheckInRecord(userId, today);
    if (!record) {
        record = await createCheckInRecord(userId, today);
    }

    // 更新完成数
    const tasks = await getTasksByDate(userId, today);
    record.total_tasks = tasks.length;
    record.done_tasks = tasks.filter(t => t.status === 'done').length;
    record.is_perfect = record.total_tasks > 0 && record.total_tasks === record.done_tasks;

    // 计算积分
    const points = calculateDayPoints(tasks);
    record.points_earned = points;

    await saveCheckInRecord(record);

    // 更新连续打卡天数
    const achievement = await getAchievement(userId);
    const yesterday = addDays(today, -1);
    const yesterdayRecord = await getCheckInRecord(userId, yesterday);

    if (yesterdayRecord && yesterdayRecord.is_perfect) {
        achievement.current_streak += 1;
    } else {
        achievement.current_streak = record.is_perfect ? 1 : 0;
    }

    achievement.longest_streak = Math.max(achievement.longest_streak, achievement.current_streak);
    achievement.last_active_date = today;

    await saveAchievement(achievement);
}
```

### 9.4 重复任务生成规则

```typescript
async function generateRepeatInstances(task: Task) {
    if (task.repeat_rule === 'none') return;

    const instances: Partial<Task>[] = [];
    const startDate = addDays(task.task_date, 1);
    const endDate = addDays(task.task_date, 30); // 预生成30天

    let current = startDate;
    while (current <= endDate) {
        if (task.repeat_rule === 'daily') {
            instances.push(createInstance(task, current));
        } else if (task.repeat_rule === 'weekdays') {
            if (isWeekday(current)) {
                instances.push(createInstance(task, current));
            }
        } else if (task.repeat_rule === 'weekly') {
            if (current.getDay() === task.task_date.getDay()) {
                instances.push(createInstance(task, current));
            }
        }
        current = addDays(current, 1);
    }

    await bulkInsertTasks(instances);
}

function createInstance(source: Task, date: Date): Partial<Task> {
    return {
        family_id: source.family_id,
        creator_id: source.creator_id,
        assignee_id: source.assignee_id,
        title: source.title,
        description: source.description,
        priority: source.priority,
        status: 'todo',
        task_date: date,
        planned_start: source.planned_start ? setTime(date, source.planned_start) : null,
        planned_end: source.planned_end ? setTime(date, source.planned_end) : null,
        estimated_minutes: source.estimated_minutes,
        repeat_rule: source.repeat_rule,
        repeat_group_id: source.repeat_group_id || source.id,
        is_repeat_instance: true,
        sort_order: source.sort_order
    };
}
```

### 9.5 审批流程

```
家庭设置 approval_mode = true 时:

1. 孩子创建任务 → task.approval_status = "pending"
2. WebSocket 通知家长: { type: "approval_needed", task: {...} }
3. 家长审批:
   - 通过 → approval_status = "approved", 任务对孩子可见
   - 拒绝 → approval_status = "rejected", 通知孩子并附原因
4. 审批超时（24小时未处理）→ 自动通过 + 通知家长已自动通过

家庭设置 approval_mode = false 时:
- 孩子创建的任务直接生效，approval_status = "none"
```

### 9.6 标题相似度检测

```typescript
async function checkSimilarTitle(familyId: string, title: string, taskDate: Date) {
    const existingTasks = await getTasksByDate(familyId, taskDate);

    for (const task of existingTasks) {
        const similarity = calculateSimilarity(title, task.title);
        if (similarity > 0.8) {
            return {
                is_similar: true,
                similar_task: {
                    id: task.id,
                    title: task.title,
                    creator: task.creator
                },
                similarity: similarity
            };
        }
    }
    return { is_similar: false };
}

// 使用编辑距离算法计算相似度
function calculateSimilarity(a: string, b: string): number {
    const distance = levenshteinDistance(a.toLowerCase(), b.toLowerCase());
    const maxLen = Math.max(a.length, b.length);
    return maxLen === 0 ? 1 : 1 - distance / maxLen;
}
```

---

## 10. 前端组件规格

### 10.1 页面清单

| 页面 | 路由 | 端 | 角色 | 说明 |
|------|------|-----|------|------|
| 登录页 | /login | 全端 | 公开 | 手机号+密码 / PIN码 |
| 注册页 | /register | 移动端 | 公开 | 家长注册 |
| 加入家庭 | /join | 全端 | 公开 | 输入邀请码 |
| 今日任务 | /today | 全端 | 全部 | 默认首页，日视图 |
| 周视图 | /week | Web | 全部 | 周任务分布 |
| 月视图 | /month | Web | 全部 | 日历形式 |
| 任务详情 | /task/:id | 全端 | 全部 | 含备注+流水 |
| 创建任务 | /task/new | 全端 | 全部 | 表单页 |
| 编辑任务 | /task/:id/edit | 全端 | 全部 | 表单页 |
| 操作流水 | /audit | 全端 | 家长 | 全局流水 |
| 统计概览 | /stats | 全端 | 全部 | 日/周统计 |
| 趋势分析 | /stats/trend | Web | 家长 | 趋势图表 |
| 积分中心 | /achievements | 全端 | 全部 | 积分+徽章 |
| 奖励商城 | /rewards | 全端 | 全部 | 奖励池+兑换 |
| 每日评价 | /review | 全端 | 家长 | 写评价 |
| 家庭设置 | /family/settings | 全端 | 家长 | 家庭管理 |
| 成员管理 | /family/members | 全端 | 家长 | 添加/移除成员 |
| 标签管理 | /family/tags | Web | 家长 | 自定义标签 |
| 通知中心 | /notifications | 全端 | 全部 | 消息列表 |
| 个人设置 | /profile | 全端 | 全部 | 头像/昵称/密码 |

### 10.2 核心组件树

```
App
├── AuthProvider (认证上下文)
├── WebSocketProvider (实时连接)
├── SyncProvider (离线同步)
│
├── Layout
│   ├── Header
│   │   ├── UserAvatar (当前用户)
│   │   ├── FamilySwitcher (多孩子切换, v2)
│   │   ├── NotificationBell
│   │   └── DateNavigator (前后切换日期)
│   │
│   ├── Sidebar (Web端)
│   │   ├── NavMenu
│   │   │   ├── TodayLink
│   │   │   ├── WeekLink
│   │   │   ├── StatsLink
│   │   │   ├── AchievementsLink
│   │   │   └── SettingsLink (家长)
│   │   └── ProgressRing (今日完成进度)
│   │
│   ├── MainContent
│   │   ├── TaskListView
│   │   │   ├── TaskGroupHeader ("上午"/"下午"/"灵活任务")
│   │   │   ├── TaskCard
│   │   │   │   ├── PriorityDot
│   │   │   │   ├── TaskTitle
│   │   │   │   ├── TagChips
│   │   │   │   ├── CreatorBadge (谁创建的)
│   │   │   │   ├── TimeRange
│   │   │   │   ├── StatusButton (拖拽/点击切换)
│   │   │   │   ├── HelpBadge (需要帮助标记)
│   │   │   │   └── NoteCountBadge
│   │   │   └── AddTaskButton
│   │   │
│   │   ├── TaskDetailView
│   │   │   ├── TaskInfoPanel
│   │   │   ├── NotesTimeline
│   │   │   │   ├── NoteBubble
│   │   │   │   │   ├── AuthorAvatar
│   │   │   │   │   ├── NoteContent
│   │   │   │   │   ├── Timestamp
│   │   │   │   │   └── NoteActions (编辑/删除)
│   │   │   │   └── AddNoteInput
│   │   │   ├── AuditTimeline
│   │   │   │   └── AuditEntry
│   │   │   └── TaskActionBar
│   │   │
│   │   ├── CreateTaskForm
│   │   │   ├── TitleInput
│   │   │   ├── DescriptionInput
│   │   │   ├── PrioritySelector
│   │   │   ├── TagSelector
│   │   │   ├── DateTimePickers
│   │   │   ├── DurationInput
│   │   │   ├── RepeatSelector
│   │   │   └── SimilarTaskWarning
│   │   │
│   │   ├── StatsView
│   │   │   ├── CompletionRateChart
│   │   │   ├── CategoryPieChart
│   │   │   ├── TrendLineChart
│   │   │   └── StreakCalendar
│   │   │
│   │   └── AchievementsView
│   │       ├── PointsDisplay
│   │       ├── BadgeGrid
│   │       └── RewardList
│   │
│   └── BottomNav (移动端)
│       ├── TodayTab
│       ├── StatsTab
│       ├── AchievementsTab
│       └── ProfileTab
```

### 10.3 关键交互规格

#### 任务状态切换

```
移动端:
- 左滑任务卡片 → 显示"完成"按钮（绿色）
- 右滑任务卡片 → 显示"取消"按钮（灰色）
- 点击任务卡片 → 进入详情页

Web端:
- 点击状态按钮 → 弹出状态选择下拉
- 拖拽任务到不同列（看板视图可选）
- 快捷键: D=完成, C=取消, I=进行中

动画:
- 状态变更时卡片有轻微缩放动画(0.95→1.0, 200ms)
- 完成时卡片变灰+打勾动画
- 积分增加时数字跳动动画+弹出"+3"气泡
```

#### 创建任务表单

```
交互流程:
1. 点击"+"按钮 → 弹出半屏表单(移动端)/右侧抽屉(Web)
2. 输入标题时，实时检测相似任务（debounce 500ms）
3. 若检测到相似任务 → 标题下方显示橙色提示:
   "今天已有类似任务「xxx」(由爸爸添加)，是否仍要创建？"
4. 选择标签 → 标签 chips 多选
5. 设置时间 → 日期选择器 + 时间段选择器
6. 设置重复 → 下拉选择: 不重复/每天/每周/工作日
7. 提交 → 若 approval_mode 开启且是孩子 → 显示"已提交，等待家长确认"

表单验证:
- title: 必填, 1-200字符
- task_date: 必填, 不能是过去的日期（除非是补录）
- estimated_minutes: 1-480
- planned_end > planned_start (如果都填了)
```

### 10.4 响应式断点

```css
/* 移动端优先 */
:root {
    --breakpoint-sm: 640px;    /* 手机竖屏 */
    --breakpoint-md: 768px;    /* 手机横屏/小平板 */
    --breakpoint-lg: 1024px;   /* 平板/小桌面 */
    --breakpoint-xl: 1280px;   /* 桌面 */
}

/* 布局策略 */
/* < 768px: 单列，底部导航，卡片全宽 */
/* 768-1024px: 双列卡片，侧边导航收起为汉堡菜单 */
/* > 1024px: 侧边栏+主内容区，任务卡片双列或三列 */
```

---

## 11. 通知系统

### 11.1 通知类型与渠道

| 通知类型 | 推送渠道 | 接收者 | 触发条件 |
|----------|----------|--------|----------|
| 任务提醒 | App Push + 应用内 | 孩子 | 任务开始前N分钟 |
| 超时提醒 | App Push + 应用内 | 孩子+家长 | 任务超过预计时间 |
| 新备注 | 应用内 | 任务相关人 | 有人添加备注 |
| 任务完成 | 应用内 + Push | 家长 | 孩子完成任务 |
| 帮助请求 | Push + WebSocket | 家长 | 孩子标记需要帮助 |
| 审批结果 | 应用内 + WebSocket | 孩子 | 家长审批任务 |
| 积分获得 | 应用内 + WebSocket | 孩子 | 完成任务获得积分 |
| 徽章获得 | 应用内 + WebSocket | 孩子 | 达成条件 |
| 新评价 | 应用内 + WebSocket | 孩子 | 家长写每日评价 |
| 家长留言 | Push | 孩子 | @孩子时 |

### 11.2 推送配置

```typescript
interface NotificationPreference {
    user_id: string;
    task_reminder: boolean;       // 默认 true
    task_reminder_minutes: number; // 默认 10
    overtime_alert: boolean;      // 默认 true
    completion_notify_parent: boolean; // 家长端默认 true
    help_request_notify: boolean; // 家长端默认 true
    note_mention_notify: boolean; // 默认 true
    daily_review_notify: boolean; // 孩子端默认 true
    quiet_hours_start: string;    // "22:00"
    quiet_hours_end: string;      // "07:00"
}
```

### 11.3 推送消息格式（FCM/APNs）

```json
{
    "notification": {
        "title": "任务提醒",
        "body": "「完成数学练习册」将在10分钟后开始",
        "sound": "default",
        "badge": 1
    },
    "data": {
        "type": "task_reminder",
        "task_id": "uuid",
        "action": "open_task"
    },
    "android": {
        "priority": "high",
        "notification": {
            "channel_id": "task_reminders",
            "icon": "ic_notification",
            "color": "#4A90D9"
        }
    },
    "apns": {
        "payload": {
            "aps": {
                "category": "TASK_REMINDER",
                "mutable-content": 1
            }
        }
    }
}
```

### 11.4 定时提醒任务调度

```
提醒调度器（服务端 cron job）:

每分钟执行:
1. 查询未来10-11分钟内开始的任务（planned_start）
   WHERE status IN ('todo', 'in_progress')
   AND planned_start BETWEEN NOW()+10min AND NOW()+11min
   AND reminder_sent = FALSE

2. 对每个匹配任务:
   - 标记 reminder_sent = TRUE
   - 向 assignee 的 FCM token 发送推送
   - 通过 WebSocket 发送应用内通知

超时检测器:

每5分钟执行:
1. 查询状态为 in_progress 且已超过 planned_end 的任务
2. 向孩子发送温和提醒
3. 若超过30分钟仍未完成，通知家长
```

---

## 12. 错误码体系

### 12.1 错误码规范

```
格式: MODULE_ERROR_TYPE
示例: TASK_NOT_FOUND, AUTH_INVALID_TOKEN

HTTP 状态码映射:
- 400 Bad Request    → 参数错误
- 401 Unauthorized   → 未登录/token过期
- 403 Forbidden      → 无权限
- 404 Not Found      → 资源不存在
- 409 Conflict       → 数据冲突（同步时）
- 422 Unprocessable  → 业务规则校验失败
- 429 Too Many Req   → 限流
- 500 Internal Error → 服务端异常
```

### 12.2 完整错误码列表

```typescript
const ERROR_CODES = {
    // ===== 认证模块 (AUTH_*) =====
    AUTH_REQUIRED:            { http: 401, message: '请先登录' },
    TOKEN_EXPIRED:            { http: 401, message: '登录已过期，请重新登录' },
    INVALID_TOKEN:            { http: 401, message: '无效的认证令牌' },
    REFRESH_TOKEN_EXPIRED:    { http: 401, message: '刷新令牌已过期，请重新登录' },
    INVALID_PHONE_FORMAT:     { http: 400, message: '手机号格式不正确' },
    PHONE_ALREADY_REGISTERED: { http: 422, message: '该手机号已注册' },
    WRONG_PASSWORD:           { http: 401, message: '密码错误' },
    SMS_CODE_INVALID:         { http: 422, message: '验证码错误或已过期' },
    SMS_CODE_EXPIRED:         { http: 422, message: '验证码已过期' },
    SMS_SEND_TOO_FREQUENT:    { http: 429, message: '发送过于频繁，请稍后再试' },
    PIN_INCORRECT:            { http: 401, message: 'PIN码错误' },
    USER_NOT_FOUND:           { http: 404, message: '用户不存在' },
    ACCOUNT_DISABLED:         { http: 403, message: '账号已被禁用' },

    // ===== 家庭模块 (FAMILY_*) =====
    FAMILY_NOT_FOUND:         { http: 404, message: '家庭不存在' },
    INVITE_CODE_INVALID:      { http: 422, message: '邀请码无效' },
    INVITE_CODE_EXPIRED:      { http: 422, message: '邀请码已过期' },
    FAMILY_FULL:              { http: 422, message: '家庭成员已满' },
    PARENT_SLOT_TAKEN:        { http: 422, message: '该家长位置已被占用' },
    ALREADY_IN_FAMILY:        { http: 422, message: '您已是该家庭成员' },
    CANNOT_REMOVE_SELF:       { http: 422, message: '不能移除自己' },
    ONLY_PARENT_CAN_OPERATE:  { http: 403, message: '仅家长可执行此操作' },
    CHILD_NOT_FOUND:          { http: 404, message: '孩子不存在' },
    OUTSIDE_USE_TIME:         { http: 403, message: '当前不在允许的使用时间内' },

    // ===== 任务模块 (TASK_*) =====
    TASK_NOT_FOUND:           { http: 404, message: '任务不存在或已被删除' },
    TASK_ALREADY_DELETED:     { http: 422, message: '任务已被删除' },
    TASK_TITLE_REQUIRED:      { http: 422, message: '任务标题不能为空' },
    TASK_TITLE_TOO_LONG:      { http: 422, message: '任务标题不能超过200字' },
    TASK_DATE_REQUIRED:       { http: 422, message: '任务日期不能为空' },
    TASK_DATE_INVALID:        { http: 422, message: '任务日期格式不正确' },
    TASK_TIME_INVALID:        { http: 422, message: '结束时间必须晚于开始时间' },
    TASK_DURATION_INVALID:    { http: 422, message: '预计时长须在1-480分钟之间' },
    INVALID_STATUS_TRANSITION:{ http: 422, message: '不允许的状态变更' },
    CANCEL_REASON_REQUIRED:   { http: 422, message: '取消任务需要填写原因' },
    TASK_NOT_PENDING_APPROVAL:{ http: 422, message: '该任务不在待审批状态' },
    CANNOT_EDIT_OTHERS_TASK:  { http: 403, message: '不能编辑他人创建的任务' },
    CANNOT_DELETE_OTHERS_TASK:{ http: 403, message: '不能删除他人创建的任务' },
    SIMILAR_TASK_FOUND:       { http: 200, message: '发现相似任务', is_warning: true },

    // ===== 备注模块 (NOTE_*) =====
    NOTE_NOT_FOUND:           { http: 404, message: '备注不存在' },
    NOTE_CONTENT_REQUIRED:    { http: 422, message: '备注内容不能为空' },
    NOTE_CONTENT_TOO_LONG:    { http: 422, message: '备注内容不能超过2000字' },
    NOTE_NOT_AUTHOR:          { http: 403, message: '只能编辑自己的备注' },
    NOTE_MEDIA_REQUIRED:      { http: 422, message: '非文字类型必须附带附件' },

    // ===== 标签模块 (TAG_*) =====
    TAG_NOT_FOUND:            { http: 404, message: '标签不存在' },
    TAG_NAME_DUPLICATE:       { http: 422, message: '标签名称已存在' },
    TAG_NAME_REQUIRED:        { http: 422, message: '标签名称不能为空' },
    TAG_SYSTEM_PROTECTED:     { http: 403, message: '系统预置标签不可删除' },
    TAG_LIMIT_EXCEEDED:       { http: 422, message: '标签数量已达上限(20个)' },

    // ===== 积分/奖励模块 (REWARD_*) =====
    REWARD_NOT_FOUND:         { http: 404, message: '奖励不存在' },
    REWARD_INACTIVE:          { http: 422, message: '奖励已下架' },
    POINTS_INSUFFICIENT:      { http: 422, message: '积分不足' },
    REWARD_ALREADY_REDEEMED:  { http: 422, message: '奖励已兑换' },
    REDEMPTION_NOT_FOUND:     { http: 404, message: '兑换记录不存在' },
    REDEMPTION_ALREADY_CANCELLED: { http: 422, message: '兑换已取消' },

    // ===== 同步模块 (SYNC_*) =====
    SYNC_CONFLICT:            { http: 409, message: '数据冲突，请刷新后重试' },
    SYNC_VERSION_MISMATCH:    { http: 409, message: '数据版本不一致' },
    SYNC_DEVICE_NOT_FOUND:    { http: 404, message: '设备未注册' },
    SYNC_BATCH_TOO_LARGE:     { http: 422, message: '单次同步操作不能超过100条' },
    SYNC_INVALID_SEQUENCE:    { http: 422, message: '无效的同步序号' },

    // ===== 系统级错误 (SYS_*) =====
    INTERNAL_ERROR:           { http: 500, message: '服务器内部错误' },
    SERVICE_UNAVAILABLE:      { http: 503, message: '服务暂时不可用' },
    RATE_LIMITED:             { http: 429, message: '请求过于频繁' },
    MAINTENANCE:              { http: 503, message: '系统维护中' },
    VALIDATION_ERROR:         { http: 400, message: '参数校验失败' },
};
```

### 12.3 错误响应示例

```json
// 单个错误
{
    "code": "TASK_NOT_FOUND",
    "message": "任务不存在或已被删除",
    "details": {
        "task_id": "550e8400-e29b-41d4-a716-446655440000"
    }
}

// 多个校验错误
{
    "code": "VALIDATION_ERROR",
    "message": "参数校验失败",
    "details": {
        "errors": [
            { "field": "title", "code": "TASK_TITLE_REQUIRED", "message": "任务标题不能为空" },
            { "field": "task_date", "code": "TASK_DATE_INVALID", "message": "日期格式不正确" }
        ]
    }
}
```

---

## 13. 安全规格

### 13.1 数据安全

```
传输层:
- 全站 HTTPS (TLS 1.3)
- WebSocket 使用 WSS
- API Gateway 强制 HSTS

存储层:
- 密码: bcrypt (cost factor = 12)
- 手机号: AES-256-GCM 加密存储，密钥通过 KMS 管理
- PIN码: bcrypt 哈希存储
- JWT签名密钥: RSA-2048，私钥存储在 KMS/HSM
- 儿童数据: 数据库层面加密（pgcrypto）
- 备份: 加密备份，密钥与数据分离存储

会话层:
- Access Token: 15分钟过期
- Refresh Token: 7天过期，单次使用后轮换
- 同一账号最多5个活跃设备
- 异常登录检测（异地、异设备）→ 强制重新验证
```

### 13.2 接口安全

```
限流策略:
- 登录接口: 5次/分钟/IP
- 短信发送: 1次/60秒/号码，10次/天/号码
- API通用: 100次/分钟/用户
- 同步接口: 30次/分钟/设备

输入校验:
- 所有字符串输入做 XSS 过滤
- SQL 注入防护（参数化查询，ORM 保障）
- 文件上传: 仅允许 jpg/png/webp/m4a/wav，最大 5MB
- JSON 请求体: 最大 1MB

CSRF:
- SPA 使用 SameSite=Strict Cookie
- API 请求使用 Bearer Token（不依赖 Cookie 认证）
```

### 13.3 儿童隐私合规

```
符合《儿童个人信息网络保护规定》:
- 注册时验证家长身份（手机号+短信验证）
- 不收集儿童手机号（使用 PIN 码登录）
- 不收集儿童位置信息
- 不提供儿童间社交功能
- 不展示任何广告
- 不包含外部链接
- 家长可随时导出家庭全部数据（JSON/CSV）
- 家长可随时注销账号并永久删除所有数据
- 数据删除后 30 天内从备份中彻底清除

数据导出格式:
- family_info.json: 家庭基本信息
- members.json: 家庭成员列表
- tasks.json: 所有任务数据（含已删除的）
- notes.json: 所有备注
- audit_logs.json: 完整操作流水
- achievements.json: 积分和徽章记录
- rewards.json: 奖励和兑换记录
- daily_reviews.json: 每日评价
```

### 13.4 设备锁定（防沉迷）

```typescript
// 中间件检查
function checkUseTimeLimit(req, res, next) {
    if (req.user.role !== 'child') return next();

    const family = await getFamily(req.user.family_id);
    if (!family.use_time_start || !family.use_time_end) return next();

    const now = new Date();
    const currentTime = formatTime(now);
    const start = family.use_time_start; // "08:00"
    const end = family.use_time_end;     // "21:00"

    if (currentTime < start || currentTime > end) {
        return res.status(403).json({
            code: 'OUTSIDE_USE_TIME',
            message: `当前不在使用时间内（${start}-${end}）`,
            data: {
                allowed_start: start,
                allowed_end: end
            }
        });
    }

    next();
}

// 前端配合:
// - 到达限制时间前5分钟弹窗提醒
// - 到达限制时间后锁定界面，显示"休息时间到了，明天见！"
// - 仅显示时钟和温馨动画，不可操作
```

---

## 14. 部署架构

### 14.1 环境规划

| 环境 | 用途 | 配置 |
|------|------|------|
| local | 开发调试 | Docker Compose 本地全套 |
| dev | 联调测试 | 单节点，共享数据库 |
| staging | 预发布验证 | 与生产同配置（缩小规模） |
| production | 正式环境 | 高可用集群 |

### 14.2 生产部署拓扑

```
                    ┌─────────────┐
                    │   CDN       │ ← 静态资源 (阿里云CDN / CloudFlare)
                    │  (Web SPA)  │
                    └──────┬──────┘
                           │
                    ┌──────┴──────┐
                    │    SLB      │ ← 负载均衡 (阿里云SLB / AWS ALB)
                    │  (HTTPS)    │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
        ┌─────┴─────┐ ┌───┴───┐ ┌─────┴─────┐
        │  API Pod  │ │API Pod│ │  API Pod  │  ← K8s Deployment, 3 replicas
        │  (Node 1) │ │(N2)  │ │  (N3)     │
        └─────┬─────┘ └───┬───┘ └─────┬─────┘
              │            │            │
              └────────────┼────────────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
        ┌─────┴─────┐ ┌───┴───┐ ┌─────┴─────┐
        │PostgreSQL │ │ Redis │ │  OSS/S3   │
        │ 主从集群   │ │ 哨兵  │ │  对象存储  │
        └───────────┘ └───────┘ └───────────┘
```

### 14.3 Docker Compose（开发环境）

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: kids_todo
      POSTGRES_USER: app
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --requirepass ${REDIS_PASSWORD}

  api:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=kids_todo
      - DB_USER=app
      - DB_PASSWORD=${DB_PASSWORD}
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379
      - JWT_PRIVATE_KEY_PATH=/run/secrets/jwt_private
      - JWT_PUBLIC_KEY_PATH=/run/secrets/jwt_public
      - FCM_SERVER_KEY=${FCM_SERVER_KEY}
    depends_on:
      - postgres
      - redis
    secrets:
      - jwt_private
      - jwt_public

  web:
    build: ./frontend/web
    ports:
      - "8080:80"
    depends_on:
      - api

volumes:
  pgdata:

secrets:
  jwt_private:
    file: ./secrets/jwt_private.pem
  jwt_public:
    file: ./secrets/jwt_public.pem
```

### 14.4 环境变量清单

```env
# ===== 数据库 =====
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kids_todo
DB_USER=app
DB_PASSWORD=<strong-password>
DB_POOL_MIN=5
DB_POOL_MAX=20

# ===== Redis =====
REDIS_URL=redis://:password@localhost:6379
REDIS_PREFIX=kids_todo:

# ===== JWT =====
JWT_PRIVATE_KEY_PATH=./secrets/jwt_private.pem
JWT_PUBLIC_KEY_PATH=./secrets/jwt_public.pem
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# ===== 推送 =====
FCM_SERVER_KEY=<firebase-key>
FCM_PROJECT_ID=<project-id>
APNs_KEY_ID=<apple-key-id>
APNs_TEAM_ID=<apple-team-id>
APNs_KEY_PATH=./secrets/apns_key.p8

# ===== 对象存储 =====
OSS_PROVIDER=aliyun  # aliyun / aws
OSS_BUCKET=kids-todo-files
OSS_ACCESS_KEY=<key>
OSS_ACCESS_SECRET=<secret>
OSS_ENDPOINT=https://oss-cn-hangzhou.aliyuncs.com
OSS_MAX_FILE_SIZE=5242880  # 5MB

# ===== 短信 =====
SMS_PROVIDER=aliyun
SMS_ACCESS_KEY=<key>
SMS_ACCESS_SECRET=<secret>
SMS_SIGN_NAME=小计划
SMS_TEMPLATE_CODE=SMS_123456

# ===== 应用 =====
APP_ENV=production
APP_PORT=3000
APP_CORS_ORIGINS=https://app.example.com,https://admin.example.com
APP_RATE_LIMIT_WINDOW=60000
APP_RATE_LIMIT_MAX=100

# ===== WebSocket =====
WS_PING_INTERVAL=30000
WS_MAX_CONNECTIONS_PER_USER=5

# ===== 日志 =====
LOG_LEVEL=info
LOG_FORMAT=json
```

---

## 15. 测试要求

### 15.1 测试分层

| 层级 | 覆盖率要求 | 工具 | 说明 |
|------|-----------|------|------|
| 单元测试 | ≥ 80% | Jest / Go testing | 纯函数、业务逻辑 |
| 集成测试 | 核心路径100% | Supertest / httptest | API端到端 |
| E2E测试 | 核心流程 | Playwright / Detox | 关键用户旅程 |
| 性能测试 | — | k6 / Artillery | 并发压测 |
| 安全测试 | — | OWASP ZAP | 渗透测试 |

### 15.2 核心测试用例

```typescript
// ===== 任务状态机测试 =====
describe('Task State Machine', () => {
    test('todo → in_progress: 合法转换', async () => {
        const task = await createTask({ status: 'todo' });
        const result = await updateTaskStatus(task.id, 'in_progress');
        expect(result.status).toBe('in_progress');
        expect(result.actual_start).not.toBeNull();
    });

    test('in_progress → done: 触发积分计算', async () => {
        const task = await createTask({ status: 'in_progress', priority: 'high' });
        const before = await getAchievement(childId);
        const result = await updateTaskStatus(task.id, 'done');
        const after = await getAchievement(childId);
        expect(result.status).toBe('done');
        expect(after.total_points).toBe(before.total_points + 3);
    });

    test('todo → cancelled: 需要取消原因', async () => {
        const task = await createTask({ status: 'todo' });
        await expect(
            updateTaskStatus(task.id, 'cancelled', {})
        ).rejects.toThrow('CANCEL_REASON_REQUIRED');
    });

    test('done → cancelled: 非法转换', async () => {
        const task = await createTask({ status: 'done' });
        await expect(
            updateTaskStatus(task.id, 'cancelled', { reason: '不想做了' })
        ).rejects.toThrow('INVALID_STATUS_TRANSITION');
    });

    test('cancelled → todo: 仅家长可恢复', async () => {
        const task = await createTask({ status: 'cancelled' });
        // 孩子尝试恢复
        await expect(
            restoreTask(task.id, { as: child })
        ).rejects.toThrow('ONLY_PARENT_CAN_OPERATE');
        // 家长恢复
        const result = await restoreTask(task.id, { as: parent });
        expect(result.status).toBe('todo');
    });
});

// ===== 权限测试 =====
describe('Permission Matrix', () => {
    test('孩子不能修改家长创建的任务优先级为high', async () => {
        const task = await createTask({ creator: parentA, priority: 'medium' });
        await expect(
            updateTask(task.id, { priority: 'high', as: child })
        ).rejects.toThrow('CANNOT_SET_HIGH_PRIORITY');
    });

    test('孩子不能删除家长创建的任务', async () => {
        const task = await createTask({ creator: parentA });
        await expect(
            deleteTask(task.id, { as: child })
        ).rejects.toThrow('CANNOT_DELETE_OTHERS_TASK');
    });

    test('家长A可以看到家长B的所有操作', async () => {
        const task = await createTask({ creator: parentB });
        const logs = await getAuditLogs({ as: parentA, family_id });
        expect(logs.some(l => l.operator_id === parentB.id)).toBe(true);
    });

    test('孩子不能查看全局操作流水', async () => {
        await expect(
            getAuditLogs({ as: child })
        ).rejects.toThrow('FORBIDDEN');
    });
});

// ===== 离线同步测试 =====
describe('Offline Sync', () => {
    test('重复提交相同 op_id 不会重复应用', async () => {
        const op = { op_id: 'client-op-1', entity_type: 'task', action: 'update', ... };
        await syncPush([op]);
        const result = await syncPush([op]); // 重复提交
        expect(result.results[0].status).toBe('duplicate');
    });

    test('版本冲突时返回conflict标记', async () => {
        const task = await createTask({ version: 1 });
        // 设备A基于version=1修改
        const opA = { entity_id: task.id, server_entity_version: 1, payload: { title: 'A修改' } };
        // 设备B先提交了修改，version变为2
        await syncPush([{ entity_id: task.id, server_entity_version: 1, payload: { title: 'B修改' } }]);
        // 设备A再提交
        const result = await syncPush([opA]);
        expect(result.results[0].status).toBe('conflict');
    });
});

// ===== 积分计算测试 =====
describe('Points Calculation', () => {
    test('高优先级任务完成得3分', async () => {
        const task = await createTask({ priority: 'high' });
        const points = await completeTask(task.id);
        expect(points).toBe(3);
    });

    test('提前完成额外+1分', async () => {
        const task = await createTask({ estimated_minutes: 60 });
        await startTask(task.id);
        // 模拟40分钟后完成（< 80%的60分钟=48分钟）
        const points = await completeTask(task.id, { elapsed_minutes: 40 });
        expect(points).toBe(3 + 1); // 基础2分(中优先级) + 提前1分
    });

    test('连续打卡7天奖励20分', async () => {
        // 模拟连续6天完成
        for (let i = 1; i <= 6; i++) {
            await simulatePerfectDay(childId, addDays(today, -i));
        }
        const before = await getAchievement(childId);
        expect(before.current_streak).toBe(6);

        // 第7天完成
        await simulatePerfectDay(childId, today);
        const after = await getAchievement(childId);
        expect(after.current_streak).toBe(7);
        expect(after.total_points).toBeGreaterThanOrEqual(before.total_points + 20);
    });
});
```

### 15.3 API 测试规范

```
每个 API 端点必须包含以下测试:
1. 正常请求 → 200/201 + 正确响应体
2. 缺少必填参数 → 400 + VALIDATION_ERROR
3. 参数格式错误 → 400 + 具体字段错误
4. 未认证 → 401 + AUTH_REQUIRED
5. Token过期 → 401 + TOKEN_EXPIRED
6. 无权限 → 403 + FORBIDDEN / ONLY_PARENT_CAN_OPERATE
7. 资源不存在 → 404 + *_NOT_FOUND
8. 业务规则违反 → 422 + 具体错误码
9. 并发冲突 → 409 + SYNC_CONFLICT
10. 限流 → 429 + RATE_LIMITED

性能基准:
- 单接口 P99 < 500ms
- 任务列表（100条）< 1s
- 同步接口（50条变更）< 2s
- WebSocket 消息延迟 < 3s
```

---

## 附录 A：数据字典速查

### 枚举值定义

```
user_role:        parent | child
parent_label:     parent_a | parent_b
task_priority:    high(红) | medium(黄) | low(绿)
task_status:      todo | in_progress | done | cancelled
repeat_rule:      none | daily | weekly | weekdays
audit_action:     task_created | task_updated | task_status_changed | task_deleted |
                  task_restored | note_created | note_updated | note_deleted |
                  reward_created | reward_redeemed | reward_cancelled |
                  review_created | settings_updated
approval_status:  none | pending | approved | rejected
content_type:     text | voice | image
sync_action:      insert | update | delete
```

### 积分规则速查

```
完成任务:  high=3分, medium=2分, low=1分
提前完成:  +1分（实际时间 < 预计时间×80%）
帮助解决:  +1分（家长备注后孩子解决）
连续3天:   +5分
连续7天:   +20分
连续30天:  +100分
连续100天: +500分
完美一天:  +5分（当日任务全部完成）
```

### 限制值速查

```
家庭: 最多2家长 + 1孩子 (v1.0)
任务标题: 1-200字
备注内容: 1-2000字
预计时长: 1-480分钟
标签数量: 每家庭最多20个
自定义标签名: 最长20字
邀请码: 6位大写字母+数字
PIN码: 4-6位数字
JWT Access Token: 15分钟
JWT Refresh Token: 7天
WebSocket 心跳: 30秒
离线同步批量: 最多100条/次
文件上传: 最大5MB
API限流: 100次/分钟/用户
```

---

## 附录 B：项目目录结构建议

```
kids-todo/
├── docker-compose.yml
├── .env.example
├── README.md
│
├── backend/
│   ├── Dockerfile
│   ├── package.json (或 go.mod)
│   ├── src/
│   │   ├── app.ts                    # 入口
│   │   ├── config/
│   │   │   ├── database.ts
│   │   │   ├── redis.ts
│   │   │   └── jwt.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts               # JWT验证
│   │   │   ├── rbac.ts               # 角色权限
│   │   │   ├── rateLimit.ts          # 限流
│   │   │   ├── validator.ts          # 参数校验
│   │   │   ├── useTimeLimit.ts       # 孩子使用时间检查
│   │   │   └── errorHandler.ts       # 全局错误处理
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── auth.validator.ts
│   │   │   │   └── auth.test.ts
│   │   │   ├── family/
│   │   │   ├── task/
│   │   │   ├── note/
│   │   │   ├── audit/
│   │   │   ├── tag/
│   │   │   ├── achievement/
│   │   │   ├── reward/
│   │   │   ├── stats/
│   │   │   ├── review/
│   │   │   └── sync/
│   │   ├── websocket/
│   │   │   ├── ws.server.ts
│   │   │   ├── ws.handler.ts
│   │   │   └── ws.rooms.ts
│   │   ├── jobs/
│   │   │   ├── reminder.job.ts       # 定时提醒
│   │   │   ├── overtime.job.ts       # 超时检测
│   │   │   ├── repeatTask.job.ts     # 重复任务生成
│   │   │   └── cleanup.job.ts        # 数据清理
│   │   ├── shared/
│   │   │   ├── errors.ts             # 错误码定义
│   │   │   ├── constants.ts
│   │   │   └── utils.ts
│   │   └── db/
│   │       ├── migrations/
│   │       ├── seeds/
│   │       └── schema.prisma (或 entities/)
│   └── tests/
│       ├── integration/
│       └── e2e/
│
├── frontend/
│   ├── web/                           # React/Vue SPA
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   ├── App.tsx
│   │   │   ├── api/                   # API客户端封装
│   │   │   │   ├── client.ts
│   │   │   │   ├── auth.api.ts
│   │   │   │   ├── task.api.ts
│   │   │   │   └── ...
│   │   │   ├── hooks/                 # 自定义hooks
│   │   │   │   ├── useAuth.ts
│   │   │   │   ├── useWebSocket.ts
│   │   │   │   ├── useSync.ts
│   │   │   │   └── ...
│   │   │   ├── stores/               # 状态管理
│   │   │   │   ├── auth.store.ts
│   │   │   │   ├── task.store.ts
│   │   │   │   └── ...
│   │   │   ├── components/
│   │   │   │   ├── common/
│   │   │   │   ├── task/
│   │   │   │   ├── stats/
│   │   │   │   └── ...
│   │   │   ├── pages/
│   │   │   │   ├── Login/
│   │   │   │   ├── Today/
│   │   │   │   ├── TaskDetail/
│   │   │   │   ├── Stats/
│   │   │   │   └── ...
│   │   │   ├── styles/
│   │   │   └── utils/
│   │   └── public/
│   │
│   └── mobile/                        # Flutter / React Native
│       ├── lib/
│       │   ├── main.dart
│       │   ├── api/
│       │   ├── models/
│       │   ├── screens/
│       │   ├── widgets/
│       │   ├── providers/             # 状态管理
│       │   ├── services/
│       │   │   ├── websocket.service.dart
│       │   │   ├── sync.service.dart
│       │   │   ├── notification.service.dart
│       │   │   └── offline.service.dart
│       │   └── utils/
│       └── test/
│
├── shared/                            # 前后端共享
│   ├── types/                         # TypeScript类型定义
│   │   ├── task.types.ts
│   │   ├── user.types.ts
│   │   ├── api.types.ts
│   │   └── ws.types.ts
│   ├── constants/
│   │   ├── error-codes.ts
│   │   └── enums.ts
│   └── validators/                    # Zod schemas (可选)
│       ├── task.schema.ts
│       └── ...
│
├── docs/
│   ├── api.md                         # API文档
│   ├── database.md                    # 数据库文档
│   ├── deployment.md                  # 部署指南
│   └── architecture.md               # 架构图
│
└── scripts/
    ├── init-db.sh                     # 数据库初始化
    ├── seed.ts                        # 预置数据
    └── generate-jwt-keys.sh          # JWT密钥生成
```

---

## 附录 C：关键第三方依赖版本

```json
{
    "backend": {
        "nestjs": "^10.0",
        "prisma": "^5.0",
        "passport-jwt": "^4.0",
        "bcrypt": "^5.1",
        "ws": "^8.14",
        "ioredis": "^5.3",
        "bull": "^4.11",
        "zod": "^3.22",
        "winston": "^3.11",
        "helmet": "^7.1",
        "express-rate-limit": "^7.1"
    },
    "frontend-web": {
        "react": "^18.2",
        "react-router-dom": "^6.20",
        "zustand": "^4.4",
        "tanstack-query": "^5.0",
        "antd": "^5.12",
        "echarts": "^5.4",
        "fullcalendar": "^6.1",
        "dnd-kit": "^6.1",
        "dexie": "^3.2",
        "dayjs": "^1.11",
        "axios": "^1.6"
    },
    "frontend-mobile": {
        "flutter": "^3.16",
        "riverpod": "^2.4",
        "dio": "^5.4",
        "isar": "^3.1",
        "flutter_local_notifications": "^16.0"
    }
}
```

---

*文档结束。本规格书覆盖 MVP（Phase 1）全部技术细节，Phase 2/3 的积分、统计、离线等模块已预留接口和数据结构。开发团队可直接基于此文档进行任务拆分和排期。*

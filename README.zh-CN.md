# 小计划（Kids Todo）—— 家长和孩子一起用的家庭任务应用

> **家长安排今天，孩子勾掉今天，两个人在同一条任务里说清楚。** 积分、徽章和奖励，把每天的
> 小目标变成全家都愿意坚持的小游戏。

小计划是基于 [KeelBase](https://github.com/rain6fish/KeelBase) 平台做出来的真实家庭产品。一个家庭
共用一块任务板：家长布置任务（孩子也可以自己建），孩子完成后打勾，任务下面可以像聊天一样留备注、
发照片和文件。Web 工作台让家长在电脑上管理同一块板，管理台负责平台侧的用户与数据。

- 手机 App：Flutter，中文优先
- 网页工作台 + 管理台：Vue 3 + Element Plus（`/user/`、`/admin/`）
- 接口：NestJS + TypeORM（生产 PostgreSQL，本地开发 SQLite）

---

## 项目简介

**小计划**面向 3–12 岁孩子的家庭：家长把每天的学习、生活任务排进日历，孩子用自己的登录账号和
PIN 登录后完成任务、和家长留言互动；完成任务累计积分与连签，可以兑换家庭奖励。家长可以开启
「孩子创建的任务需审批」，也能随时修改孩子的登录账号或 PIN。

产品有三种入口：手机上的 Flutter App、浏览器里的 Web 工作台，以及一个只加载网页版 App 的
Android WebView 壳（日常 UI 改动只需更新网页，不用重打 APK）。

## 功能

**家长**
- 创建、编辑任务：标题、描述、优先级、日期、预计时长、重复规则、附件。
- 把任务指派给孩子；开启审批模式后，审批或驳回孩子创建的任务。
- 管理家庭：家庭名称、邀请码、审批模式、可用时段、家庭状态。
- 添加孩子（昵称 + 登录账号 + 4–6 位 PIN），随时重置 PIN。
- 奖励与兑换、每日评价、积分、连签与徽章。

**孩子**
- 用「登录账号 + PIN」登录（首次可填家庭邀请码，之后免填）。
- 查看今日任务与月历，完成任务、标记未完成、请求帮助。
- 在任务备注里和家长对话，发送图片和文件。
- 只能编辑或删除自己创建的任务。
- 用积分兑换家庭奖励（兑换入口在 Web 工作台）。

**任务列表**
- 按当前展示顺序自动编号（1、2、3…）。
- 支持本地排序：优先级（高→低）、状态（待办→进行中→已完成→已取消）、创建时间（新→旧）；
  默认保持服务端顺序。

**通用**
- Flutter App 支持离线队列：断网时的改动会在恢复网络后补推。
- 任务更新走乐观锁（`version`）：携带旧版本的写入会返回 409，而不是无声覆盖别人的修改。

## 任务权限

任务创建者记在 `tasks.user_id`。

| 操作 | 家长 | 孩子 |
|------|------|------|
| 编辑 / 撤销完成 / 删除 | 家庭内任何任务 | 只有自己创建的任务（否则 **403**） |
| 完成 | 可以 | 可以——家长布置给孩子的任务本来就由孩子勾选完成 |
| 审批 / 驳回 | 可以 | 不可以 |

服务端在 `TasksService` 中强制这套规则；Flutter App 与 Web 工作台按同一规则隐藏不可用的入口。
家庭边界本身由基于 `familyId` 的 CASL 规则把关。

## 架构

```text
Front-Flutter（Android / iOS / Web）─┐
Web-Admin-Vue（/user/、/admin/）   ──┼── REST /api/v1 ── NestJS + TypeORM ── PostgreSQL（生产）/ SQLite（开发）
Front-Taro（H5）                   ──┘                          │
                                                       Redis（可选：缓存 / 队列）
Front-Shell：Android WebView 壳，加载托管在 /app/ 的 Flutter Web 产物
```

## 目录结构

| 路径 | 说明 |
|------|------|
| `Server-NestJS/` | NestJS 接口：认证、家庭、任务、任务备注、奖励、积分/徽章、统计、离线同步 |
| `Front-Flutter/` | Flutter App（手机）以及部署到 `/app/` 的 Flutter Web 产物 |
| `Front-Shell/` | 只加载网页版 App 的 Android WebView 壳 |
| `Web-Admin-Vue/` | Vue 3 工作台（`/user/`）与管理台（`/admin/`） |
| `Front-Taro/` | Taro H5 客户端 |
| `specs/` | 生成小计划业务模块所用的模块协议 |
| `docs/` | 产品需求、实现规格与平台文档 |
| `deploy/`、`Dockerfile`、`docker-compose.yml` | 容器构建与部署 |

## 快速开始

### Docker

```bash
cp Server-NestJS/.env.production.example Server-NestJS/.env.production
# 编辑 .env.production：JWT 密钥、数据库密码等
docker compose up -d --build
```

- 接口与健康检查：<http://localhost:3000/api/v1/health>
- 网页工作台 / 管理台：<http://localhost/user/>、<http://localhost/admin/>

服务启动时自动执行数据库迁移；首次启动会创建平台管理员（见 `Server-NestJS/src/common/seed.ts`）。

### 本地开发

```bash
# 后端（默认 SQLite）
cd Server-NestJS
cp .env.example .env
npm ci
npm run start:dev

# Web 工作台 + 管理台
cd Web-Admin-Vue
npm ci
npm run dev                 # http://localhost:10086/admin/
npm run dev -- --mode user  # http://localhost:10086/user/

# Flutter App
cd Front-Flutter
flutter pub get
flutter run                 # 或：flutter run -d chrome
```

在 App 里注册家长账号会自动创建家庭和邀请码；在「家庭」页添加孩子后，孩子即可用登录账号 + PIN
登录。

## 测试

```bash
cd Server-NestJS && npm run build && npx jest src/tasks --forceExit
cd Front-Flutter && flutter analyze && flutter test
cd Web-Admin-Vue && npm run typecheck && npm run build
cd Front-Taro && npm run build:h5
```

## 部署要点

- **后端**：`docker build --platform linux/amd64 --target server -t <tag> .`，把镜像推到服务器后
  修改 `docker-compose.yml` 的镜像 tag；容器需要 `Server-NestJS/.env.production`。
- **网页**：`npm run build:user`（base `/user/`）与 `npm run build:admin`（base `/admin/`），
  把两个 `dist/` 目录交给 nginx 托管。
- **手机端**：从 `Front-Flutter` 打 APK；或者保留 `Front-Shell` 壳，日常 UI 改动只更新 `/app/`
  下的 Flutter Web 产物，不重打 APK。
- Flutter Web 构建：
  `flutter build web --release --base-href /app/ --pwa-strategy=none --dart-define=API_BASE_URL=<接口地址>`

## 文档

- [需求确认书](docs/kids-todo-requirements.md)
- [实现规格](docs/kids-todo.spec.md)
- [平台开发指南](CLAUDE.md)与 [Agent 规则](AGENTS.md)

## 当前状态

已实现：任务、备注与附件、审批、家庭管理、积分/徽章/奖励、统计、Flutter 端离线同步、任务权限、
列表序号与排序。

未实现：任务定时提醒（需要 Redis + `QUEUE_ENABLED=true`）、Web 与 Taro 端的离线队列、徽章管理界面。

## 许可证与致谢

Apache License 2.0，见 [LICENSE](LICENSE)。本项目构建在 KeelBase 平台
（<https://github.com/rain6fish/KeelBase>）之上，上游版权与声明继续有效；第三方组件见
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

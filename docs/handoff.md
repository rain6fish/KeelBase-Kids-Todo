# 小计划（kids-todo）交接说明

> 用途：给新开的干净会话直接接手。读完本文即可开始，不要再去翻旧会话历史。
> 更新时间：2026-11-04

## 1. 项目速览

- 应用根：`D:/tempDowns/KB_test/kids-todo`
- 底座：KeelBase 1.3.0（完整拷贝，不是子目录引用）
- 栈：NestJS 11 + TypeORM（开发 SQLite / 生产 PostgreSQL）、Flutter（Front-Flutter）、Vue3 + Element Plus（Web-Admin-Vue）、Taro
- 参考文档：
  - 需求：`docs/kids-todo-requirements.md`
  - 规格：`docs/kids-todo.spec.md`
  - 旧项目资料留档：`docs/legacy-reference/`

## 2. 当前运行状态

截至交接时三端都在运行：

| 端 | 地址 | 说明 |
|---|---|---|
| 后端 | http://localhost:3000 | 健康检查正常 |
| Web | http://127.0.0.1:5173/admin/ | Vite dev，端口 5173（10086 被系统保留，EACCES） |
| App | Android 模拟器 `emulator-5556` | Pixel 10 Pro XL，包名 `com.app.front` |

注意：
- 旧会话启动的服务进程仍在，但终端 tab 不会自动出现在新会话里；需要重启时按下面命令新开终端。
- `emulator-5554` 是早先卡死的 Pixel 9（offline），忽略它，不要用它跑 App。

### 重启命令

后端：

```bash
cd D:/tempDowns/KB_test/kids-todo/Server-NestJS
npm run build && node dist/main.js
```

Web：

```bash
cd D:/tempDowns/KB_test/kids-todo/Web-Admin-Vue
npm run dev -- --host 127.0.0.1 --port 5173
```

App（模拟器已在运行时）：

```bash
cd D:/tempDowns/KB_test/kids-todo/Front-Flutter
flutter run -d emulator-5556 --dart-define=API_BASE_URL=http://10.0.2.2:3000/api/v1
```

模拟器未启动时：

```bash
"$LOCALAPPDATA/Android/Sdk/emulator/emulator.exe" -avd Pixel_10_Pro_XL -no-snapshot-load -no-boot-anim -gpu swiftshader_indirect
```

## 3. 演示账号

- 家长：`demo_parent` / `Demo@2026`
- 孩子：邀请码 `9C8G4UCM`，昵称 `小星`，PIN `1234`
- Web 管理员：`admin` / `Admin@2026$KeelBase`

## 4. 已完成功能

- 家庭角色、家庭创建、第二位家长加入、家长改家庭名称、家庭停用/恢复（只改 `status`，不物理删除）
- 孩子 PIN 登录、家长创建孩子（App 家庭设置页 / Web 家庭页点「添加孩子」）
- 任务：创建、审批通过/驳回、完成、求助、重复任务、积分/连签/打卡
- 任务页：月历选择日期 + 当日任务查询 + 儿童风彩色卡片列表
- 任务详情：备注对话（家长写、孩子回，每条显示作者与时间）、未读备注提示、可折叠操作历史（谁/何时/做了什么/状态）
- 奖励：创建、兑换、取消退分、兑换记录
- 统计：今日完成率、家庭积分、成员数、连签
- 徽章按阈值自动授予，同类型不重复
- 离线同步：设备登记、增量拉取、任务变更推送
- Web：小计划家长工作台（今日/家庭/奖励/每日评价）、管理台新增小计划数据分组
- App 底部恰好 5 个 Tab：今日 / 任务 / 家庭 / 奖励 / 我的

## 5. 验证基线

```bash
cd kids-todo
node scripts/keelbase-doctor.mjs          # PASS，0 fail / 0 warn
npm run check:app-wiring                  # PASS

cd Server-NestJS
npm run build                             # 通过
npm test -- "task_notes|families|tasks|auth" --runInBand

cd Front-Flutter
flutter analyze                           # 0 error（其余为生成器命名风格 info）
flutter test                              # 671 全过

cd Web-Admin-Vue
npm run typecheck                         # 通过
npm run build                             # 通过
```

已知非代码问题：
- `Server-NestJS/specs/protocol` 契约 submodule 为空 → `delegation-token.service.spec.ts` 1 个用例失败；后端表现为 337/338。不要当成本次改动回归。
- Web vitest 单测在当前环境全部倒在 `localStorage undefined`（jsdom 环境未生效），与业务代码无关；typecheck/build 是可信基线。

## 6. 关键路径

后端：
- `Server-NestJS/src/tasks/`：任务、状态机、积分结算、历史
- `Server-NestJS/src/task_notes/`：备注、未读记录 `task-note-read.entity.ts`
- `Server-NestJS/src/families/`：家庭、`status` 停用
- `Server-NestJS/src/auth/`：注册/登录、孩子 PIN、家庭设置
- `Server-NestJS/src/stats/`：家庭/个人统计
- `Server-NestJS/src/sync/`：离线同步
- `Server-NestJS/src/common/change-log/`：不可删变更流水
- `Server-NestJS/src/migrations/`：1846~1853 为小计划新增迁移；postgres 清单在 `src/config/postgres-migrations.ts`

App：
- `Front-Flutter/lib/features/tasks/presentation/pages/tasks_page.dart`：月历 + 卡片
- `.../task_detail_page.dart`：备注对话 + 操作历史
- `Front-Flutter/lib/features/stats/presentation/pages/today_page.dart`：今日页
- `Front-Flutter/lib/features/families/presentation/pages/family_settings_page.dart`：家庭设置
- `Front-Flutter/lib/core/widgets/app_shell.dart`：5 个底部 Tab
- `Front-Flutter/lib/core/router/app_router.dart`：路由
- `Front-Flutter/lib/core/i18n/app_localizations.dart`：中英文案与枚举显示名

Web：
- `Web-Admin-Vue/src/views/workbench/KidsHomeView.vue` / `KidsFamilyView.vue` / `KidsRewardsView.vue` / `KidsReviewsView.vue`
- `Web-Admin-Vue/src/api/kids.ts`
- `Web-Admin-Vue/src/router/routes.ts`、`src/layouts/AdminLayout.vue`
- `Web-Admin-Vue/src/i18n/zh.ts` / `en.ts`

## 7. 数据与注意事项

- 开发库：`Server-NestJS/data/front.sqlite`，里面有演示数据（demo 家庭、3 个今日任务、备注、积分）。
- `Server-NestJS/.env` 是从 `.env.example` 复制的本地开发配置，含占位密钥；生产前必须替换。
- `kids-todo` 目前不是 git 仓库（无版本控制兜底）；大改前先自行备份。
- 任务/备注只软删除，家庭只改状态；`change_sequence` 是操作历史来源，不要清空。
- 迁移规则：sqlite / postgres 各生成一份；postgres 迁移必须加 `if (connection.options.type !== 'postgres') return;`，并登记到 `POSTGRES_MIGRATION_GLOBS` 或 `POSTGRES_EXCLUDED_MIGRATIONS`。
- 旧的空目录 `D:/tempDowns/KB_test/kids_todo_mobile` 被某个程序占用删不掉，可忽略。

## 8. 工作偏好

- 中文交流，直接、少解释、先验证再汇报。
- 改代码前先读当前文件状态；不要重复已完成的工作。
- 大改前先确认方案；修完跑对应测试再汇报。

## 9. 新会话开场建议

新会话直接读本文件即可。建议第一句：

> 读 `D:/tempDowns/KB_test/kids-todo/docs/handoff.md`，承接小计划项目。先汇报当前三端状态，然后等我的具体任务。

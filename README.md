# Kids Todo (小计划) — a family task app for parents and children

> **Parents plan the day; children check it off; both talk it through.** Points, badges and
> rewards turn daily routines into a small game the whole family can keep up with.

Kids Todo is a working family product built on the [KeelBase](https://github.com/rain6fish/KeelBase)
platform. One family shares one task board: a parent creates tasks (or a child does), the child
completes them, and a task thread carries notes, photos and files. A web workbench gives parents a
desktop side for the same board, and an admin console manages the platform.

- Mobile app: Flutter, Chinese-first UI
- Web workbench + admin console: Vue 3 + Element Plus (`/user/`, `/admin/`)
- API: NestJS + TypeORM (PostgreSQL in production, SQLite for local development)

---

## What it does

**For parents**
- Create and edit tasks: title, description, priority, date, estimated minutes, repeat rule, attachment.
- Assign a task to a child; approve or reject child-created tasks (approval mode is a family setting).
- Manage the family: name, invite code, approval mode, active hours, family status.
- Add children with a nickname, login account and 4–6 digit PIN; reset the PIN at any time.
- Rewards and redemption, daily reviews, points, streaks and badges.

**For children**
- Sign in with login account + PIN (family invite code optional after the first login).
- See today's tasks and the monthly calendar, complete a task, mark it not done, or ask for help.
- Chat with parents in the task thread; send photos and files.
- Edit or delete only the tasks they created themselves.
- Redeem points for family rewards (the redemption entry lives in the web workbench).

**Task list**
- Automatic numbering (1, 2, 3 …) in the current display order.
- Local sorting by priority (high → low), status (to-do → doing → done → cancelled) or creation
  time (newest → oldest); the default keeps the server order.

**Everywhere**
- Offline queue in the Flutter app: changes made offline are replayed when the network returns.
- Optimistic locking (`version`) on every task update — a stale write is refused with 409 instead
  of silently overwriting someone else.

## Task permissions

The creator is stored in `tasks.user_id`.

| Action | Parent | Child |
|--------|--------|-------|
| Update / uncomplete / delete | Any task in the family | Only tasks they created (otherwise **403**) |
| Complete | Yes | Yes — a task assigned by a parent is meant to be ticked off by the child |
| Approve / reject | Yes | No |

The server enforces this in `TasksService`; the Flutter app and the web workbench hide the actions
they cannot use. Family scope itself is enforced by CASL rules keyed on `familyId`.

## Architecture

```text
Front-Flutter (Android / iOS / Web) ─┐
Web-Admin-Vue  (/user/, /admin/)  ───┼── REST /api/v1 ── NestJS + TypeORM ── PostgreSQL (prod) / SQLite (dev)
Front-Taro (H5)                   ───┘                          │
                                                        Redis (optional: cache / queue)
Front-Shell: Android WebView shell loading the Flutter Web build hosted at /app/
```

## Repository layout

| Path | What it is |
|------|------------|
| `Server-NestJS/` | NestJS API: auth, families, tasks, task notes, rewards, points/badges, stats, sync |
| `Front-Flutter/` | Flutter app (phone) and the Flutter Web build served under `/app/` |
| `Front-Shell/` | Thin Android WebView shell that loads the hosted Flutter Web app |
| `Web-Admin-Vue/` | Vue 3 workbench (`/user/`) and admin console (`/admin/`) |
| `Front-Taro/` | Taro H5 client |
| `specs/` | Module protocols used to generate the kids-todo business modules |
| `docs/` | Product requirements, implementation spec and platform documentation |
| `deploy/`, `Dockerfile`, `docker-compose.yml` | Container builds and deployment |

## Quick start

### Docker

```bash
cp Server-NestJS/.env.production.example Server-NestJS/.env.production
# edit .env.production: JWT secrets, DB password, etc.
docker compose up -d --build
```

- API and health check: <http://localhost:3000/api/v1/health>
- Web workbench / admin console: <http://localhost/user/> and <http://localhost/admin/>

Migrations run when the server starts. A platform administrator is seeded on first start (see
`Server-NestJS/src/common/seed.ts`).

### Local development

```bash
# API (SQLite by default)
cd Server-NestJS
cp .env.example .env
npm ci
npm run start:dev

# Web workbench + admin console
cd Web-Admin-Vue
npm ci
npm run dev                 # http://localhost:10086/admin/
npm run dev -- --mode user  # http://localhost:10086/user/

# Flutter app
cd Front-Flutter
flutter pub get
flutter run                 # or: flutter run -d chrome
```

Use the app to register a parent account — a family and an invite code are created automatically.
Add a child under **家庭**, then let the child sign in with the login account and PIN.

## Testing

```bash
cd Server-NestJS && npm run build && npx jest src/tasks --forceExit
cd Front-Flutter && flutter analyze && flutter test
cd Web-Admin-Vue && npm run typecheck && npm run build
cd Front-Taro && npm run build:h5
```

## Deployment notes

- **API**: `docker build --platform linux/amd64 --target server -t <tag> .`, push the image to the
  host and point `docker-compose.yml` at it; the container needs `Server-NestJS/.env.production`.
- **Web workbench**: `npm run build:user` (base `/user/`) and `npm run build:admin` (base `/admin/`),
  then serve the two `dist/` folders behind nginx.
- **Mobile**: build the APK from `Front-Flutter`, or keep the WebView shell (`Front-Shell`) and
  update only the Flutter Web bundle at `/app/` for day-to-day UI changes.
- Flutter Web build:
  `flutter build web --release --base-href /app/ --pwa-strategy=none --dart-define=API_BASE_URL=<api>`

## Documentation

- [Requirements (zh)](docs/kids-todo-requirements.md)
- [Implementation spec (zh)](docs/kids-todo.spec.md)
- [Platform guide](CLAUDE.md) and [agent rules](AGENTS.md)

## Status

Implemented: tasks, notes/attachments, approvals, family management, points/badges/rewards, stats,
offline sync on the Flutter app, task permissions, numbering and sorting.

Not yet: scheduled task reminders (needs Redis + `QUEUE_ENABLED=true`), offline queue on the web and
Taro clients, badge management UI.

## License and attribution

Apache License 2.0 — see [LICENSE](LICENSE). This product is built on the KeelBase platform
(<https://github.com/rain6fish/KeelBase>); upstream copyright and notices remain in effect. Third-party
components are listed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

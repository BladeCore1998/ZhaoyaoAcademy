# academy-front 局部规约

## 技术栈

- Next.js App Router + TypeScript。
- 使用 `pnpm@11.12.0` 管理依赖，必须提交 `pnpm-lock.yaml`。
- 登录使用 Better Auth，数据库访问使用 Drizzle ORM + `mysql2`。
- Redis 用于认证 secondary storage、短期状态和后续限流能力。
- 管理端使用 Ant Design；用户端保持独立的古风视觉和交互。

## 页面边界

- 根路径 `/` 是用户端首页，不创建 `/user` 前缀。
- `/playlists`、`/books`、`/mailbox` 属于用户端内容页面。
- `/admin` 及其子路径属于管理端，首版角色只有 `user` 和 `admin`。
- 用户端和管理端都必须支持桌面与移动端响应式布局。
- 棉花糖默认私密，只有管理员显式设置公开后才能展示在用户端。

## 数据库与迁移

- 表结构定义位于 `db/schema.ts`。
- 版本化 SQL migration 位于 `drizzle/`，包括 SQL 文件和 `drizzle/meta/`。
- 所有数据库 DDL 必须为表和字段补充明确的 `COMMENT` 注释；生成 migration 后必须检查 SQL，确保新增或修改的表、字段注释没有遗漏。
- 修改 `db/schema.ts` 后运行：

```powershell
pnpm db:generate
```

- 必须提交生成的 migration 文件。
- 应用数据库变更使用：

```powershell
pnpm db:migrate
```

- 应用启动默认先执行尚未应用的数据库 migration；本地 `pnpm dev` 和 Docker 启动都必须遵守这一顺序。migration 失败时不得继续启动应用。
- 禁止使用 `drizzle-kit push` 作为生产或 Docker 部署的结构同步方式。
- 认证相关表必须与 Better Auth adapter 的字段要求保持兼容。

## 时间处理

- 所有时间、日期、时间戳、定时任务和日志统一使用东八区（`Asia/Shanghai`，`UTC+08:00`）。
- 数据库存储和查询不得隐式依赖服务器时区；涉及数据库时间字段时，必须明确转换和格式化策略。

## 常用命令

```powershell
pnpm install --frozen-lockfile
pnpm dev
pnpm typecheck
pnpm build
pnpm db:generate
pnpm db:migrate
```

## 文件与安全

- 环境变量只放在 `.env.local` 或部署密钥文件，不提交真实密钥。
- 不要把 `node_modules`、`.next`、构建产物或本地环境文件提交到 Git。
- 不要在此项目内引入 Java/JDBC 作为应用数据库驱动；如采用 Flyway，必须作为独立迁移服务。

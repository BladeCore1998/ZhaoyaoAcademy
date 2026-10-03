# Docker 部署

所有镜像均使用明确版本号，不使用 `latest`。首次启动：

```powershell
docker compose -f docker/docker-compose.yml up --build
```

Compose 文件使用了可选 `env_file`（`required: false`），建议使用 Docker Compose `2.24.0` 或更高版本。

启动时会先运行 `academy-migrate` 一次性服务，执行 `academy-front/drizzle/` 中尚未应用的 SQL migration；迁移成功后才启动 Next.js。迁移失败时，前端不会启动，便于在日志中定位数据库结构问题。

前端和 FastAPI 都把进程日志写到容器的 stdout/stderr，因此可以直接查看：

```powershell
docker compose -f docker/docker-compose.yml logs -f --tail=200 academy-front academy-py
docker compose -f docker/docker-compose.yml logs --tail=200 academy-migrate
```

这两个服务使用 Docker `json-file` 日志驱动，并限制单个文件为 `10m`、最多保留 `3` 个文件，避免容器日志无限增长。容器内时区显式设置为 `Asia/Shanghai`。Compose 会优先加载已存在的 `academy-front/.env`，不存在时回退到版本库中的 `.env.example`；生产环境仍应提供独立的密钥文件。

服务说明：

| 服务 | 固定版本 | 用途 |
| --- | --- | --- |
| `academy-front` | Node `22.14.0-alpine3.21` + pnpm `11.12.0` | Next.js 用户端、管理端和认证 |
| `academy-migrate` | 与前端相同的 Node/pnpm 构建阶段 | 启动前执行 Drizzle migration |
| `academy-py` | Python `3.12.8-slim` + Poetry `2.2.1` | FastAPI 路由骨架 |
| `mysql` | `8.4.6` | 账户和业务数据 |
| `redis` | `7.4.1-alpine` | 会话、限流和短期状态预留 |
| `minio` | `RELEASE.2025-09-07T16-13-09Z-cpuv1` | S3 兼容对象存储 |

生产环境请把 `.env.example` 替换为独立的密钥文件，并修改 MySQL、MinIO 和 Better Auth 密钥。

## 数据库变更

修改 `academy-front/db/schema.ts` 后，在前端目录生成 migration：

```powershell
cd academy-front
pnpm db:generate
```

将生成的 `drizzle/*.sql` 和 `drizzle/meta/*` 一并提交。不要在生产环境使用 `drizzle-kit push`，统一通过 Docker 的 `academy-migrate` 或以下命令执行：

```powershell
pnpm db:migrate
```

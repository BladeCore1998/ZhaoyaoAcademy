# Docker 部署

Docker Compose 已按职责拆成三个单项目文件：

```text
docker/
├── common/docker-compose.yml  # MySQL、Redis、MinIO 和共享网络
├── front/docker-compose.yml   # academy-front 和数据库迁移
└── py/docker-compose.yml      # academy-py
```

三个文件通过固定名称 `zhaoyao-academy-net` 连接。先启动公共服务，再按需启动前端和 Python 服务：

平台构建和部署脚本不放在 Compose 文件中，统一记录在 [`deploy/scripts/`](../deploy/scripts/)。脚本默认使用共享网络 `zhaoyao-academy-net`，具体参数和执行顺序见 [`deploy/README.md`](../deploy/README.md)。

```powershell
docker compose -f docker/common/docker-compose.yml up -d
docker compose -f docker/front/docker-compose.yml up -d --build
docker compose -f docker/py/docker-compose.yml up -d --build
```

前端 Compose 包含一次性 `academy-migrate` 服务。它会在 MySQL 可连接后反复执行 `pnpm db:migrate`，迁移成功后才启动 Next.js。停止某个单项目：

```powershell
docker compose -f docker/front/docker-compose.yml down
docker compose -f docker/py/docker-compose.yml down
docker compose -f docker/common/docker-compose.yml down
```

查看日志：

```powershell
docker compose -f docker/front/docker-compose.yml logs -f --tail=200 academy-front academy-migrate
docker compose -f docker/py/docker-compose.yml logs -f --tail=200 academy-py
docker compose -f docker/common/docker-compose.yml logs -f --tail=200 mysql redis minio
```

公共服务的卷使用固定名称，拆分 Compose 项目不会丢失本地数据。若要删除数据，需显式执行：

```powershell
docker compose -f docker/common/docker-compose.yml down -v
```

## 国内依赖源

- 前端 Docker 构建和 Jenkins 校验使用 `https://registry.npmmirror.com`。
- Alpine 系统包默认使用阿里云镜像，可通过 Docker 构建参数 `APK_MIRROR` 覆盖。
- Python Docker 构建、Jenkins 和 Poetry 项目源使用清华 PyPI 镜像 `https://pypi.tuna.tsinghua.edu.cn/simple`。
- Dockerfile 中的镜像版本均为明确版本，不使用 `latest`。

生产环境请将 `academy-front/.env.example` 复制为独立的密钥文件并修改默认账号、数据库密码、MinIO 密钥和 Better Auth 密钥。不要把真实 `.env` 文件提交到 Git。

## 服务地址

| 服务 | 地址 |
| --- | --- |
| Next.js 用户端和管理端 | <http://localhost:3000> |
| FastAPI 文档 | <http://localhost:8000/docs> |
| FastAPI 健康检查 | <http://localhost:8000/api/v1/health> |
| MySQL | `localhost:3306` |
| Redis | `localhost:6379` |
| MinIO API | <http://localhost:9000> |
| MinIO Console | <http://localhost:9001> |

## 数据库变更

修改 `academy-front/db/schema.ts` 后，在前端目录生成 migration：

```powershell
cd academy-front
pnpm db:generate
```

将生成的 `drizzle/*.sql` 和 `drizzle/meta/*` 一并提交。不要在生产环境使用 `drizzle-kit push`，统一通过前端 Compose 的 `academy-migrate` 或以下命令执行：

```powershell
pnpm db:migrate
```

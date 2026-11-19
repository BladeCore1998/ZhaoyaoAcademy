# Docker 部署

Docker Compose 已按职责拆成三个单项目文件：

```text
docker/
├── common/
│   ├── docker-compose.yml    # MySQL、Redis、RustFS 和共享网络
│   └── .env.example          # RustFS 账号密码
├── front/
│   ├── docker-compose.yml    # academy-front 和数据库迁移
│   └── .env.example          # 端口、认证和服务连接
└── py/
    ├── docker-compose.yml    # academy-py
    └── .env.example          # Python 服务宿主机端口
```

三个文件通过固定名称 `zhaoyao-academy-net` 连接。先启动公共服务，再按需启动前端和 Python 服务：

平台构建和部署脚本不放在 Compose 文件中，统一记录在 [`deploy/scripts/`](../deploy/scripts/)。脚本默认使用共享网络 `zhaoyao-academy-net`，具体参数和执行顺序见 [`deploy/README.md`](../deploy/README.md)。

三个 Compose 目录均提供 `.env.example`，复制为各自目录下的 `.env` 后按需修改。
不要提交真实 `.env`。以下命令从仓库根目录执行，仅在首次配置时复制，避免覆盖已有配置：

```powershell
Copy-Item docker/common/.env.example docker/common/.env
Copy-Item docker/front/.env.example docker/front/.env
Copy-Item docker/py/.env.example docker/py/.env
```

common 与 front 的 RustFS 账号密码须保持一致。前端认证密钥和 URL 位于
`docker/front/.env`；修改 `FRONT_PORT` 后应同步修改 `BETTER_AUTH_URL`。
前端应用和迁移服务均加载同目录 `.env`，覆盖 `academy-front/.env` 中的同名配置。
Compose 的端口和连接配置通过以下 `--env-file` 显式加载。

```powershell
docker compose --env-file docker/common/.env -f docker/common/docker-compose.yml up -d
docker compose --env-file docker/front/.env -f docker/front/docker-compose.yml up -d --build
docker compose --env-file docker/py/.env -f docker/py/docker-compose.yml up -d --build
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
docker compose -f docker/common/docker-compose.yml logs -f --tail=200 mysql redis rustfs
```

公共服务的卷使用固定名称，拆分 Compose 项目不会丢失本地数据。若要删除数据，需显式执行：

RustFS 使用独立卷 `zhaoyao-academy-rustfs-data` 保存对象数据。

```powershell
docker compose -f docker/common/docker-compose.yml down -v
```

## 国内依赖源

- 前端 Docker 构建和 Jenkins 校验使用 `https://registry.npmmirror.com`。
- Alpine 系统包默认使用阿里云镜像，可通过 Docker 构建参数 `APK_MIRROR` 覆盖。
- Python Docker 构建与本地 uv 共用 `academy-py/pyproject.toml` 中的清华 PyPI 镜像
  `https://pypi.tuna.tsinghua.edu.cn/simple`，通过 `uv.lock` 锁定依赖。
- Python 镜像固定使用 Python `3.12.8` 和 uv `0.11.3`，以 `uv sync --locked --no-dev`
  安装运行依赖；容器直接使用项目虚拟环境启动 Uvicorn。
- Dockerfile 中的镜像版本均为明确版本，不使用 `latest`。

Python 容器默认通过 `python -m app prod` 启动，Compose 显式设置 `ACADEMY_ENV=prod`。
该模式不注册 OpenAPI Schema、Swagger UI、ReDoc 及 OAuth 文档回调路由；
`/openapi.json`、`/docs`、`/redoc` 和 `/docs/oauth2-redirect` 均返回 404。
本地需要文档时，在 `academy-py` 目录使用 `uv run --locked python -m app dev`。

生产环境请使用独立的密钥文件并修改默认账号、数据库密码、RustFS 密钥和 Better Auth 密钥。不要把真实 `.env` 文件提交到 Git。

## 服务地址

| 服务 | 地址 |
| --- | --- |
| Next.js 用户端和管理端 | <http://localhost:3000> |
| FastAPI 文档（仅本地 dev） | <http://localhost:8000/docs>；默认 Docker prod 返回 404 |
| FastAPI 健康检查 | <http://localhost:8000/api/v1/health> |
| MySQL | `localhost:3306` |
| Redis | `localhost:6379` |
| RustFS API | <http://localhost:9000> |
| RustFS Console | <http://localhost:9001> |

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

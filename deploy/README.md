# 平台部署脚本

`deploy/scripts/` 保存平台构建脚本的仓库版本。平台可以直接复制脚本内容到构建任务中，也可以在服务器上执行脚本文件。脚本不包含真实密钥，生产环境的 `.env` 文件应由平台密钥管理或服务器上的独立文件提供。

## 文件用途

```text
deploy/
├── README.md
└── scripts/
    ├── migrate-academy-front.sh  # 构建迁移镜像并执行数据库迁移
    ├── academy-front.sh          # 构建并部署 Next.js（不执行迁移）
    └── academy-py.sh             # 构建并部署 FastAPI 服务
```

部署脚本都会：

- 从 `PROJECT_DIR` 指定的本地工程目录构建。
- 使用 `Asia/Shanghai` 生成镜像标签并设置容器时区。
- 使用固定 Docker 网络 `zhaoyao-academy-net`。
- 替换同名旧容器并执行部署后的健康检查。
- 失败时输出容器日志，便于平台收集构建日志。

前端部署脚本**不会自动执行数据库迁移**。表结构有变更时，必须先运行
`migrate-academy-front.sh`，再运行 `academy-front.sh`；顺序颠倒会让新代码运行在旧表结构上。

## 前置条件

公共服务和网络需要先启动：

```sh
docker compose -f docker/common/docker-compose.yml up -d
```

服务器上的工程目录应满足：

```text
/srv/apps/ZhaoyaoAcademy/.git
/srv/apps/ZhaoyaoAcademy/academy-front/Dockerfile
/srv/apps/ZhaoyaoAcademy/academy-front/.env
/srv/apps/ZhaoyaoAcademy/academy-py/Dockerfile
/srv/apps/ZhaoyaoAcademy/academy-py/pyproject.toml
/srv/apps/ZhaoyaoAcademy/academy-py/uv.lock
```

前端脚本会执行 `git -C "$PROJECT_DIR" pull --ff-only`，因此该目录必须是可快进更新的 Git 工作区。

Python 镜像内固定使用 uv `0.11.3`，按 `uv.lock` 安装依赖，不再使用 Poetry。
部署服务器只需提供 Docker，无需额外安装 uv；更新 Python 依赖时应先在开发环境
更新锁文件并通过 [Python 服务校验](../academy-py/README.md#依赖与校验)。

Python 部署使用 `python -m app prod`，脚本在可选环境文件之后显式传入
`ACADEMY_ENV=prod`，不会因 `.env` 中的开发设置开放文档。
生产环境 `/openapi.json`、`/docs`、`/redoc` 和 `/docs/oauth2-redirect` 返回 404；
健康检查继续使用 `/api/v1/health`。

## 平台参数

脚本通过环境变量配置，默认值如下：

| 变量 | 默认值 | 用途 |
| --- | --- | --- |
| `PROJECT_DIR` | `/srv/apps/ZhaoyaoAcademy` | 本地项目目录 |
| `DOCKER_NETWORK` | `zhaoyao-academy-net` | 应用和公共服务共享的 Docker 网络 |
| `IMAGE_TAG` | `YYYYMMDDHHMM` | 镜像标签，可由平台覆盖 |
| `PY_ENV_FILE` | `$PROJECT_DIR/academy-py/.env` | Python 服务可选环境文件 |

平台脚本不应把数据库密码、Better Auth 密钥或 RustFS 密钥写入命令行。前端运行时环境通过 `academy-front/.env` 传入。

## 手动执行

```sh
PROJECT_DIR=/srv/apps/ZhaoyaoAcademy \
DOCKER_NETWORK=zhaoyao-academy-net \
sh deploy/scripts/migrate-academy-front.sh

PROJECT_DIR=/srv/apps/ZhaoyaoAcademy \
DOCKER_NETWORK=zhaoyao-academy-net \
sh deploy/scripts/academy-front.sh

PROJECT_DIR=/srv/apps/ZhaoyaoAcademy \
DOCKER_NETWORK=zhaoyao-academy-net \
sh deploy/scripts/academy-py.sh
```

迁移脚本每次都会重新构建 `migrator` 镜像，因此 `drizzle/` 里的新 SQL 会随镜像一起生效。
没有新迁移时重复执行是安全的。

部署完成后：

- 前端健康检查：`http://127.0.0.1:3000/api/health`
- Python 健康检查：`http://127.0.0.1:8000/api/v1/health`

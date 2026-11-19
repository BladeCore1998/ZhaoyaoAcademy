# academy-py

FastAPI 中间件与算法转换服务骨架。当前只提供健康检查和预留路由，不承载业务功能。

## 本地开发

项目使用 Python `3.12.x` 和 uv `0.11.x`，通过 `uv.lock` 固定依赖版本。
uv 在项目目录创建独立的 `.venv`，无需激活 Conda 或手动激活虚拟环境。
`.python-version` 与 `requires-python` 共同限制 Python 版本，不使用 Python 3.13 及以上版本。

如果尚未安装 uv，可先安装本次验证使用的版本：

```powershell
python -m pip install "uv==0.11.3"
```

在 `academy-py` 目录执行；没有可用的 Python 3.12 时，可先运行 `uv python install 3.12`：

```powershell
uv sync --locked
uv run --locked python -m app dev
```

服务地址：

- API 文档：`http://localhost:8000/docs`
- ReDoc：`http://localhost:8000/redoc`
- OpenAPI Schema：`http://localhost:8000/openapi.json`
- 健康检查：`http://localhost:8000/api/v1/health`
- 路由清单：`http://localhost:8000/api/v1/routes`

本服务按非发布型应用管理，`package = false`，不需要构建或安装自身为 Python 包。

## 开发与生产模式

```powershell
# dev: hot reload, OpenAPI, Swagger UI and ReDoc enabled
uv run --locked python -m app dev

# prod: no hot reload, all documentation endpoints disabled
uv run --locked python -m app prod

# Optional production workers and bind address
uv run --locked python -m app prod --host 127.0.0.1 --port 8000 --workers 2
```

两种模式均默认监听 `0.0.0.0:8000`。dev 固定单 worker，prod 可通过
`--workers` 配置进程数。生产模式的 `/openapi.json`、`/docs`、`/redoc`
和 `/docs/oauth2-redirect` 均返回 404，现有 API 不受影响。

`app/config.py` 使用 Pydantic Settings 读取项目根目录 `.env` 和 `ACADEMY_ENV`，
支持 `dev` / `prod`，兼容 `development` / `production`。非法值会导致启动失败，
未配置时默认 `prod`。命令中的显式模式优先于环境变量和 `.env`，因此
`python -m app prod` 不会因残留的开发环境配置而开放文档。

如果直接使用 Uvicorn 或 IDE 的 ASGI 启动配置，应显式配置 `ACADEMY_ENV=dev`
才能访问 OpenAPI；可将 `.env.example` 复制为 `.env`。生产部署不应复制开发配置。
关闭文档不等于鉴权，API 的访问控制仍需按业务边界另行实现。

## 依赖与校验

清华 PyPI 镜像在 `pyproject.toml` 的 `[[tool.uv.index]]` 中配置为默认源，本地与 Docker 共用：

```text
https://pypi.tuna.tsinghua.edu.cn/simple
```

新增或移除依赖使用 `uv add`、`uv remove`；直接修改 `pyproject.toml` 后运行
`uv lock`。将 `pyproject.toml`、`.python-version` 和 `uv.lock` 一并纳入版本管理，
不再维护 `poetry.lock`。提交前执行：

```powershell
uv lock --check
uv sync --locked
uv pip check
uv run --locked python -m unittest discover -s tests -v
uv run --locked python -m compileall -q app tests
```

启动测试使用标准库 `unittest`，会在临时端口启动真实 Uvicorn 进程并在结束后关闭，
覆盖 dev/prod 健康检查、路由清单、开发文档可访问、生产文档不可访问及预留路由的
404 行为，同时检查环境配置与启动参数。

## Docker

镜像固定使用 Python `3.12.8` 和 uv `0.11.3`，构建时通过
`uv sync --locked --no-dev --no-install-project --no-cache` 安装运行依赖。
容器直接使用 `/app/.venv/bin` 中的 Uvicorn，启动时不重新解析或下载依赖，
时区固定为 `Asia/Shanghai`。

Docker 默认命令为 `python -m app prod`，Compose 和平台部署脚本也显式设置
`ACADEMY_ENV=prod`，默认不开放 OpenAPI 文档。需要开发文档时使用上面的本地 dev 命令。

从仓库根目录先启动公共服务，再启动 Python 单项目：

```powershell
docker compose -f docker/common/docker-compose.yml up -d
docker compose -f docker/py/docker-compose.yml up -d --build
```

## uv 迁移验证

2026-11-19（东八区）在 Windows、Python `3.12.4`、uv `0.11.3` 下验证：

- 按锁文件安装及重装依赖成功，`uv lock --check`、`uv pip check` 和编译检查通过。
- 真实 Uvicorn 启动测试 5 项全部通过；三个直接依赖的固定版本保持不变，
  间接依赖由 uv 重新解析并锁定。
- `uv run --locked uvicorn app.main:app --reload --host 127.0.0.1 --port 8000`
  实际启动成功，健康检查、路由清单、OpenAPI 和文档均返回 HTTP 200，验证后关闭进程。
- Linux x86_64 目标平台依赖安装预检查通过。
- 当前验证环境未安装 Docker，未执行实际镜像构建及容器启动。

## 环境模式验证

2026-11-19（东八区），在相同 Python 与 uv 版本下完成 18 项配置、命令和真实
HTTP 启动测试，dev 文档返回 200，prod 文档入口全部返回 404，业务路由保持正常。
另外实测 `python -m app dev` 的 WatchFiles 热重载入口与
`python -m app prod --workers 2` 的双 worker 启动，结果一致。
prod 在继承 `ACADEMY_ENV=development` 时仍关闭文档。验证进程已关闭；
Docker 因本机未安装而未执行实际容器验证。

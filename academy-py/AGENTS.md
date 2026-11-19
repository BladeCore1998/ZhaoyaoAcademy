# academy-py 局部规约

## 技术栈

- Python `3.12.x`，使用 uv 管理虚拟环境、依赖和锁文件。
- 必须提交 `pyproject.toml`、`.python-version` 和 `uv.lock`；项目使用 uv `0.11.x`，Docker 固定为 `0.11.3`。
- 本地使用项目内 `.venv`，无需激活 Conda；本服务不发布 Python 包，保留 `package = false`。
- FastAPI 只作为中间件与算法转换服务骨架；当前阶段不实现歌单、书单、棉花糖等业务功能。

## 路由边界

- 应用入口为 `app/main.py`。
- 使用 `uv run --locked python -m app dev` 或 `prod` 启动；只有 dev 开放 OpenAPI、Swagger UI 和 ReDoc。
- `ACADEMY_ENV` 未设置时默认 prod；Docker 和部署脚本必须使用 prod，禁止生产模式暴露文档和 Schema。
- 当前提供 `GET /api/v1/health` 和 `GET /api/v1/routes`。
- `/api/v1/transform` 与 `/api/v1/middleware` 仅作为后续能力预留，不要提前写业务逻辑。
- 新增路由必须放在明确的 router 模块中，并在 `app/main.py` 注册。

## 常用命令

```powershell
uv sync --locked
uv run --locked python -m app dev
uv run --locked python -m app prod
uv lock
uv lock --check
uv pip check
uv run --locked python -m unittest discover -s tests -v
uv run --locked python -m compileall -q app tests
```

## 文件与安全

- 默认编码为 UTF-8。
- 不提交 `.venv`、`__pycache__`、`.pytest_cache` 或真实 `.env` 文件。
- 不在此项目内复制 Next.js 认证逻辑；登录和会话由 `academy-front` 负责。

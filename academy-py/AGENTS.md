# academy-py 局部规约

## 技术栈

- Python `3.12.x`，本地默认使用 Conda 环境 `ZhaoyaoAcademy`。
- 使用 Poetry 管理依赖，必须提交 `pyproject.toml` 和 `poetry.lock`。
- FastAPI 只作为中间件与算法转换服务骨架；当前阶段不实现歌单、书单、棉花糖等业务功能。

## 路由边界

- 应用入口为 `app/main.py`。
- 当前提供 `GET /api/v1/health` 和 `GET /api/v1/routes`。
- `/api/v1/transform` 与 `/api/v1/middleware` 仅作为后续能力预留，不要提前写业务逻辑。
- 新增路由必须放在明确的 router 模块中，并在 `app/main.py` 注册。

## 常用命令

```powershell
conda activate ZhaoyaoAcademy
poetry install
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
poetry check
python -m compileall app
```

## 文件与安全

- 默认编码为 UTF-8。
- 不提交 `.venv`、`__pycache__`、`.pytest_cache` 或真实 `.env` 文件。
- 不在此项目内复制 Next.js 认证逻辑；登录和会话由 `academy-front` 负责。

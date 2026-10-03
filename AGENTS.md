# 招摇夭夭项目总规约

本文件只描述跨项目的共同约定。进入具体子项目后，必须继续阅读对应的局部规约：

- [academy-front/AGENTS.md](./academy-front/AGENTS.md)：Next.js、用户端、管理端、认证、Drizzle 和 pnpm。
- [academy-py/AGENTS.md](./academy-py/AGENTS.md)：Python 3.12、Poetry、FastAPI 和中间件路由。

## 总体结构

```text
/
├── academy-front/        # Next.js 全栈前端
├── academy-py/           # FastAPI 中间件/算法转换服务骨架
├── docker/               # Dockerfile 与 Compose 部署编排
├── docs/                 # 领域词汇与架构决策
├── CONTEXT.md            # 项目领域语言
└── AGENTS.md             # 本文件
```

## 跨项目约定

- 默认编码为 UTF-8。
- 所有涉及时间、日期、时间戳、定时任务和日志的实现统一使用东八区（`Asia/Shanghai`，`UTC+08:00`）；禁止依赖运行环境的本地时区。
- Docker 镜像和基础服务必须使用明确版本号，禁止使用 `latest`。
- 用户端根路径为 `/`，不使用 `/user` 前缀；管理端统一位于 `/admin`。
- 登录、退出、会话和权限入口由 `academy-front` 负责。
- 禁止 AI 自动执行 `git commit`、`git push`、创建 Pull Request 或合并分支。
- 需要提交时，必须由人类开发者明确执行并检查 diff。

## 本地启动

```powershell
docker compose -f docker/docker-compose.yml up --build
```

默认服务：

- Next.js：`http://localhost:3000`
- FastAPI：`http://localhost:8000/docs`
- MySQL：`localhost:3306`
- Redis：`localhost:6379`
- MinIO API：`http://localhost:9000`
- MinIO Console：`http://localhost:9001`

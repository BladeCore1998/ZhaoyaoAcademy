# 招摇书院

招摇书院是一个围绕虚拟主播“招摇夭夭”的古风内容社区。项目提供用户端内容浏览、官方歌单和书单收藏、棉花糖投递，以及管理员内容运营和私密投递处理能力。

项目当前采用单一 Next.js 应用承载用户端、管理端和认证流程，并配套一个 FastAPI 中间件服务骨架。歌单、书单属于官方内容；棉花糖默认私密，只有管理员明确设置公开后才会展示在用户端。

## 当前能力

- 用户端根路径 `/`，提供首页、歌单、书单、信箱和登录页面。
- 管理端统一位于 `/admin`，首版角色为 `user` 和 `admin`。
- Better Auth 负责登录、退出、会话和权限入口。
- Drizzle ORM 连接 MySQL，Redis 作为会话、限流和短期状态的预留存储。
- MinIO 提供 S3 兼容的头像、封面和附件存储。
- `academy-py` 当前仅提供 FastAPI 路由骨架、健康检查和预留路由。

## 项目结构

```text
.
├── academy-front/              # Next.js 全栈前端
│   ├── app/                    # App Router 页面、布局和认证 API
│   │   ├── (user)/             # 用户端页面，映射到根路径
│   │   └── admin/              # 管理端页面
│   ├── db/                     # Drizzle 数据库连接和表结构
│   ├── lib/                    # 认证、会话、Redis 等跨页面服务
│   ├── public/                 # 静态资源
│   ├── package.json            # pnpm 脚本和依赖
│   └── pnpm-lock.yaml          # 前端依赖锁定文件
├── academy-py/                 # FastAPI 中间件/算法转换服务骨架
│   ├── app/                    # FastAPI 应用和 API 路由
│   ├── pyproject.toml          # Poetry 项目配置
│   └── poetry.lock             # Python 依赖锁定文件
├── docker/
│   ├── common/docker-compose.yml # MySQL、Redis、MinIO 和共享网络
│   ├── front/docker-compose.yml  # academy-front 和数据库迁移
│   ├── py/docker-compose.yml     # academy-py
│   └── README.md                 # Docker 服务说明
├── deploy/
│   ├── scripts/                  # 平台构建与部署脚本
│   └── README.md                 # 平台脚本说明
├── docs/adr/                   # 架构决策记录
├── CONTEXT.md                  # 项目领域语言
├── AGENTS.md                   # 项目协作约定
├── LICENSE                     # Apache-2.0 许可证说明
└── README.md                  # 项目总览
```

## 快速启动

### 使用 Docker Compose

公共服务、前端和 Python 服务使用独立的 Compose 文件，先创建共享网络和公共服务：

```powershell
docker compose -f docker/common/docker-compose.yml up -d
docker compose -f docker/front/docker-compose.yml up -d --build
docker compose -f docker/py/docker-compose.yml up -d --build
```

停止服务时按相反顺序执行：

```powershell
docker compose -f docker/front/docker-compose.yml down
docker compose -f docker/py/docker-compose.yml down
docker compose -f docker/common/docker-compose.yml down
```

详细的 Compose 拆分、日志、数据卷和国内依赖源说明见 [Docker 部署说明](docker/README.md)。

平台配置脚本的仓库版本位于 [deploy/](deploy/)，其中分别提供前端和 Python 服务的构建、迁移、部署与健康检查脚本。使用方式和环境变量说明见 [平台部署脚本说明](deploy/README.md)。

默认服务地址：

| 服务 | 地址 | 用途 |
| --- | --- | --- |
| Next.js 用户端和管理端 | <http://localhost:3000> | Web 应用 |
| FastAPI 文档 | <http://localhost:8000/docs> | API 文档 |
| FastAPI 健康检查 | <http://localhost:8000/api/v1/health> | 服务状态 |
| MySQL | `localhost:3306` | 账户和业务数据 |
| Redis | `localhost:6379` | 会话和短期状态 |
| MinIO API | <http://localhost:9000> | 对象存储 API |
| MinIO Console | <http://localhost:9001> | 对象存储管理控制台 |

Docker Compose 使用开发环境默认凭据，仅适用于本地开发。生产环境应使用独立的密钥文件，并修改数据库、Redis、MinIO 和 Better Auth 配置。

## 本地开发

### 前端

要求 Node.js 22.x 和 pnpm 11.x。默认依赖源为 npmmirror：

```powershell
cd academy-front
pnpm install --frozen-lockfile
Copy-Item .env.example .env.local
pnpm dev
```

开发服务器默认运行在 <http://localhost:3000>。直接运行前端时，请确认 MySQL、Redis 和 MinIO 已启动，并根据本机地址调整 `.env.local`。

常用命令：

```powershell
pnpm build
pnpm start
pnpm db:generate
pnpm db:migrate
```

### FastAPI 服务

要求 Python 3.12 和 Poetry 2.x。项目已配置清华 PyPI 源：

```powershell
cd academy-py
poetry install
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

服务提供以下当前可用或预留路由：

- `GET /api/v1/health`：返回服务健康状态。
- `GET /api/v1/routes`：返回已登记的路由和预留能力。
- `/api/v1/transform`：算法转换能力预留。
- `/api/v1/middleware`：中间件能力预留。

## 配置说明

配置模板位于：

- `academy-front/.env.example`
- `academy-py/.env.example`

不要把真实密钥提交到仓库。Docker Compose 中的默认账号和密码仅用于本地开发。

## Jenkins

两个子项目各自包含可被 Jenkins Pipeline 直接识别的单项目流水线：

- 前端：`academy-front/Jenkinsfile`
- Python：`academy-py/Jenkinsfile`

在 Jenkins 中分别创建两个 Pipeline 任务，并将 Script Path 设置为对应路径。默认流水线执行依赖安装、校验和 Docker 构建；只有显式打开 `PUSH_IMAGE` 或 `DEPLOY` 参数时才会推送镜像或通过 SSH 部署。

## 领域边界

- 用户可以浏览公开内容、收藏官方歌单和书单，并投递棉花糖。
- 管理员负责维护官方内容、处理棉花糖，并决定私密投递是否公开。
- “处理完成”不等于“公开展示”。
- 用户收藏是私有关系，不会改变官方内容的公开状态。

## 相关文档

- [项目领域语言](CONTEXT.md)
- [协作约定](AGENTS.md)
- [架构决策记录](docs/adr/)
- [Docker 部署说明](docker/README.md)
- [许可证](LICENSE)

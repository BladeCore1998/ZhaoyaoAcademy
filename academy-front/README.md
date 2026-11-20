# academy-front

Next.js 用户端、管理端和认证服务。

## 依赖源

前端使用 pnpm `11.11.0`，项目 `.npmrc`、Dockerfile 和 Jenkinsfile 默认将 npm registry 设置为：

```text
https://registry.npmmirror.com
```

## 本地启动

在 `academy-front` 目录配置 `.env.local`，然后执行：

```powershell
pnpm install --frozen-lockfile
pnpm dev
```

开发模式先执行数据库迁移，再启动 Next.js。生产模式先构建，再启动：

```powershell
pnpm build
pnpm start
```

## Standalone 部署

`pnpm build` 会生成完整的 `.next/standalone` 目录，包含运行依赖、`public`、
`.next/static` 和启动脚本。部署时复制整个目录，在部署目录配置 `.env` 或
`.env.production.local`，也可以由运行环境注入配置。

进入部署目录后，两种启动方式均可使用：

```powershell
node server.js
```

```powershell
pnpm start
```

直接运行 `node server.js` 只需要 Node.js，无需安装 pnpm 或重新安装依赖。
两种方式均支持通过环境变量设置 `PORT` 和 `HOSTNAME`。

## Docker

从仓库根目录先启动公共服务，再启动前端单项目：

```powershell
docker compose -f docker/common/docker-compose.yml up -d
docker compose -f docker/front/docker-compose.yml up -d --build
```

前端 Compose 会先运行 `academy-migrate`，数据库迁移成功后才启动 Next.js。

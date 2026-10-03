# academy-front

Next.js 用户端、管理端和认证服务。

## 依赖源

前端使用 pnpm `11.12.0`，项目 `.npmrc`、Dockerfile 和 Jenkinsfile 默认将 npm registry 设置为：

```text
https://registry.npmmirror.com
```

## Docker

从仓库根目录先启动公共服务，再启动前端单项目：

```powershell
docker compose -f docker/common/docker-compose.yml up -d
docker compose -f docker/front/docker-compose.yml up -d --build
```

前端 Compose 会先运行 `academy-migrate`，数据库迁移成功后才启动 Next.js。

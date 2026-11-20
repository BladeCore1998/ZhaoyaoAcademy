# academy-front

Next.js 用户端、管理端和认证服务。

## 依赖源

前端使用 pnpm `11.11.0`，项目 `.npmrc`、Dockerfile 和 Jenkinsfile 默认将 npm registry 设置为：

```text
https://registry.npmmirror.com
```

## 本地启动

数据库、Redis 等连接配置写在 `academy-front/.env`，然后执行：

```powershell
pnpm install --frozen-lockfile
pnpm db:migrate    # 首次启动前建表；数据库为空时不可跳过
pnpm dev
```

本地直接运行时，`.env` 里的主机名要指向宿主机可达的地址（如 `127.0.0.1`）；
`.env.example` 中的 `mysql`、`redis`、`rustfs` 是 Compose 网络内的服务名。

`pnpm dev` 只启动 Next.js，不会自动执行数据库迁移。表结构变更后需手动生成并应用：

```powershell
pnpm db:generate   # 由 db/schema.ts 生成 drizzle/*.sql，然后手工补齐 COMMENT
pnpm db:lint       # 检查新增迁移的表/字段 COMMENT 与字符集
pnpm db:migrate    # 把未应用的迁移写入数据库
```

`pnpm db:check` 会对比 `db/schema.ts` 与 `drizzle/`，存在未生成的变更时失败，已接入
`pnpm check` 和 pre-commit。

生产模式先构建，再启动：

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

Standalone 产物不包含迁移 SQL 和 `drizzle-kit`，因此**无法在部署目录执行迁移**：

- 使用 Docker 时运行 `deploy/scripts/migrate-academy-front.sh`；
- 直接部署产物时，在仓库的 `academy-front` 目录执行 `pnpm db:migrate`（通过环境变量指向目标库）。

## Docker

从仓库根目录先启动公共服务，再启动前端单项目：

```powershell
docker compose -f docker/common/docker-compose.yml up -d
docker compose -f docker/front/docker-compose.yml up -d --build
```

前端 Compose 不包含自动迁移步骤，`up` 后直接启动 Next.js。需要应用数据库变更时，
手动运行一次迁移服务（`--build` 会把 `drizzle/` 里的新迁移打进镜像）：

```powershell
docker compose -f docker/front/docker-compose.yml run --rm --build academy-migrate
```

迁移中途失败的处理步骤见 [AGENTS.md](./AGENTS.md#迁移失败处理)：不要直接重跑，先核对
实际结构并手工补齐剩余语句。

## 抓取封面

`scripts/fetch-covers.ts` 会为缺少封面的歌曲和书籍抓取图片，校验通过后上传 RustFS，
并把 `/api/media/...` 地址回填到 `playlist.cover_url` / `booklist.cover_url`。

管理端 `/admin` 的歌单、书单页面也提供「解析封面」：列表行内可一键抓取并保存，编辑弹窗里的
按钮只回填「封面地址」，确认后再保存。两者都调用 `POST /api/admin/covers`（仅管理员可用），
解析结果会先上传 RustFS，再返回可直接使用的 `/api/media/...` 地址。

```powershell
pnpm covers:fetch                              # 预览，只抓取和校验，不上传、不写库
pnpm covers:fetch -- --type=song --limit=5     # 只处理 5 首歌曲
pnpm covers:fetch -- --apply                   # 上传 RustFS 并回填数据库
pnpm covers:fetch -- --apply --refresh         # 已有正式封面的记录也重抓
pnpm covers:fetch -- --region=global           # 强制按海外网络选择数据源顺序
```

数据源会先检测当前出口 IP 归属，再决定优先顺序：

- 国内网络：歌曲走网易云音乐 → iTunes → MusicBrainz；书籍走豆瓣读书 → iTunes → Open Library → Google Books。
- 海外网络：歌曲走 iTunes → MusicBrainz → 网易云音乐；书籍走 Open Library → Google Books → iTunes → 豆瓣读书。

检测失败时回退到国内优先；也可以用 `--region=cn|global` 手动指定。终端输出的候选标题和作者
统一转换为简体中文。

默认只处理 `cover_url` 为空或仍是 `/inspiration/*` 占位图的记录。国际源在部分网络下不可达时
会被自动跳过（Cover Art Archive 的图片实际由 archive.org 提供，Open Library 和 Google Books
也可能被阻断），可用 `--sources=netease,douban,itunes` 指定来源。MusicBrainz 需要可识别的
User-Agent，可用 `MUSICBRAINZ_USER_AGENT` 覆盖；国内源请求需要携带的 Referer 已内置。
想先肉眼检查图片，可加 `--out-dir=./tmp/covers` 保存本地副本。

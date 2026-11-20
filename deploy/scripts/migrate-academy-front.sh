#!/bin/sh
set -eu

# 手动执行前端数据库迁移。必须在 deploy/scripts/academy-front.sh 之前运行，
# 否则应用健康检查会因为存在未应用的迁移而失败。
PROJECT_DIR=${PROJECT_DIR:-/srv/apps/ZhaoyaoAcademy}
DOCKER_NETWORK=${DOCKER_NETWORK:-zhaoyao-academy-net}
IMAGE_TAG=${IMAGE_TAG:-$(TZ=Asia/Shanghai date '+%Y%m%d%H%M')}
MIGRATOR_IMAGE=${MIGRATOR_IMAGE:-academy-front-migrator:$IMAGE_TAG}
MIGRATOR_CONTAINER=${MIGRATOR_CONTAINER:-academy-front-migrate}
ENV_FILE=${ENV_FILE:-$PROJECT_DIR/academy-front/.env}

fail() {
  printf '%s\n' "错误：$*" >&2
  exit 1
}

case "$PROJECT_DIR" in
  /*) ;;
  *) fail "PROJECT_DIR 必须是绝对路径" ;;
esac

test -d "$PROJECT_DIR" || fail "项目目录不存在：$PROJECT_DIR"
test -d "$PROJECT_DIR/.git" || fail "项目目录不是 Git 工作区：$PROJECT_DIR"
test -f "$PROJECT_DIR/academy-front/Dockerfile" || fail "缺少 academy-front/Dockerfile"
test -s "$ENV_FILE" || fail "前端环境文件不存在或为空：$ENV_FILE"

# 迁移和部署都在同一份代码上执行：先拉取，保证迁移用的是待部署版本的 drizzle/。
git -C "$PROJECT_DIR" pull --ff-only

docker network inspect "$DOCKER_NETWORK" >/dev/null 2>&1 ||
  fail "Docker 网络不存在，请先启动公共服务：$DOCKER_NETWORK"

cleanup() {
  docker rm -f "$MIGRATOR_CONTAINER" >/dev/null 2>&1 || true
}
trap cleanup EXIT

printf '%s\n' "构建前端迁移镜像：$MIGRATOR_IMAGE"
docker build \
  --pull \
  --target migrator \
  --file "$PROJECT_DIR/academy-front/Dockerfile" \
  --tag "$MIGRATOR_IMAGE" \
  "$PROJECT_DIR/academy-front"

docker rm -f "$MIGRATOR_CONTAINER" >/dev/null 2>&1 || true
printf '%s\n' "执行数据库迁移"
docker run \
  --rm \
  --name "$MIGRATOR_CONTAINER" \
  --network "$DOCKER_NETWORK" \
  --env-file "$ENV_FILE" \
  --env TZ=Asia/Shanghai \
  --entrypoint sh \
  "$MIGRATOR_IMAGE" \
  -c '
    node -e '"'"'
      const net = require("net");
      const deadline = Date.now() + 120000;

      (function waitForMysql() {
        const socket = net.createConnection({ host: "mysql", port: 3306 });
        socket
          .on("connect", () => {
            socket.end();
            process.exit(0);
          })
          .on("error", () => {
            socket.destroy();
            if (Date.now() > deadline) process.exit(1);
            setTimeout(waitForMysql, 2000);
          });
      })();
    '"'"'
    pnpm db:migrate
  '

printf '%s\n' "数据库迁移完成"
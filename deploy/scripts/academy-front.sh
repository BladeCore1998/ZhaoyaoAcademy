#!/bin/sh
set -eu

PROJECT_DIR=${PROJECT_DIR:-/srv/apps/ZhaoyaoAcademy}
DOCKER_NETWORK=${DOCKER_NETWORK:-zhaoyao-academy-net}
IMAGE_TAG=${IMAGE_TAG:-$(TZ=Asia/Shanghai date '+%Y%m%d%H%M')}
APP_IMAGE=${APP_IMAGE:-academy-front:$IMAGE_TAG}
MIGRATOR_IMAGE=${MIGRATOR_IMAGE:-academy-front-migrator:$IMAGE_TAG}
APP_CONTAINER=${APP_CONTAINER:-academy-front}
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
test -f "$PROJECT_DIR/academy-front/package.json" || fail "缺少 academy-front/package.json"
test -f "$PROJECT_DIR/academy-front/pnpm-lock.yaml" || fail "缺少 academy-front/pnpm-lock.yaml"
test -s "$ENV_FILE" || fail "前端环境文件不存在或为空：$ENV_FILE"

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

printf '%s\n' "构建前端运行镜像：$APP_IMAGE"
docker build \
  --pull \
  --file "$PROJECT_DIR/academy-front/Dockerfile" \
  --tag "$APP_IMAGE" \
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

docker rm -f "$APP_CONTAINER" >/dev/null 2>&1 || true
docker create \
  --name "$APP_CONTAINER" \
  --restart unless-stopped \
  --network "$DOCKER_NETWORK" \
  --publish 3000:3000 \
  --env-file "$ENV_FILE" \
  --env TZ=Asia/Shanghai \
  "$APP_IMAGE" >/dev/null
docker start "$APP_CONTAINER" >/dev/null

for attempt in $(seq 1 12); do
  if docker exec "$APP_CONTAINER" node -e '
    fetch("http://127.0.0.1:3000/api/health")
      .then(async response => {
        const body = await response.text();
        if (response.status !== 200) {
          console.error(response.status, body);
          process.exit(1);
        }
      })
      .catch(error => {
        console.error(error);
        process.exit(1);
      });
  '; then
    printf '%s\n' "academy-front 健康检查通过：$APP_IMAGE"
    exit 0
  fi
  sleep 5
done

docker logs --tail 200 "$APP_CONTAINER" >&2 || true
exit 1

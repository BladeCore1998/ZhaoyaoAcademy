#!/bin/sh
set -eu

PROJECT_DIR=${PROJECT_DIR:-/srv/apps/ZhaoyaoAcademy}
DOCKER_NETWORK=${DOCKER_NETWORK:-zhaoyao-academy-net}
IMAGE_TAG=${IMAGE_TAG:-$(TZ=Asia/Shanghai date '+%Y%m%d%H%M')}
APP_IMAGE=${APP_IMAGE:-academy-front:$IMAGE_TAG}
APP_CONTAINER=${APP_CONTAINER:-academy-front}
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

# 本脚本只部署应用，不执行数据库迁移。
# 需要应用 drizzle/ 中的新迁移时，先运行 deploy/scripts/migrate-academy-front.sh。
printf '%s\n' "构建前端运行镜像：$APP_IMAGE"
docker build \
  --pull \
  --file "$PROJECT_DIR/academy-front/Dockerfile" \
  --tag "$APP_IMAGE" \
  "$PROJECT_DIR/academy-front"

docker rm -f "$APP_CONTAINER" >/dev/null 2>&1 || true
docker create \
  --name "$APP_CONTAINER" \
  --restart unless-stopped \
  --network "$DOCKER_NETWORK" \
  --publish 3000:3000 \
  --env-file "$ENV_FILE" \
  --env HOSTNAME=0.0.0.0 \
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
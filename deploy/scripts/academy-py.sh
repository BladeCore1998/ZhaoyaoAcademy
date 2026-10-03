#!/bin/sh
set -eu

PROJECT_DIR=${PROJECT_DIR:-/srv/apps/ZhaoyaoAcademy}
DOCKER_NETWORK=${DOCKER_NETWORK:-zhaoyao-academy-net}
IMAGE_TAG=${IMAGE_TAG:-$(TZ=Asia/Shanghai date '+%Y%m%d%H%M')}
APP_IMAGE=${APP_IMAGE:-academy-py:$IMAGE_TAG}
APP_CONTAINER=${APP_CONTAINER:-academy-py}
ENV_FILE=${PY_ENV_FILE:-$PROJECT_DIR/academy-py/.env}

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
test -f "$PROJECT_DIR/academy-py/Dockerfile" || fail "缺少 academy-py/Dockerfile"
test -f "$PROJECT_DIR/academy-py/pyproject.toml" || fail "缺少 academy-py/pyproject.toml"
test -f "$PROJECT_DIR/academy-py/poetry.lock" || fail "缺少 academy-py/poetry.lock"

git -C "$PROJECT_DIR" pull --ff-only
docker network inspect "$DOCKER_NETWORK" >/dev/null 2>&1 ||
  fail "Docker 网络不存在，请先启动公共服务：$DOCKER_NETWORK"

printf '%s\n' "构建 Python 镜像：$APP_IMAGE"
docker build \
  --pull \
  --file "$PROJECT_DIR/academy-py/Dockerfile" \
  --tag "$APP_IMAGE" \
  "$PROJECT_DIR/academy-py"

docker rm -f "$APP_CONTAINER" >/dev/null 2>&1 || true
if test -s "$ENV_FILE"; then
  docker create \
    --name "$APP_CONTAINER" \
    --restart unless-stopped \
    --network "$DOCKER_NETWORK" \
    --publish 8000:8000 \
    --env-file "$ENV_FILE" \
    --env TZ=Asia/Shanghai \
    "$APP_IMAGE" >/dev/null
else
  docker create \
    --name "$APP_CONTAINER" \
    --restart unless-stopped \
    --network "$DOCKER_NETWORK" \
    --publish 8000:8000 \
    --env TZ=Asia/Shanghai \
    "$APP_IMAGE" >/dev/null
fi
docker start "$APP_CONTAINER" >/dev/null

for attempt in $(seq 1 12); do
  if docker exec "$APP_CONTAINER" python -c '
    import json
    from urllib.request import urlopen

    with urlopen("http://127.0.0.1:8000/api/v1/health", timeout=3) as response:
        payload = json.load(response)
        if response.status != 200 or payload.get("status") != "ok":
            raise SystemExit(1)
  '; then
    printf '%s\n' "academy-py 健康检查通过：$APP_IMAGE"
    exit 0
  fi
  sleep 5
done

docker logs --tail 200 "$APP_CONTAINER" >&2 || true
exit 1

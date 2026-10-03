# academy-py

FastAPI 中间件与算法转换服务骨架。当前只提供健康检查和预留路由，不承载业务功能。

## 依赖源

项目通过 Poetry 配置清华 PyPI 镜像，Dockerfile 和 Jenkinsfile 也会显式使用：

```text
https://pypi.tuna.tsinghua.edu.cn/simple
```

## Docker

从仓库根目录先启动公共服务，再启动 Python 单项目：

```powershell
docker compose -f docker/common/docker-compose.yml up -d
docker compose -f docker/py/docker-compose.yml up -d --build
```

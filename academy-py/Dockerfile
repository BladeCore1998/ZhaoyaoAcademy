FROM python:3.12.8-slim
COPY --from=ghcr.io/astral-sh/uv:0.11.3 /uv /uvx /bin/
WORKDIR /app
ENV TZ=Asia/Shanghai
ENV ACADEMY_ENV=prod
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV UV_LINK_MODE=copy
ENV UV_PYTHON_DOWNLOADS=never
ENV PATH="/app/.venv/bin:$PATH"
RUN sed -i \
    -e 's|deb.debian.org/debian|mirrors.aliyun.com/debian|g' \
    -e 's|security.debian.org/debian-security|mirrors.aliyun.com/debian-security|g' \
    /etc/apt/sources.list.d/debian.sources
RUN apt-get update \
    && apt-get install -y --no-install-recommends tzdata \
    && rm -rf /var/lib/apt/lists/*
COPY pyproject.toml uv.lock ./
RUN uv sync --locked --no-dev --no-install-project --no-cache
COPY app ./app
EXPOSE 8000
CMD ["python", "-m", "app", "prod"]

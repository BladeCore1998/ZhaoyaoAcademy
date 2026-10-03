FROM node:22.14.0-alpine3.21 AS deps
WORKDIR /app
ENV TZ=Asia/Shanghai
RUN apk add --no-cache tzdata
RUN corepack enable && corepack prepare pnpm@11.12.0 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM node:22.14.0-alpine3.21 AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable && corepack prepare pnpm@11.12.0 --activate
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM deps AS migrator
WORKDIR /app
COPY . .
CMD ["pnpm", "db:migrate"]

FROM node:22.14.0-alpine3.21 AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV TZ=Asia/Shanghai
RUN apk add --no-cache tzdata
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]

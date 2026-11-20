import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { redisSecondaryStorage } from "@/lib/redis";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "mysql",
    schema,
  }),
  // 不固定 baseURL：Better Auth 会按每个请求的地址推导，
  // localhost、局域网 IP、域名访问都自动被视为合法来源。
  // 生产可能经 http 或 https 反向代理访问，不再对请求来源做额外校验。
  trustedOrigins: ["*"],
  secret: process.env.BETTER_AUTH_SECRET ?? "development-only-secret-change-before-production",
  // 生产环境可能以 http 或 https 访问；未设置 baseURL 时 Secure cookie
  // 会回退为"NODE_ENV 是 production"，导致 http 下浏览器丢弃会话，
  // 因此显式关闭，保证两种协议都能登录。
  advanced: {
    // 容器以 HOSTNAME=0.0.0.0 启动时 Next 会把 request.url 归一化成
    // http://0.0.0.0:3000，直接推导会得到错误的来源，所以必须信任
    // Next 从真实 Host 填充的 x-forwarded-host / x-forwarded-proto。
    trustedProxyHeaders: true,
    useSecureCookies: false,
  },
  secondaryStorage: redisSecondaryStorage,
  session: {
    // Redis is the online session source of truth. MySQL keeps a
    // preserved copy for audit and adapter compatibility, but is never
    // used as an online fallback when Redis misses or expires.
    storeSessionInDatabase: true,
    preserveSessionInDatabase: true,
  },
  verification: {
    storeInDatabase: true,
  },
  emailAndPassword: {
    enabled: true,
    revokeSessionsOnPasswordReset: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: false,
      },
    },
  },
});

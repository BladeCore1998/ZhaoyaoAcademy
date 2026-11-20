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
  secret: process.env.BETTER_AUTH_SECRET ?? "development-only-secret-change-before-production",
  // 生产环境可能以 http 或 https 访问；未设置 baseURL 时 Secure cookie
  // 会回退为"NODE_ENV 是 production"，导致 http 下浏览器丢弃会话，
  // 因此显式关闭，保证两种协议都能登录。
  advanced: {
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

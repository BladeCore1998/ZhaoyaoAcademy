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
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret:
    process.env.BETTER_AUTH_SECRET ??
    "development-only-secret-change-before-production",
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

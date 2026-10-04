import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

const globalForDb = globalThis as unknown as {
  pool?: mysql.Pool;
};

const pool =
  globalForDb.pool ?? mysql.createPool(process.env.DATABASE_URL ?? "mysql://academy:academy@127.0.0.1:3306/academy");

if (process.env.NODE_ENV !== "production") {
  globalForDb.pool = pool;
}

export const db = drizzle(pool);

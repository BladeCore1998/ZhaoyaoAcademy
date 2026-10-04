import { boolean, datetime, index, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const songStyles = ["流行", "古风", "抒情", "民谣", "中国风", "其他"] as const;
export const bookStatuses = ["未读", "在读", "已读"] as const;

export const user = mysqlTable("user", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: varchar("role", { length: 32 }).notNull().default("user"),
  createdAt: datetime("created_at").notNull(),
  updatedAt: datetime("updated_at").notNull(),
});

export const session = mysqlTable(
  "session",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    expiresAt: datetime("expires_at").notNull(),
    token: varchar("token", { length: 255 }).notNull().unique(),
    createdAt: datetime("created_at").notNull(),
    updatedAt: datetime("updated_at").notNull(),
    ipAddress: varchar("ip_address", { length: 255 }),
    userAgent: text("user_agent"),
    userId: varchar("user_id", { length: 36 }).notNull(),
  },
  (table) => [index("session_user_id_idx").on(table.userId)],
);

export const account = mysqlTable("account", {
  id: varchar("id", { length: 36 }).primaryKey(),
  accountId: varchar("account_id", { length: 255 }).notNull(),
  providerId: varchar("provider_id", { length: 255 }).notNull(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: datetime("access_token_expires_at"),
  refreshTokenExpiresAt: datetime("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: datetime("created_at").notNull(),
  updatedAt: datetime("updated_at").notNull(),
});

export const verification = mysqlTable("verification", {
  id: varchar("id", { length: 36 }).primaryKey(),
  identifier: varchar("identifier", { length: 255 }).notNull(),
  value: text("value").notNull(),
  expiresAt: datetime("expires_at").notNull(),
  createdAt: datetime("created_at"),
  updatedAt: datetime("updated_at"),
});

export const playlist = mysqlTable("playlist", {
  id: int("id").autoincrement().primaryKey(),
  songName: varchar("song_name", { length: 255 }).notNull(),
  artist: varchar("artist", { length: 255 }).notNull(),
  language: varchar("language", { length: 64 }).notNull(),
  style: mysqlEnum("style", songStyles).notNull(),
  summary: text("summary"),
  coverUrl: text("cover_url"),
  isPublished: boolean("is_published").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const booklist = mysqlTable("booklist", {
  id: int("id").autoincrement().primaryKey(),
  bookName: varchar("book_name", { length: 255 }).notNull(),
  author: varchar("author", { length: 255 }).notNull(),
  category: varchar("category", { length: 128 }).notNull(),
  country: varchar("country", { length: 128 }).notNull(),
  status: mysqlEnum("status", bookStatuses).notNull().default("未读"),
  summary: text("summary"),
  coverUrl: text("cover_url"),
  isPublished: boolean("is_published").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const marshmallow = mysqlTable("marshmallow", {
  id: int("id").autoincrement().primaryKey(),
  userId: varchar("user_id", { length: 36 }),
  content: text("content").notNull(),
  adminReply: text("admin_reply"),
  status: varchar("status", { length: 32 }).notNull().default("pending"),
  isPublic: boolean("is_public").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

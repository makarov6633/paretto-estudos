import { pgTable, text, timestamp, boolean, integer, jsonb } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified"),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

// --- Paretto Estudos content schema ---

export const item = pgTable("item", {
  id: text("id").primaryKey(), // use a stable id (e.g., slug or cuid)
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  language: text("language").notNull().default("pt-BR"),
  coverImageUrl: text("coverImageUrl"),
  pdfUrl: text("pdfUrl"),
  hasAudio: boolean("hasAudio").notNull().default(false),
  hasPdf: boolean("hasPdf").notNull().default(false),
  tags: jsonb("tags"),
  readingMinutes: integer("readingMinutes"),
  audioMinutes: integer("audioMinutes"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const summarySection = pgTable("summary_section", {
  id: text("id").primaryKey(),
  itemId: text("itemId")
    .notNull()
    .references(() => item.id, { onDelete: "cascade" }),
  orderIndex: integer("orderIndex").notNull(),
  heading: text("heading"),
  contentHtml: text("contentHtml"),
});

export const audioTrack = pgTable("audio_track", {
  id: text("id").primaryKey(),
  itemId: text("itemId")
    .notNull()
    .references(() => item.id, { onDelete: "cascade" }),
  voice: text("voice"),
  language: text("language"),
  audioUrl: text("audioUrl").notNull(),
  durationMs: integer("durationMs"),
});

export const syncMap = pgTable("sync_map", {
  id: text("id").primaryKey(),
  itemId: text("itemId")
    .notNull()
    .references(() => item.id, { onDelete: "cascade" }),
  granularity: text("granularity"), // 'line' | 'word'
  data: jsonb("data"), // WebVTT/JSON parsed structure
});

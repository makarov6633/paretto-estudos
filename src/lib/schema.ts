import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";

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
  hasPdf: boolean("hasPdf").notNull().default(false),
  tags: jsonb("tags"),
  readingMinutes: integer("readingMinutes"),
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

// --- Personalization ---

export const userPreference = pgTable("user_preference", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  tag: text("tag").notNull(),
  weight: integer("weight").notNull().default(0),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const readingEvent = pgTable("reading_event", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  itemId: text("itemId")
    .notNull()
    .references(() => item.id, { onDelete: "cascade" }),
  event: text("event").notNull(), // 'open' | 'play' | 'finish'
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

// --- Book Requests ---
export const bookRequest = pgTable("book_request", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  author: text("author"),
  sourceUrl: text("sourceUrl"),
  notes: text("notes"),
  status: text("status").notNull().default("pending"), // 'pending' | 'fulfilled' | 'rejected'
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// --- Subscriptions ---
export const subscription = pgTable(
  "subscription",
  {
    id: text("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: text("status").notNull(), // 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'unpaid'
    currentPeriodEnd: timestamp("currentPeriodEnd"),
    stripeCustomerId: text("stripeCustomerId"),
    stripeSubscriptionId: text("stripeSubscriptionId"),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => ({
    userUnique: uniqueIndex("subscription_user_unique").on(table.userId),
  }),
);

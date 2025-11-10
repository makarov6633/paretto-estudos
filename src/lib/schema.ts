import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  uniqueIndex,
  primaryKey,
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

// Gamification tables
export const userGamification = pgTable("user_gamification", {
  userId: text("userId")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  totalPoints: integer("totalPoints").notNull().default(0),
  currentStreak: integer("currentStreak").notNull().default(0),
  longestStreak: integer("longestStreak").notNull().default(0),
  lastStudyDate: timestamp("lastStudyDate"),
  level: integer("level").notNull().default(1),
  itemsRead: integer("itemsRead").notNull().default(0),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const badgeDefinition = pgTable("badge_definition", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(), // emoji or icon name
  category: text("category").notNull(), // 'milestone', 'streak', 'achievement', 'special'
  requirement: jsonb("requirement").notNull(), // { type: 'points', value: 1000 } or { type: 'streak', value: 7 }
  points: integer("points").notNull().default(0), // bonus points for earning badge
  rarity: text("rarity").notNull().default("common"), // 'common', 'rare', 'epic', 'legendary'
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const userBadge = pgTable(
  "user_badge",
  {
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    badgeId: text("badgeId")
      .notNull()
      .references(() => badgeDefinition.id, { onDelete: "cascade" }),
    earnedAt: timestamp("earnedAt").notNull().defaultNow(),
    seen: boolean("seen").notNull().default(false), // for notifications
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.badgeId] }),
  })
);

// Reading progress tracking
export const readingProgress = pgTable(
  "reading_progress",
  {
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    itemId: text("itemId")
      .notNull()
      .references(() => item.id, { onDelete: "cascade" }),
    scrollProgress: integer("scrollProgress").notNull().default(0), // percentage 0-100
    currentSectionIndex: integer("currentSectionIndex").notNull().default(0),
    lastReadAt: timestamp("lastReadAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.itemId] }),
  })
);

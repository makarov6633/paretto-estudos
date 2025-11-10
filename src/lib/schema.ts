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

// --- Study Features: Checklists, Quizzes, Notes ---

export const checklist = pgTable("checklist", {
  id: text("id").primaryKey(),
  itemId: text("itemId")
    .notNull()
    .references(() => item.id, { onDelete: "cascade" }),
  orderIndex: integer("orderIndex").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const userChecklistProgress = pgTable("user_checklist_progress", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  checklistId: text("checklistId")
    .notNull()
    .references(() => checklist.id, { onDelete: "cascade" }),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completedAt"),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const quizQuestion = pgTable("quiz_question", {
  id: text("id").primaryKey(),
  itemId: text("itemId")
    .notNull()
    .references(() => item.id, { onDelete: "cascade" }),
  orderIndex: integer("orderIndex").notNull(),
  question: text("question").notNull(),
  options: jsonb("options").notNull(), // Array of strings
  correctAnswer: integer("correctAnswer").notNull(), // Index of correct option
  explanation: text("explanation"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const quizAnswer = pgTable("quiz_answer", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  questionId: text("questionId")
    .notNull()
    .references(() => quizQuestion.id, { onDelete: "cascade" }),
  selectedAnswer: integer("selectedAnswer").notNull(),
  isCorrect: boolean("isCorrect").notNull(),
  attemptedAt: timestamp("attemptedAt").notNull().defaultNow(),
});

export const userNote = pgTable("user_note", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  itemId: text("itemId")
    .notNull()
    .references(() => item.id, { onDelete: "cascade" }),
  sectionId: text("sectionId").references(() => summarySection.id, {
    onDelete: "set null",
  }),
  content: text("content").notNull(),
  isStructured: boolean("isStructured").notNull().default(false),
  tags: jsonb("tags"), // Array of strings for categorization
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const studySession = pgTable("study_session", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  itemId: text("itemId")
    .notNull()
    .references(() => item.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'reading' | 'quiz' | 'notes' | 'checklist'
  duration: integer("duration"), // in seconds
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

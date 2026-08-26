import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const relationProposals = mysqlTable("relationProposals", {
  id: int("id").autoincrement().primaryKey(),
  sourceActor: varchar("sourceActor", { length: 120 }).notNull(),
  targetActor: varchar("targetActor", { length: 120 }).notNull(),
  relationType: varchar("relationType", { length: 64 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  detail: text("detail").notNull(),
  sourceUrl: varchar("sourceUrl", { length: 1000 }).notNull(),
  startYear: int("startYear"),
  endYear: int("endYear"),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  submitterId: int("submitterId").notNull().references(() => users.id),
  reviewerId: int("reviewerId").references(() => users.id),
  reviewNote: text("reviewNote"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RelationProposal = typeof relationProposals.$inferSelect;
export type InsertRelationProposal = typeof relationProposals.$inferInsert;

export const snapshotCollections = mysqlTable("snapshotCollections", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull().references(() => users.id),
  name: varchar("name", { length: 160 }).notNull(),
  shareKey: varchar("shareKey", { length: 64 }).notNull().unique(),
  visibility: mysqlEnum("visibility", ["private", "shared"]).default("private").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const snapshotCollectionItems = mysqlTable("snapshotCollectionItems", {
  id: int("id").autoincrement().primaryKey(),
  collectionId: int("collectionId").notNull().references(() => snapshotCollections.id),
  label: varchar("label", { length: 160 }).notNull(),
  snapshotJson: text("snapshotJson").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SnapshotCollection = typeof snapshotCollections.$inferSelect;
export type InsertSnapshotCollection = typeof snapshotCollections.$inferInsert;
export type SnapshotCollectionItem = typeof snapshotCollectionItems.$inferSelect;
export type InsertSnapshotCollectionItem = typeof snapshotCollectionItems.$inferInsert;

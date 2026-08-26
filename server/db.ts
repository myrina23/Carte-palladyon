import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertRelationProposal, InsertUser, relationProposals, snapshotCollectionItems, snapshotCollections, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createRelationProposal(input: InsertRelationProposal) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(relationProposals).values(input);
}

export async function listRelationProposalsBySubmitter(submitterId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(relationProposals).where(eq(relationProposals.submitterId, submitterId)).orderBy(desc(relationProposals.createdAt));
}

export async function listPendingRelationProposals() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(relationProposals).where(eq(relationProposals.status, "pending")).orderBy(desc(relationProposals.createdAt));
}

export async function reviewRelationProposal(id: number, reviewerId: number, status: "approved" | "rejected", reviewNote?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(relationProposals).set({ status, reviewerId, reviewNote: reviewNote || null, reviewedAt: new Date() }).where(eq(relationProposals.id, id));
}

export async function createSnapshotCollection(input: { ownerId: number; name: string; shareKey: string; visibility: "private" | "shared" }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(snapshotCollections).values(input);
  return Number(result[0].insertId);
}

export async function addSnapshotCollectionItem(input: { collectionId: number; label: string; snapshotJson: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(snapshotCollectionItems).values(input);
}

export async function listSnapshotCollectionsByOwner(ownerId: number) {
  const db = await getDb();
  if (!db) return [];
  const collections = await db.select().from(snapshotCollections).where(eq(snapshotCollections.ownerId, ownerId)).orderBy(desc(snapshotCollections.updatedAt));
  const collectionIds = collections.map((collection) => collection.id);
  const items = collectionIds.length ? await db.select().from(snapshotCollectionItems).orderBy(desc(snapshotCollectionItems.createdAt)) : [];
  return collections.map((collection) => ({ ...collection, items: items.filter((item) => item.collectionId === collection.id) }));
}

export async function getSharedSnapshotCollection(shareKey: string) {
  const db = await getDb();
  if (!db) return undefined;
  const collections = await db.select().from(snapshotCollections).where(and(eq(snapshotCollections.shareKey, shareKey), eq(snapshotCollections.visibility, "shared"))).limit(1);
  const collection = collections[0];
  if (!collection) return undefined;
  const items = await db.select().from(snapshotCollectionItems).where(eq(snapshotCollectionItems.collectionId, collection.id)).orderBy(desc(snapshotCollectionItems.createdAt));
  return { ...collection, items };
}

export async function deleteSnapshotCollection(ownerId: number, collectionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const owned = await db.select({ id: snapshotCollections.id }).from(snapshotCollections).where(and(eq(snapshotCollections.id, collectionId), eq(snapshotCollections.ownerId, ownerId))).limit(1);
  if (!owned[0]) throw new Error("Collection not found");
  await db.delete(snapshotCollectionItems).where(eq(snapshotCollectionItems.collectionId, collectionId));
  await db.delete(snapshotCollections).where(eq(snapshotCollections.id, collectionId));
}

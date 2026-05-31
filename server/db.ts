import { eq, desc, and, sql, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  creditReports, InsertCreditReport, CreditReport,
  disputeCandidates, InsertDisputeCandidate, DisputeCandidate,
  disputeLetters, InsertDisputeLetter, DisputeLetter,
  mailPackets, InsertMailPacket, MailPacket,
  followUpRounds, InsertFollowUpRound, FollowUpRound,
  auditLogs, InsertAuditLog, AuditLog,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

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

// ─── User Helpers ───────────────────────────────────────────────────────────

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
    const values: InsertUser = { openId: user.openId };
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

    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

// ─── Credit Report Helpers ──────────────────────────────────────────────────

export async function createCreditReport(report: InsertCreditReport) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(creditReports).values(report);
  return { id: result[0].insertId };
}

export async function getCreditReportById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(creditReports).where(eq(creditReports.id, id)).limit(1);
  return result[0];
}

export async function getUserCreditReports(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(creditReports).where(eq(creditReports.userId, userId)).orderBy(desc(creditReports.uploadedAt));
}

export async function updateCreditReport(id: number, data: Partial<InsertCreditReport>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(creditReports).set(data).where(eq(creditReports.id, id));
}

// ─── Dispute Candidate Helpers ──────────────────────────────────────────────

export async function createDisputeCandidates(candidates: InsertDisputeCandidate[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (candidates.length === 0) return;
  await db.insert(disputeCandidates).values(candidates);
}

export async function getDisputeCandidatesByReport(reportId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(disputeCandidates).where(eq(disputeCandidates.reportId, reportId)).orderBy(desc(disputeCandidates.confidenceScore));
}

export async function getDisputeCandidatesByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(disputeCandidates).where(eq(disputeCandidates.userId, userId)).orderBy(desc(disputeCandidates.createdAt));
}

export async function getDisputeCandidateById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(disputeCandidates).where(eq(disputeCandidates.id, id)).limit(1);
  return result[0];
}

export async function updateDisputeCandidate(id: number, data: Partial<InsertDisputeCandidate>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(disputeCandidates).set(data).where(eq(disputeCandidates.id, id));
}

export async function getAllDisputeCandidates() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(disputeCandidates).orderBy(desc(disputeCandidates.createdAt));
}

// ─── Dispute Letter Helpers ─────────────────────────────────────────────────

export async function createDisputeLetter(letter: InsertDisputeLetter) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(disputeLetters).values(letter);
  return { id: result[0].insertId };
}

export async function getDisputeLetterById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(disputeLetters).where(eq(disputeLetters.id, id)).limit(1);
  return result[0];
}

export async function getUserDisputeLetters(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(disputeLetters).where(eq(disputeLetters.userId, userId)).orderBy(desc(disputeLetters.createdAt));
}

export async function updateDisputeLetter(id: number, data: Partial<InsertDisputeLetter>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(disputeLetters).set(data).where(eq(disputeLetters.id, id));
}

export async function getAllDisputeLetters() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(disputeLetters).orderBy(desc(disputeLetters.createdAt));
}

// ─── Mail Packet Helpers ────────────────────────────────────────────────────

export async function createMailPacket(packet: InsertMailPacket) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(mailPackets).values(packet);
  return { id: result[0].insertId };
}

export async function getMailPacketById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(mailPackets).where(eq(mailPackets.id, id)).limit(1);
  return result[0];
}

export async function getUserMailPackets(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(mailPackets).where(eq(mailPackets.userId, userId)).orderBy(desc(mailPackets.createdAt));
}

export async function updateMailPacket(id: number, data: Partial<InsertMailPacket>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(mailPackets).set(data).where(eq(mailPackets.id, id));
}

export async function getAllMailPackets() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(mailPackets).orderBy(desc(mailPackets.createdAt));
}

export async function getMailQueue() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(mailPackets).where(
    inArray(mailPackets.status, ["queued", "processing"])
  ).orderBy(desc(mailPackets.createdAt));
}

// ─── Follow-Up Round Helpers ────────────────────────────────────────────────

export async function createFollowUpRound(round: InsertFollowUpRound) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(followUpRounds).values(round);
  return { id: result[0].insertId };
}

export async function getUserFollowUpRounds(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(followUpRounds).where(eq(followUpRounds.userId, userId)).orderBy(desc(followUpRounds.scheduledDate));
}

export async function getFollowUpRoundsByCandidate(candidateId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(followUpRounds).where(eq(followUpRounds.candidateId, candidateId)).orderBy(desc(followUpRounds.scheduledDate));
}

export async function updateFollowUpRound(id: number, data: Partial<InsertFollowUpRound>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(followUpRounds).set(data).where(eq(followUpRounds.id, id));
}

// ─── Audit Log Helpers ──────────────────────────────────────────────────────

export async function createAuditLog(log: InsertAuditLog) {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditLogs).values(log);
}

export async function getAuditLogs(limit = 100, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit).offset(offset);
}

export async function getAuditLogsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(auditLogs).where(eq(auditLogs.userId, userId)).orderBy(desc(auditLogs.createdAt));
}

export async function getAuditLogCount() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(auditLogs);
  return result[0]?.count ?? 0;
}

// ─── Dashboard Stats ────────────────────────────────────────────────────────

export async function getDashboardStats(userId: number) {
  const db = await getDb();
  if (!db) return { reports: 0, candidates: 0, letters: 0, mailPackets: 0 };

  const [reports, candidates, letters, packets] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(creditReports).where(eq(creditReports.userId, userId)),
    db.select({ count: sql<number>`count(*)` }).from(disputeCandidates).where(eq(disputeCandidates.userId, userId)),
    db.select({ count: sql<number>`count(*)` }).from(disputeLetters).where(eq(disputeLetters.userId, userId)),
    db.select({ count: sql<number>`count(*)` }).from(mailPackets).where(eq(mailPackets.userId, userId)),
  ]);

  return {
    reports: reports[0]?.count ?? 0,
    candidates: candidates[0]?.count ?? 0,
    letters: letters[0]?.count ?? 0,
    mailPackets: packets[0]?.count ?? 0,
  };
}

export async function getAdminStats() {
  const db = await getDb();
  if (!db) return { users: 0, reports: 0, candidates: 0, letters: 0, mailPackets: 0, auditLogs: 0 };

  const [userCount, reportCount, candidateCount, letterCount, packetCount, logCount] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(users),
    db.select({ count: sql<number>`count(*)` }).from(creditReports),
    db.select({ count: sql<number>`count(*)` }).from(disputeCandidates),
    db.select({ count: sql<number>`count(*)` }).from(disputeLetters),
    db.select({ count: sql<number>`count(*)` }).from(mailPackets),
    db.select({ count: sql<number>`count(*)` }).from(auditLogs),
  ]);

  return {
    users: userCount[0]?.count ?? 0,
    reports: reportCount[0]?.count ?? 0,
    candidates: candidateCount[0]?.count ?? 0,
    letters: letterCount[0]?.count ?? 0,
    mailPackets: packetCount[0]?.count ?? 0,
    auditLogs: logCount[0]?.count ?? 0,
  };
}

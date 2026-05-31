import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json, decimal } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
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

/**
 * Credit reports uploaded by users.
 */
export const creditReports = mysqlTable("credit_reports", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  fileName: varchar("fileName", { length: 512 }).notNull(),
  fileKey: varchar("fileKey", { length: 1024 }).notNull(),
  fileUrl: varchar("fileUrl", { length: 2048 }).notNull(),
  extractedText: text("extractedText"),
  status: mysqlEnum("status", ["uploaded", "processing", "parsed", "analyzed", "error"]).default("uploaded").notNull(),
  bureausFound: json("bureausFound").$type<string[]>(),
  errorMessage: text("errorMessage"),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
  processedAt: timestamp("processedAt"),
});

export type CreditReport = typeof creditReports.$inferSelect;
export type InsertCreditReport = typeof creditReports.$inferInsert;

/**
 * Individual dispute candidates identified from credit reports.
 */
export const disputeCandidates = mysqlTable("dispute_candidates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  reportId: int("reportId").notNull(),
  bureau: varchar("bureau", { length: 64 }).notNull(),
  furnisher: varchar("furnisher", { length: 256 }).notNull(),
  accountName: varchar("accountName", { length: 256 }).notNull(),
  accountNumber: varchar("accountNumber", { length: 128 }),
  issueType: varchar("issueType", { length: 128 }).notNull(),
  disputeReason: text("disputeReason").notNull(),
  confidenceScore: decimal("confidenceScore", { precision: 5, scale: 2 }).notNull(),
  evidenceChecklist: json("evidenceChecklist").$type<string[]>(),
  riskFlag: mysqlEnum("riskFlag", ["low", "medium", "high"]).default("low").notNull(),
  complianceFlag: boolean("complianceFlag").default(true).notNull(),
  recommendedRound: int("recommendedRound").default(1).notNull(),
  deadlineStatus: mysqlEnum("deadlineStatus", ["pending", "active", "approaching", "overdue", "resolved"]).default("pending").notNull(),
  userStatus: mysqlEnum("userStatus", ["pending_review", "approved", "rejected", "edited"]).default("pending_review").notNull(),
  userNotes: text("userNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DisputeCandidate = typeof disputeCandidates.$inferSelect;
export type InsertDisputeCandidate = typeof disputeCandidates.$inferInsert;

/**
 * Generated dispute letters.
 */
export const disputeLetters = mysqlTable("dispute_letters", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  candidateId: int("candidateId").notNull(),
  bureau: varchar("bureau", { length: 64 }).notNull(),
  furnisher: varchar("furnisher", { length: 256 }).notNull(),
  letterContent: text("letterContent").notNull(),
  letterPdfKey: varchar("letterPdfKey", { length: 1024 }),
  letterPdfUrl: varchar("letterPdfUrl", { length: 2048 }),
  status: mysqlEnum("status", ["draft", "pending_review", "approved", "sent", "delivered", "responded"]).default("draft").notNull(),
  disputeRound: int("disputeRound").default(1).notNull(),
  approvedAt: timestamp("approvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DisputeLetter = typeof disputeLetters.$inferSelect;
export type InsertDisputeLetter = typeof disputeLetters.$inferInsert;

/**
 * Mail packets for certified mail delivery.
 */
export const mailPackets = mysqlTable("mail_packets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  letterId: int("letterId").notNull(),
  provider: varchar("provider", { length: 64 }).default("mock").notNull(),
  recipientName: varchar("recipientName", { length: 256 }).notNull(),
  recipientAddress: text("recipientAddress").notNull(),
  trackingNumber: varchar("trackingNumber", { length: 128 }),
  dateSent: timestamp("dateSent"),
  deadline: timestamp("deadline"),
  deliveryResult: mysqlEnum("deliveryResult", ["pending", "in_transit", "delivered", "returned", "failed"]).default("pending").notNull(),
  responseReceived: boolean("responseReceived").default(false).notNull(),
  responseDate: timestamp("responseDate"),
  responseNotes: text("responseNotes"),
  letterPdfKey: varchar("letterPdfKey", { length: 1024 }),
  letterPdfUrl: varchar("letterPdfUrl", { length: 2048 }),
  status: mysqlEnum("status", ["queued", "processing", "sent", "delivered", "failed", "cancelled"]).default("queued").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MailPacket = typeof mailPackets.$inferSelect;
export type InsertMailPacket = typeof mailPackets.$inferInsert;

/**
 * Follow-up rounds scheduled after response windows.
 */
export const followUpRounds = mysqlTable("follow_up_rounds", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  candidateId: int("candidateId").notNull(),
  letterId: int("letterId"),
  roundNumber: int("roundNumber").notNull(),
  scheduledDate: timestamp("scheduledDate").notNull(),
  status: mysqlEnum("status", ["scheduled", "ready", "in_progress", "completed", "cancelled"]).default("scheduled").notNull(),
  triggerReason: text("triggerReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FollowUpRound = typeof followUpRounds.$inferSelect;
export type InsertFollowUpRound = typeof followUpRounds.$inferInsert;

/**
 * Audit log for compliance tracking.
 */
export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  action: varchar("action", { length: 128 }).notNull(),
  entityType: varchar("entityType", { length: 64 }).notNull(),
  entityId: int("entityId"),
  details: json("details").$type<Record<string, unknown>>(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

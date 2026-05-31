import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { storagePut } from "./storage";
import { analyzeCreditReport, generateDisputeLetter } from "./disputeEngine";
import { getMailProvider } from "./mailProvider";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Dashboard ──────────────────────────────────────────────────────────────

  dashboard: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      return db.getDashboardStats(ctx.user.id);
    }),
  }),

  // ─── Credit Reports ─────────────────────────────────────────────────────────

  reports: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserCreditReports(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const report = await db.getCreditReportById(input.id);
        if (!report || report.userId !== ctx.user.id) {
          throw new Error("Report not found");
        }
        return report;
      }),

    upload: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileData: z.string(), // base64 encoded
        mimeType: z.string().default("application/pdf"),
      }))
      .mutation(async ({ ctx, input }) => {
        // Server-side validation
        if (input.mimeType !== "application/pdf") {
          throw new Error("Only PDF files are accepted");
        }
        if (!input.fileName.toLowerCase().endsWith(".pdf")) {
          throw new Error("File must have a .pdf extension");
        }

        // Decode base64 file
        const buffer = Buffer.from(input.fileData, "base64");

        // Validate file size (16MB max)
        if (buffer.length > 16 * 1024 * 1024) {
          throw new Error("File size must be under 16MB");
        }

        // Validate PDF magic bytes (%PDF-)
        const pdfHeader = buffer.slice(0, 5).toString("ascii");
        if (!pdfHeader.startsWith("%PDF-")) {
          throw new Error("Invalid PDF file: file does not have valid PDF header");
        }

        // Store file in S3
        const fileKey = `reports/${ctx.user.id}/${Date.now()}-${input.fileName}`;
        const { key, url } = await storagePut(fileKey, buffer, input.mimeType);

        // Create report record
        const { id } = await db.createCreditReport({
          userId: ctx.user.id,
          fileName: input.fileName,
          fileKey: key,
          fileUrl: url,
          status: "uploaded",
        });

        // Log the upload
        await db.createAuditLog({
          userId: ctx.user.id,
          action: "report_uploaded",
          entityType: "credit_report",
          entityId: id,
          details: { fileName: input.fileName },
        });

        return { id, fileUrl: url };
      }),

    parse: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const report = await db.getCreditReportById(input.id);
        if (!report || report.userId !== ctx.user.id) {
          throw new Error("Report not found");
        }

        // Update status to processing
        await db.updateCreditReport(input.id, { status: "processing" });

        try {
          // Use LLM with file_url to extract text from PDF
          const { invokeLLM } = await import("./_core/llm");
          const { storageGetSignedUrl } = await import("./storage");

          const signedUrl = await storageGetSignedUrl(report.fileKey);

          const extractResult = await invokeLLM({
            messages: [
              {
                role: "system",
                content: "You are a credit report text extractor. Extract ALL text content from this PDF credit report. Preserve the structure, section headers, account details, balances, dates, and all data exactly as it appears. Do not summarize or interpret - just extract the raw text content faithfully.",
              },
              {
                role: "user",
                content: [
                  {
                    type: "file_url",
                    file_url: {
                      url: signedUrl,
                      mime_type: "application/pdf",
                    },
                  },
                  {
                    type: "text",
                    text: "Extract all text from this credit report PDF. Preserve all account numbers, balances, dates, bureau names, furnisher names, and status information exactly as shown.",
                  },
                ],
              },
            ],
          });

          const extractedText = extractResult.choices[0]?.message?.content;
          if (!extractedText || typeof extractedText !== "string") {
            throw new Error("Failed to extract text from PDF");
          }

          await db.updateCreditReport(input.id, {
            extractedText,
            status: "parsed",
            processedAt: new Date(),
          });

          await db.createAuditLog({
            userId: ctx.user.id,
            action: "report_parsed",
            entityType: "credit_report",
            entityId: input.id,
            details: { textLength: extractedText.length },
          });

          return { success: true, textLength: extractedText.length };
        } catch (error) {
          await db.updateCreditReport(input.id, {
            status: "error",
            errorMessage: error instanceof Error ? error.message : "Unknown error",
          });
          throw error;
        }
      }),

    analyze: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const report = await db.getCreditReportById(input.id);
        if (!report || report.userId !== ctx.user.id) {
          throw new Error("Report not found");
        }
        if (!report.extractedText) {
          throw new Error("Report has not been parsed yet");
        }

        await db.updateCreditReport(input.id, { status: "processing" });

        try {
          const analysis = await analyzeCreditReport(report.extractedText);

          // Create dispute candidates
          const candidates = analysis.candidates.map(c => ({
            userId: ctx.user.id,
            reportId: input.id,
            bureau: c.bureau,
            furnisher: c.furnisher,
            accountName: c.accountName,
            accountNumber: c.accountNumber,
            issueType: c.issueType,
            disputeReason: c.disputeReason,
            confidenceScore: String(c.confidenceScore),
            evidenceChecklist: c.evidenceChecklist,
            riskFlag: c.riskFlag as "low" | "medium" | "high",
            complianceFlag: c.complianceFlag,
            recommendedRound: c.recommendedRound,
            deadlineStatus: c.deadlineStatus as "pending" | "active" | "approaching" | "overdue" | "resolved",
          }));

          if (candidates.length > 0) {
            await db.createDisputeCandidates(candidates);
          }

          await db.updateCreditReport(input.id, {
            status: "analyzed",
            bureausFound: analysis.bureausFound,
          });

          await db.createAuditLog({
            userId: ctx.user.id,
            action: "report_analyzed",
            entityType: "credit_report",
            entityId: input.id,
            details: {
              bureausFound: analysis.bureausFound,
              candidatesFound: candidates.length,
              summary: analysis.summary,
            },
          });

          return {
            success: true,
            bureausFound: analysis.bureausFound,
            candidatesFound: candidates.length,
            summary: analysis.summary,
          };
        } catch (error) {
          await db.updateCreditReport(input.id, {
            status: "error",
            errorMessage: error instanceof Error ? error.message : "Unknown error",
          });
          throw error;
        }
      }),
  }),

  // ─── Dispute Candidates ─────────────────────────────────────────────────────

  candidates: router({
    list: protectedProcedure
      .input(z.object({ reportId: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        if (input?.reportId) {
          return db.getDisputeCandidatesByReport(input.reportId);
        }
        return db.getDisputeCandidatesByUser(ctx.user.id);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const candidate = await db.getDisputeCandidateById(input.id);
        if (!candidate || candidate.userId !== ctx.user.id) {
          throw new Error("Candidate not found");
        }
        return candidate;
      }),

    approve: protectedProcedure
      .input(z.object({ id: z.number(), notes: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const candidate = await db.getDisputeCandidateById(input.id);
        if (!candidate || candidate.userId !== ctx.user.id) {
          throw new Error("Candidate not found");
        }

        // Compliance check - never approve non-compliant disputes
        if (!candidate.complianceFlag) {
          throw new Error("Cannot approve a non-compliant dispute candidate. This dispute lacks sufficient evidence or may be frivolous.");
        }

        await db.updateDisputeCandidate(input.id, {
          userStatus: "approved",
          userNotes: input.notes || null,
        });

        await db.createAuditLog({
          userId: ctx.user.id,
          action: "candidate_approved",
          entityType: "dispute_candidate",
          entityId: input.id,
          details: { notes: input.notes },
        });

        return { success: true };
      }),

    reject: protectedProcedure
      .input(z.object({ id: z.number(), notes: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const candidate = await db.getDisputeCandidateById(input.id);
        if (!candidate || candidate.userId !== ctx.user.id) {
          throw new Error("Candidate not found");
        }

        await db.updateDisputeCandidate(input.id, {
          userStatus: "rejected",
          userNotes: input.notes || null,
        });

        await db.createAuditLog({
          userId: ctx.user.id,
          action: "candidate_rejected",
          entityType: "dispute_candidate",
          entityId: input.id,
          details: { notes: input.notes },
        });

        return { success: true };
      }),

    edit: protectedProcedure
      .input(z.object({
        id: z.number(),
        disputeReason: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const candidate = await db.getDisputeCandidateById(input.id);
        if (!candidate || candidate.userId !== ctx.user.id) {
          throw new Error("Candidate not found");
        }

        const updates: Record<string, unknown> = { userStatus: "edited" };
        if (input.disputeReason) updates.disputeReason = input.disputeReason;
        if (input.notes) updates.userNotes = input.notes;

        await db.updateDisputeCandidate(input.id, updates as any);

        await db.createAuditLog({
          userId: ctx.user.id,
          action: "candidate_edited",
          entityType: "dispute_candidate",
          entityId: input.id,
          details: { disputeReason: input.disputeReason, notes: input.notes },
        });

        return { success: true };
      }),
  }),

  // ─── Dispute Letters ────────────────────────────────────────────────────────

  letters: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserDisputeLetters(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const letter = await db.getDisputeLetterById(input.id);
        if (!letter || letter.userId !== ctx.user.id) {
          throw new Error("Letter not found");
        }
        return letter;
      }),

    generate: protectedProcedure
      .input(z.object({ candidateId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const candidate = await db.getDisputeCandidateById(input.candidateId);
        if (!candidate || candidate.userId !== ctx.user.id) {
          throw new Error("Candidate not found");
        }

        if (candidate.userStatus !== "approved" && candidate.userStatus !== "edited") {
          throw new Error("Candidate must be approved before generating a letter");
        }

        // Compliance gate
        if (!candidate.complianceFlag) {
          throw new Error("Cannot generate letter for non-compliant dispute");
        }

        const letterContent = await generateDisputeLetter(
          {
            bureau: candidate.bureau,
            furnisher: candidate.furnisher,
            accountName: candidate.accountName,
            accountNumber: candidate.accountNumber,
            issueType: candidate.issueType,
            disputeReason: candidate.disputeReason,
            evidenceChecklist: candidate.evidenceChecklist as string[] || [],
          },
          ctx.user.name || "Consumer",
        );

        const { id } = await db.createDisputeLetter({
          userId: ctx.user.id,
          candidateId: input.candidateId,
          bureau: candidate.bureau,
          furnisher: candidate.furnisher,
          letterContent,
          status: "draft",
          disputeRound: candidate.recommendedRound,
        });

        await db.createAuditLog({
          userId: ctx.user.id,
          action: "letter_generated",
          entityType: "dispute_letter",
          entityId: id,
          details: { candidateId: input.candidateId },
        });

        return { id, letterContent };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        letterContent: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const letter = await db.getDisputeLetterById(input.id);
        if (!letter || letter.userId !== ctx.user.id) {
          throw new Error("Letter not found");
        }
        if (letter.status === "sent" || letter.status === "delivered") {
          throw new Error("Cannot edit a letter that has already been sent");
        }

        await db.updateDisputeLetter(input.id, {
          letterContent: input.letterContent,
          status: "pending_review",
        });

        await db.createAuditLog({
          userId: ctx.user.id,
          action: "letter_edited",
          entityType: "dispute_letter",
          entityId: input.id,
        });

        return { success: true };
      }),

    approve: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const letter = await db.getDisputeLetterById(input.id);
        if (!letter || letter.userId !== ctx.user.id) {
          throw new Error("Letter not found");
        }

        await db.updateDisputeLetter(input.id, {
          status: "approved",
          approvedAt: new Date(),
        });

        await db.createAuditLog({
          userId: ctx.user.id,
          action: "letter_approved",
          entityType: "dispute_letter",
          entityId: input.id,
        });

        return { success: true };
      }),
  }),

  // ─── Mail Packets ───────────────────────────────────────────────────────────

  mail: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserMailPackets(ctx.user.id);
    }),

    queue: protectedProcedure.query(async ({ ctx }) => {
      // Only show user's own queue items
      const all = await db.getMailQueue();
      return all.filter(p => p.userId === ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const packet = await db.getMailPacketById(input.id);
        if (!packet || packet.userId !== ctx.user.id) {
          throw new Error("Mail packet not found");
        }
        return packet;
      }),

    send: protectedProcedure
      .input(z.object({
        letterId: z.number(),
        recipientName: z.string(),
        recipientAddress: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const letter = await db.getDisputeLetterById(input.letterId);
        if (!letter || letter.userId !== ctx.user.id) {
          throw new Error("Letter not found");
        }
        if (letter.status !== "approved") {
          throw new Error("Letter must be approved before sending");
        }

        // Create mail packet
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + 30); // FCRA 30-day response window

        const { id } = await db.createMailPacket({
          userId: ctx.user.id,
          letterId: input.letterId,
          provider: "mock",
          recipientName: input.recipientName,
          recipientAddress: input.recipientAddress,
          deadline,
          status: "queued",
        });

        // Send via mail provider
        const provider = getMailProvider();
        try {
          const result = await provider.sendCertifiedMail({
            letterPdfUrl: letter.letterPdfUrl || "",
            recipient: {
              name: input.recipientName,
              address1: input.recipientAddress,
              city: "",
              state: "",
              zip: "",
            },
            sender: {
              name: ctx.user.name || "Consumer",
              address1: "",
              city: "",
              state: "",
              zip: "",
            },
            certifiedMail: true,
            returnReceipt: true,
          });

          await db.updateMailPacket(id, {
            trackingNumber: result.trackingNumber,
            dateSent: new Date(),
            status: "sent",
          });

          await db.updateDisputeLetter(input.letterId, { status: "sent" });

          // Schedule follow-up round (30 days from now)
          await db.createFollowUpRound({
            userId: ctx.user.id,
            candidateId: letter.candidateId,
            letterId: input.letterId,
            roundNumber: letter.disputeRound + 1,
            scheduledDate: deadline,
            status: "scheduled",
            triggerReason: "FCRA 30-day response window expiration",
          });

          await db.createAuditLog({
            userId: ctx.user.id,
            action: "mail_sent",
            entityType: "mail_packet",
            entityId: id,
            details: {
              trackingNumber: result.trackingNumber,
              provider: provider.name,
              letterId: input.letterId,
            },
          });

          return { id, trackingNumber: result.trackingNumber };
        } catch (error) {
          await db.updateMailPacket(id, { status: "failed" });
          throw error;
        }
      }),

    updateTracking: protectedProcedure
      .input(z.object({
        id: z.number(),
        deliveryResult: z.enum(["pending", "in_transit", "delivered", "returned", "failed"]),
        responseReceived: z.boolean().optional(),
        responseNotes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const packet = await db.getMailPacketById(input.id);
        if (!packet || packet.userId !== ctx.user.id) {
          throw new Error("Mail packet not found");
        }

        const updates: Record<string, unknown> = {
          deliveryResult: input.deliveryResult,
        };
        if (input.deliveryResult === "delivered") {
          updates.status = "delivered";
        }
        if (input.responseReceived !== undefined) {
          updates.responseReceived = input.responseReceived;
          if (input.responseReceived) {
            updates.responseDate = new Date();
          }
        }
        if (input.responseNotes) {
          updates.responseNotes = input.responseNotes;
        }

        await db.updateMailPacket(input.id, updates as any);

        await db.createAuditLog({
          userId: ctx.user.id,
          action: "tracking_updated",
          entityType: "mail_packet",
          entityId: input.id,
          details: { deliveryResult: input.deliveryResult },
        });

        return { success: true };
      }),
  }),

  // ─── Follow-Up Rounds ───────────────────────────────────────────────────────

  followUps: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserFollowUpRounds(ctx.user.id);
    }),

    byCandidate: protectedProcedure
      .input(z.object({ candidateId: z.number() }))
      .query(async ({ input }) => {
        return db.getFollowUpRoundsByCandidate(input.candidateId);
      }),
  }),

  // ─── Admin ─────────────────────────────────────────────────────────────────

  admin: router({
    stats: adminProcedure.query(async () => {
      return db.getAdminStats();
    }),

    users: adminProcedure.query(async () => {
      return db.getAllUsers();
    }),

    allCandidates: adminProcedure.query(async () => {
      return db.getAllDisputeCandidates();
    }),

    allLetters: adminProcedure.query(async () => {
      return db.getAllDisputeLetters();
    }),

    allMailPackets: adminProcedure.query(async () => {
      return db.getAllMailPackets();
    }),

    auditLogs: adminProcedure
      .input(z.object({ limit: z.number().default(100), offset: z.number().default(0) }).optional())
      .query(async ({ input }) => {
        const limit = input?.limit ?? 100;
        const offset = input?.offset ?? 0;
        const [logs, count] = await Promise.all([
          db.getAuditLogs(limit, offset),
          db.getAuditLogCount(),
        ]);
        return { logs, total: count };
      }),
  }),
});

export type AppRouter = typeof appRouter;

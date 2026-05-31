# DisputeOS

**Compliance-first credit dispute SaaS** — AI-powered dispute candidate engine, FCRA-compliant letter generation, certified mail delivery, and full audit trail.

🌐 **Live:** https://disputeos-rkqgxzva.manus.space

---

## Overview

DisputeOS guides consumers through the entire credit dispute lifecycle — from uploading a credit report PDF to receiving bureau responses — with strict compliance enforcement at every step. The system never generates false, fabricated, or unsupported disputes. Every candidate requires evidence extracted directly from the report, and every letter must be explicitly approved by the user before delivery.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Tailwind CSS 4 |
| Backend | Node.js + Express 4 + tRPC 11 |
| Database | MySQL (Drizzle ORM) |
| AI Engine | Gemini 2.5 Flash (via built-in LLM SDK) |
| File Storage | S3-compatible object storage |
| Auth | Manus OAuth (JWT session cookies) |
| UI Components | shadcn/ui + Radix UI |
| Testing | Vitest (12 tests) |
| Deployment | Google Cloud Run |

---

## Features

### 1. User Authentication & RBAC
- Manus OAuth login with JWT session cookies
- Role-based access control: `user` and `admin` roles
- Protected procedures via `protectedProcedure` and `adminProcedure`
- Admin users see additional sidebar navigation and system-wide data

### 2. Secure Credit Report Upload
- PDF upload with server-side validation (MIME type, magic bytes `%PDF-`, 16MB size limit)
- Files stored securely in S3 with unique hashed keys
- Upload audit log entry created on every upload

### 3. AI-Powered Dispute Candidate Engine
The dispute engine uses Gemini 2.5 Flash with structured JSON output to analyze credit report text and identify:
- Bureau sections (Equifax, Experian, TransUnion)
- Inaccurate account information (wrong balances, dates, status)
- Accounts not belonging to the consumer
- Duplicate accounts
- Outdated negative information (beyond 7-year limit)
- Incorrect personal information
- Unauthorized inquiries
- Mixed file issues
- Incorrect payment history
- Inconsistent cross-bureau reporting
- Collections without original creditor

Each candidate includes:
- `bureau` — which bureau reports the issue
- `furnisher` — the creditor or data furnisher
- `accountName` + `accountNumber`
- `issueType` — categorized issue
- `disputeReason` — FCRA/FDCPA-grounded explanation
- `confidenceScore` — 0–100 based on evidence strength
- `evidenceChecklist` — specific text from the report
- `riskFlag` — low / medium / high likelihood of success
- `complianceFlag` — false if dispute would be frivolous
- `recommendedRound` — dispute round (1 = strongest)
- `deadlineStatus` — pending / active / approaching / overdue / resolved

### 4. Compliance Enforcement
- Non-compliant candidates (no evidence, frivolous) cannot be approved
- Compliance gate blocks letter generation for non-compliant disputes
- Human review required — no automated dispatch without explicit approval
- Full compliance disclaimer page with FCRA/FDCPA legal notices

### 5. Dispute Approval Workflow
- Users review each candidate with all fields visible
- Detail dialog shows complete candidate data
- Actions: Approve, Edit (with custom reason), Reject
- Approved or edited candidates unlock letter generation

### 6. Dispute Letter Generation
- AI generates professional, legally compliant dispute letters
- Letters cite FCRA §611, §623 and FDCPA
- Include 30-day response deadline per FCRA requirements
- Preview dialog with markdown rendering
- Edit mode with full text editor
- Approve before sending

### 7. Certified Mail Delivery
**Mock-first, provider-ready architecture:**

```
MAIL_PROVIDER=mock        # default — simulated delivery
MAIL_PROVIDER=click2mail  # Click2Mail API
MAIL_PROVIDER=postgrid    # PostGrid API
MAIL_PROVIDER=lob         # Lob API
MAIL_PROVIDER=postalytics # Postalytics API
```

All providers implement the `MailProvider` interface:
```ts
interface MailProvider {
  sendCertifiedMail(request: SendMailRequest): Promise<SendMailResult>;
  getTracking(trackingNumber: string): Promise<TrackingResult>;
  cancelMail(providerJobId: string): Promise<boolean>;
}
```

### 8. Mail Proof Storage
Every mail packet records:
- Letter PDF key/URL
- Recipient name and full address
- Tracking number
- Date sent
- 30-day FCRA response deadline
- Delivery result (pending / in_transit / delivered / returned / failed)
- Response received flag + date + notes

### 9. Automated Follow-Up Scheduling
When mail is sent, a follow-up round is automatically scheduled 30 days out (FCRA response window). The `follow_up_rounds` table tracks:
- Round number
- Scheduled date
- Status (scheduled / ready / in_progress / completed / cancelled)
- Trigger reason

### 10. Admin Dashboard
- System-wide statistics (users, reports, candidates, letters, mail packets, audit entries)
- User management table
- All-users dispute pipeline overview (candidates, letters, mail)
- Full audit log with pagination
- System health indicators

### 11. Audit Log
Every significant action is logged:
- `report_uploaded`, `report_parsed`, `report_analyzed`
- `candidate_approved`, `candidate_rejected`, `candidate_edited`
- `letter_generated`, `letter_edited`, `letter_approved`
- `mail_sent`, `tracking_updated`

---

## Database Schema

7 tables managed by Drizzle ORM:

| Table | Purpose |
|---|---|
| `users` | Auth, roles, OAuth identity |
| `credit_reports` | Uploaded PDFs, extracted text, status |
| `dispute_candidates` | AI-identified disputes with all metadata |
| `dispute_letters` | Generated letter content and approval state |
| `mail_packets` | Certified mail delivery proof and tracking |
| `follow_up_rounds` | Scheduled follow-up rounds after response windows |
| `audit_logs` | Complete compliance audit trail |

---

## Pages

| Route | Page | Description |
|---|---|---|
| `/` | Dashboard | Stats overview, quick actions, compliance status |
| `/reports` | Credit Reports | Upload PDFs, trigger parse + analyze |
| `/disputes` | Dispute Pipeline | Review, approve, reject, edit candidates |
| `/letters` | Letters | Preview, edit, approve dispute letters |
| `/mail` | Mail Queue | Track certified mail delivery |
| `/calendar` | Deadline Calendar | FCRA deadlines and follow-up schedule |
| `/compliance` | Compliance | Legal disclaimers, FCRA/FDCPA info |
| `/admin` | Admin Dashboard | System stats and health |
| `/admin/users` | User Management | All registered users |
| `/admin/pipeline` | Pipeline Overview | All users' disputes, letters, mail |
| `/admin/audit` | Audit Log | Full paginated audit trail |

---

## Project Structure

```
client/src/
  pages/          ← 11 feature pages
  components/     ← DashboardLayout, shadcn/ui primitives
  lib/trpc.ts     ← tRPC client binding

server/
  routers.ts      ← All tRPC procedures (auth, reports, candidates, letters, mail, admin)
  db.ts           ← All database query helpers
  disputeEngine.ts ← AI analysis + letter generation
  mailProvider.ts  ← Provider adapter (mock + stubs for 4 live providers)
  storage.ts      ← S3 file storage helpers
  *.test.ts       ← 12 Vitest tests

drizzle/
  schema.ts       ← 7-table database schema
```

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | MySQL connection string |
| `JWT_SECRET` | Session cookie signing |
| `BUILT_IN_FORGE_API_URL` | LLM + storage API base URL |
| `BUILT_IN_FORGE_API_KEY` | Server-side API key |
| `MAIL_PROVIDER` | Mail adapter: `mock` \| `click2mail` \| `postgrid` \| `lob` \| `postalytics` |
| `CLICK2MAIL_API_KEY` | Click2Mail credentials (when provider=click2mail) |
| `POSTGRID_API_KEY` | PostGrid credentials (when provider=postgrid) |
| `LOB_API_KEY` | Lob credentials (when provider=lob) |
| `POSTALYTICS_API_KEY` | Postalytics credentials (when provider=postalytics) |

---

## Running Locally

```bash
pnpm install
pnpm db:push     # apply schema migrations
pnpm dev         # start dev server on :3000
pnpm test        # run 12 vitest tests
pnpm build       # production build
```

---

## Compliance Notice

DisputeOS is a credit dispute management tool, not a law firm or credit repair organization. All disputes generated are grounded in factual evidence from uploaded credit reports. The system enforces compliance at every step and will never generate, approve, or send disputes that are false, fabricated, or unsupported. Users should consult a licensed attorney for legal advice specific to their situation.

---

## License

MIT

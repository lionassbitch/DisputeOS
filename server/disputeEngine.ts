/**
 * DisputeOS - AI-Powered Dispute Candidate Engine
 * 
 * Analyzes extracted credit report text to identify:
 * - Bureau sections (Equifax, Experian, TransUnion)
 * - Accounts, inquiries, collections
 * - Personal information discrepancies
 * - Balances, dates, payment status
 * - Account numbers, furnishers
 * - Reporting inconsistencies
 * 
 * COMPLIANCE: This engine NEVER fabricates disputes. All candidates
 * are grounded in actual report text with evidence citations.
 */

import { invokeLLM } from "./_core/llm";

export interface DisputeCandidateResult {
  bureau: string;
  furnisher: string;
  accountName: string;
  accountNumber: string | null;
  issueType: string;
  disputeReason: string;
  confidenceScore: number;
  evidenceChecklist: string[];
  riskFlag: "low" | "medium" | "high";
  complianceFlag: boolean;
  recommendedRound: number;
  deadlineStatus: "pending" | "active" | "approaching" | "overdue" | "resolved";
}

export interface AnalysisResult {
  bureausFound: string[];
  candidates: DisputeCandidateResult[];
  summary: string;
}

const ANALYSIS_SYSTEM_PROMPT = `You are a credit report analysis expert for DisputeOS, a compliance-first credit dispute platform.

Your role is to analyze credit report text and identify legitimate dispute candidates. You must:

1. NEVER fabricate or invent disputes that are not supported by the report text.
2. ONLY identify issues that are genuinely present in the data.
3. Look for these specific issue types:
   - Inaccurate account information (wrong balances, dates, status)
   - Accounts not belonging to the consumer
   - Duplicate accounts
   - Outdated negative information (beyond 7-year reporting limit)
   - Incorrect personal information
   - Unauthorized inquiries
   - Mixed file issues (another person's data)
   - Incorrect payment history
   - Accounts with inconsistent reporting across bureaus
   - Collections with no original creditor listed
   - Incorrect account status (showing open when closed, etc.)

4. For each candidate, provide:
   - The specific bureau reporting the issue
   - The furnisher (creditor/data furnisher name)
   - Account name and number if available
   - The specific issue type
   - A clear dispute reason grounded in FCRA/FDCPA
   - Confidence score (0-100) based on evidence strength
   - Evidence checklist (specific text from the report supporting the dispute)
   - Risk flag (low/medium/high) based on likelihood of success
   - Whether it passes compliance checks (complianceFlag)
   - Recommended dispute round (1 for strongest cases, 2-3 for weaker)

5. COMPLIANCE RULES:
   - complianceFlag must be FALSE if the dispute would be frivolous
   - complianceFlag must be FALSE if there's no supporting evidence
   - Never suggest disputing accurate information
   - Confidence score must reflect actual evidence strength
   - Risk flag "high" means high risk of rejection (weak case)

Return your analysis as a JSON object.`;

export async function analyzeCreditReport(extractedText: string): Promise<AnalysisResult> {
  if (!extractedText || extractedText.trim().length < 50) {
    return {
      bureausFound: [],
      candidates: [],
      summary: "Insufficient text extracted from the credit report for analysis.",
    };
  }

  // Truncate very long reports to fit context window
  const maxLength = 60000;
  const textToAnalyze = extractedText.length > maxLength
    ? extractedText.slice(0, maxLength) + "\n\n[Report text truncated for analysis]"
    : extractedText;

  try {
    const result = await invokeLLM({
      messages: [
        { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Analyze the following credit report text and identify all legitimate dispute candidates. Be thorough but NEVER fabricate issues.\n\n---\nCREDIT REPORT TEXT:\n---\n${textToAnalyze}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "credit_report_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              bureausFound: {
                type: "array",
                items: { type: "string" },
                description: "List of credit bureaus found in the report (Equifax, Experian, TransUnion)",
              },
              summary: {
                type: "string",
                description: "Brief summary of the report analysis",
              },
              candidates: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    bureau: { type: "string" },
                    furnisher: { type: "string" },
                    accountName: { type: "string" },
                    accountNumber: { type: ["string", "null"] },
                    issueType: { type: "string" },
                    disputeReason: { type: "string" },
                    confidenceScore: { type: "number" },
                    evidenceChecklist: { type: "array", items: { type: "string" } },
                    riskFlag: { type: "string", enum: ["low", "medium", "high"] },
                    complianceFlag: { type: "boolean" },
                    recommendedRound: { type: "integer" },
                    deadlineStatus: { type: "string", enum: ["pending", "active", "approaching", "overdue", "resolved"] },
                  },
                  required: ["bureau", "furnisher", "accountName", "accountNumber", "issueType", "disputeReason", "confidenceScore", "evidenceChecklist", "riskFlag", "complianceFlag", "recommendedRound", "deadlineStatus"],
                  additionalProperties: false,
                },
              },
            },
            required: ["bureausFound", "summary", "candidates"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = result.choices[0]?.message?.content;
    if (!content || typeof content !== "string") {
      return {
        bureausFound: [],
        candidates: [],
        summary: "AI analysis returned no content.",
      };
    }

    const parsed = JSON.parse(content) as AnalysisResult;

    // Post-processing: validate compliance flags
    parsed.candidates = parsed.candidates.map(candidate => ({
      ...candidate,
      // Ensure confidence score is within bounds
      confidenceScore: Math.max(0, Math.min(100, candidate.confidenceScore)),
      // Flag candidates with no evidence as non-compliant
      complianceFlag: candidate.evidenceChecklist.length > 0 && candidate.complianceFlag,
    }));

    return parsed;
  } catch (error) {
    console.error("[DisputeEngine] Analysis failed:", error);
    return {
      bureausFound: [],
      candidates: [],
      summary: `Analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

// ─── Letter Generation ──────────────────────────────────────────────────────

const LETTER_SYSTEM_PROMPT = `You are a credit dispute letter writer for DisputeOS. Generate professional, legally compliant dispute letters.

Rules:
1. Letters must be factual and reference specific account details.
2. Letters must cite relevant consumer protection laws (FCRA §611, §623; FDCPA).
3. Letters must request specific actions (investigation, correction, deletion).
4. Letters must include a 30-day response deadline per FCRA requirements.
5. Letters must be professional, clear, and concise.
6. NEVER include false statements or fabricated claims.
7. Include placeholders for: [YOUR NAME], [YOUR ADDRESS], [DATE], [ACCOUNT NUMBER].
8. Format as a proper business letter with header, body, and closing.

The letter should follow this structure:
- Header with sender info and date
- Bureau/furnisher address
- Re: line with account details
- Opening paragraph citing FCRA rights
- Body paragraphs detailing the specific dispute
- Evidence references
- Requested action
- Deadline reminder (30 days per FCRA)
- Closing with signature block`;

export async function generateDisputeLetter(
  candidate: {
    bureau: string;
    furnisher: string;
    accountName: string;
    accountNumber: string | null;
    issueType: string;
    disputeReason: string;
    evidenceChecklist: string[];
  },
  userName: string,
): Promise<string> {
  try {
    const result = await invokeLLM({
      messages: [
        { role: "system", content: LETTER_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Generate a dispute letter for the following:

Bureau: ${candidate.bureau}
Furnisher: ${candidate.furnisher}
Account Name: ${candidate.accountName}
Account Number: ${candidate.accountNumber || "Not Available"}
Issue Type: ${candidate.issueType}
Dispute Reason: ${candidate.disputeReason}
Evidence: ${candidate.evidenceChecklist.join("; ")}
Consumer Name: ${userName}

Generate a complete, professional dispute letter ready for certified mail.`,
        },
      ],
    });

    const content = result.choices[0]?.message?.content;
    if (!content || typeof content !== "string") {
      throw new Error("Letter generation returned no content");
    }

    return content;
  } catch (error) {
    console.error("[DisputeEngine] Letter generation failed:", error);
    throw new Error(`Failed to generate dispute letter: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

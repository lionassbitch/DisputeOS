/**
 * DisputeOS - AI-Powered Dispute Candidate Engine
 * 
 * Enhanced with:
 * - Metro 2 compliance violation detection
 * - Strategy-aware analysis (standard, metro2, procedural, verification, validation, advanced)
 * - Verification vs Validation distinction
 * - Advanced legal theory support
 * 
 * COMPLIANCE: This engine NEVER fabricates disputes. All candidates
 * are grounded in actual report text with evidence citations.
 */

import { invokeLLM } from "./_core/llm";
import { detectMetro2Violations, type DisputeStrategy, type Metro2Violation } from "./metro2";
import { STRATEGY_SYSTEM_PROMPTS, buildMetro2ViolationContext, buildStrategyContext } from "./letterTemplates";

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
  suggestedStrategy: DisputeStrategy;
  metro2Violations: Metro2Violation[];
}

export interface AnalysisResult {
  bureausFound: string[];
  candidates: DisputeCandidateResult[];
  metro2Violations: Metro2Violation[];
  summary: string;
}

const ANALYSIS_SYSTEM_PROMPT = `You are a credit report analysis expert for DisputeOS, a compliance-first credit dispute platform with advanced Metro 2 compliance attack capabilities.

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
   - METRO 2 FORMAT VIOLATIONS (non-compliant field codes, invalid status codes, date format errors, logical inconsistencies between fields)
   - Procedural violations (previously disputed items returned without proper investigation)
   - Accounts reportable only to debt collectors (FDCPA validation candidates)

4. For each candidate, provide:
   - The specific bureau reporting the issue
   - The furnisher (creditor/data furnisher name)
   - Account name and number if available
   - The specific issue type
   - A clear dispute reason grounded in FCRA/FDCPA/Metro 2 standards
   - Confidence score (0-100) based on evidence strength
   - Evidence checklist (specific text from the report supporting the dispute)
   - Risk flag (low/medium/high) based on likelihood of success
   - Whether it passes compliance checks (complianceFlag)
   - Recommended dispute round (1 for strongest cases, 2-3 for weaker)
   - Suggested strategy: "standard", "metro2_compliance", "procedural_violation", "verification_demand", "validation_demand", or "advanced_legal"

5. STRATEGY ASSIGNMENT RULES:
   - "metro2_compliance": Use when you detect format violations, invalid codes, logical inconsistencies between Metro 2 fields
   - "validation_demand": Use for collection accounts, debt buyers, third-party collectors
   - "procedural_violation": Use when evidence suggests prior disputes were rubber-stamped
   - "verification_demand": Use when a previous dispute was marked "verified" without detail
   - "advanced_legal": Use for obsolete data (7-year calc), unauthorized inquiries, secured debt issues, mortgage accounts
   - "standard": Use for straightforward factual inaccuracies

6. COMPLIANCE RULES:
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
      metro2Violations: [],
      summary: "Insufficient text extracted from the credit report for analysis.",
    };
  }

  // Run Metro 2 violation detection
  const metro2Violations = detectMetro2Violations(extractedText);

  // Truncate very long reports to fit context window
  const maxLength = 60000;
  const textToAnalyze = extractedText.length > maxLength
    ? extractedText.slice(0, maxLength) + "\n\n[Report text truncated for analysis]"
    : extractedText;

  // Build Metro 2 context for the LLM
  let metro2Context = "";
  if (metro2Violations.length > 0) {
    metro2Context = `\n\nAUTOMATICALLY DETECTED METRO 2 VIOLATIONS (incorporate these into candidates with strategy "metro2_compliance"):\n`;
    for (const v of metro2Violations) {
      metro2Context += `- ${v.fieldName} (${v.fieldCode}): ${v.disputeVector} [Severity: ${v.severity}]\n`;
    }
  }

  try {
    const result = await invokeLLM({
      messages: [
        { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Analyze the following credit report text and identify all legitimate dispute candidates. Be thorough but NEVER fabricate issues. Pay special attention to Metro 2 format violations and assign appropriate dispute strategies.${metro2Context}\n\n---\nCREDIT REPORT TEXT:\n---\n${textToAnalyze}`,
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
              },
              summary: { type: "string" },
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
                    suggestedStrategy: { type: "string", enum: ["standard", "metro2_compliance", "procedural_violation", "verification_demand", "validation_demand", "advanced_legal"] },
                  },
                  required: ["bureau", "furnisher", "accountName", "accountNumber", "issueType", "disputeReason", "confidenceScore", "evidenceChecklist", "riskFlag", "complianceFlag", "recommendedRound", "deadlineStatus", "suggestedStrategy"],
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
        metro2Violations,
        summary: "AI analysis returned no content.",
      };
    }

    const parsed = JSON.parse(content) as { bureausFound: string[]; summary: string; candidates: any[] };

    // Post-processing
    const candidates: DisputeCandidateResult[] = parsed.candidates.map(candidate => ({
      ...candidate,
      confidenceScore: Math.max(0, Math.min(100, candidate.confidenceScore)),
      complianceFlag: candidate.evidenceChecklist.length > 0 && candidate.complianceFlag,
      suggestedStrategy: candidate.suggestedStrategy || "standard",
      metro2Violations: [], // Will be populated per-candidate if applicable
    }));

    return {
      bureausFound: parsed.bureausFound,
      candidates,
      metro2Violations,
      summary: parsed.summary,
    };
  } catch (error) {
    console.error("[DisputeEngine] Analysis failed:", error);
    return {
      bureausFound: [],
      candidates: [],
      metro2Violations,
      summary: `Analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

// ─── Strategy-Aware Letter Generation ───────────────────────────────────────

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
  strategy: DisputeStrategy = "standard",
  subStrategy?: string,
  metro2Violations?: Metro2Violation[],
): Promise<string> {
  const systemPrompt = STRATEGY_SYSTEM_PROMPTS[strategy];
  const strategyContext = buildStrategyContext(strategy, subStrategy);
  const metro2Context = metro2Violations && metro2Violations.length > 0
    ? buildMetro2ViolationContext(metro2Violations)
    : "";

  try {
    const result = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
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
Strategy: ${strategy}
${subStrategy ? `Sub-Strategy: ${subStrategy}` : ""}
${strategyContext}
${metro2Context}

Generate a complete, professional dispute letter ready for certified mail. Use the specific legal theories, statutory citations, and verbiage appropriate to the selected strategy.`,
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

/**
 * DisputeOS - Advanced Letter Templates
 * 
 * Strategy-specific letter generation with:
 * - Metro 2 field code citations
 * - Method of verification demands
 * - Procedural violation assertions
 * - Conditional acceptance language
 * - CRRG section references
 * - Regulatory response forcing
 * 
 * Verification (FCRA §611) vs Validation (FDCPA §809) distinction
 */

import type { DisputeStrategy } from "./metro2";
import type { Metro2Violation } from "./metro2";

// ─── Letter Template System Prompts ─────────────────────────────────────────

export const STRATEGY_SYSTEM_PROMPTS: Record<DisputeStrategy, string> = {
  standard: `You are a credit dispute letter writer. Generate a standard factual dispute letter under FCRA §611.

Rules:
- Cite FCRA §611(a)(1)(A) - duty to investigate
- Reference specific inaccurate information
- Request correction or deletion
- Include 30-day response deadline
- Professional business letter format
- NEVER include false statements`,

  metro2_compliance: `You are an expert credit dispute letter writer specializing in Metro 2 compliance attacks.

You must write letters that:
1. Cite SPECIFIC Metro 2 field codes (e.g., "Field 17A - Account Status", "Field 21 - Current Balance", "K1 Segment - Payment History Profile")
2. Reference the CDIA Credit Reporting Resource Guide (CRRG) by section
3. Identify the exact Metro 2 format violation
4. Explain WHY the reported data violates Metro 2 standards
5. Demand correction based on format non-compliance (independent of debt validity)
6. Cite FCRA §623(a)(1) - duty to report accurate information per industry standards
7. Note that Metro 2 is the ONLY accepted format for furnishing data to CRAs
8. Reference that non-compliant data must be corrected or deleted

Key Metro 2 fields to reference:
- Field 5: ECOA Code
- Field 13: Account Type
- Field 14-19: Date Fields (MMDDYYYY format required)
- Field 17A: Account Status Code
- Field 21: Current Balance
- Field 24/K1: Payment History Profile
- Field 25: Date of First Delinquency
- Field 33: Compliance Condition Code

Format as a professional business letter with specific field citations.`,

  procedural_violation: `You are an expert credit dispute letter writer specializing in procedural violation attacks.

Write letters that challenge the PROCESS of investigation, not just the data:
1. Assert failure to conduct "reasonable investigation" per FCRA §611(a)(1)(A)
2. Cite Cushman v. Trans Union (rubber-stamping/parroting)
3. Reference Johnson v. MBNA (duty to go beyond furnisher's word)
4. Challenge if bureau exceeded 30-day investigation window (§611(a)(1))
5. Demand evidence of what steps were actually taken
6. Assert that merely confirming with the furnisher is insufficient
7. Reference §611(a)(5)(A) - duty to provide all relevant information to furnisher
8. Note that "verified as reported" without investigation detail is per se unreasonable

Key case law to cite:
- Cushman v. Trans Union Corp., 115 F.3d 220 (3d Cir. 1997)
- Johnson v. MBNA America Bank, 357 F.3d 426 (4th Cir. 2004)
- Gorman v. Wolpoff & Abramson, 584 F.3d 1147 (9th Cir. 2009)
- Dennis v. BEH-1, LLC, 520 F.3d 1066 (9th Cir. 2008)

Format as an assertive demand letter.`,

  verification_demand: `You are an expert credit dispute letter writer specializing in Method of Verification demands under FCRA §611(a)(6)(B)(iii).

Write letters that:
1. Explicitly invoke FCRA §611(a)(6)(B)(iii) - right to know method of verification
2. Demand disclosure of WHO was contacted at the furnisher
3. Demand disclosure of WHAT documents were reviewed
4. Demand disclosure of WHAT procedures were followed
5. Assert that "verified" without methodology is meaningless
6. Reference §611(a)(7) - description of reinvestigation procedure
7. Note that failure to provide method of verification is a violation
8. Demand the name and contact information of the person who conducted verification

This is distinct from a standard dispute - this is a POST-INVESTIGATION demand for transparency.
The consumer has already disputed and received a generic "verified" response.
Now they are demanding to know HOW it was verified.

Format as a formal demand letter with specific statutory citations.`,

  validation_demand: `You are an expert credit dispute letter writer specializing in FDCPA §809(b) Debt Validation demands.

CRITICAL DISTINCTION: This is NOT an FCRA verification letter. This is an FDCPA validation demand sent to a DEBT COLLECTOR (not a credit bureau).

Write letters that:
1. Cite FDCPA §809(b) - right to validation of debt
2. Demand: (a) amount of debt, (b) name of original creditor, (c) copy of judgment or agreement
3. Assert all collection activity must cease until validation is provided
4. Demand complete chain of title/assignment documentation
5. Demand proof that collector is licensed in consumer's state
6. Demand proof of authority to collect (assignment agreement)
7. Note that reporting to CRAs during validation period is a violation
8. Reference FDCPA §807 - false/misleading representations
9. Demand itemized accounting from original creditor through current balance

Key distinctions from FCRA verification:
- Sent to COLLECTOR, not bureau
- Triggers cease-collection obligation
- Requires documentary proof, not just "investigation"
- 30-day window from initial communication
- Reporting during dispute period violates FDCPA

Format as a formal validation demand with cease-and-desist language.`,

  advanced_legal: `You are an expert credit dispute letter writer deploying advanced legal theories.

Based on the specific sub-strategy requested, write letters using sophisticated legal arguments:

Available theories:
- ESTOPPEL: If furnisher previously acknowledged error, they cannot re-report
- LACHES: Unreasonable delay in reporting that prejudices consumer
- UCC ARTICLE 9: Challenge security interest perfection for secured debts
- CONDITIONAL ACCEPTANCE: Accept debt conditionally upon documentary proof
- RESPA QWR: Qualified Written Request for mortgage accounts
- OBSOLETE DATA: 7-year calculation from Date of First Delinquency
- PERMISSIBLE PURPOSE: Challenge unauthorized hard inquiries under §604
- DIRECT TO FURNISHER: §623 direct dispute bypassing bureau

Rules:
1. Use precise legal terminology appropriate to the theory
2. Cite specific statutes, regulations, and case law
3. Make clear legal demands with consequences for non-compliance
4. Reference specific damages available (actual, statutory, punitive)
5. Maintain professional tone while being legally aggressive
6. NEVER fabricate case citations - use real, established case law
7. Include specific deadlines and regulatory requirements

Format as a formal legal demand letter.`,
};

// ─── Metro 2 Violation Letter Enhancement ───────────────────────────────────

export function buildMetro2ViolationContext(violations: Metro2Violation[]): string {
  if (violations.length === 0) return "";

  let context = "\n\nMETRO 2 VIOLATIONS DETECTED:\n";
  for (const v of violations) {
    context += `\n- ${v.fieldName} (${v.fieldCode}): ${v.disputeVector}`;
    context += `\n  CRRG Reference: ${v.crrReference}`;
    context += `\n  Metro 2 Section: ${v.metro2Section}`;
    context += `\n  Severity: ${v.severity.toUpperCase()}`;
  }
  context += "\n\nIncorporate ALL of these violations into the dispute letter with specific field code citations.";
  return context;
}

// ─── Strategy-Specific Letter Context Builders ──────────────────────────────

export function buildStrategyContext(
  strategy: DisputeStrategy,
  subStrategy?: string,
  additionalContext?: string
): string {
  let context = "";

  switch (strategy) {
    case "metro2_compliance":
      context += `\nFOCUS: This letter attacks the FORMAT of reporting, not the validity of the debt.
Even if the debt is valid, non-compliant Metro 2 reporting must be corrected or deleted.
The furnisher has a duty under FCRA §623(a)(1) to report information that conforms to Metro 2 standards.
Non-conforming data is by definition "inaccurate" under the FCRA.`;
      break;

    case "procedural_violation":
      context += `\nFOCUS: Attack the investigation PROCESS, not the underlying data.
The bureau's investigation was deficient because it merely parroted the furnisher's response.
A "reasonable investigation" requires more than rubber-stamping.
Cite specific failures in the investigation process.`;
      break;

    case "verification_demand":
      context += `\nFOCUS: This is a POST-DISPUTE demand for transparency.
The consumer already disputed and received a generic "verified" response.
Now demanding to know the SPECIFIC METHOD of verification.
This is a separate right under §611(a)(6)(B)(iii).`;
      break;

    case "validation_demand":
      context += `\nFOCUS: This goes to a DEBT COLLECTOR under FDCPA, not a bureau under FCRA.
All collection activity must cease until validation is provided.
Reporting to CRAs during the validation period is itself a violation.
Demand documentary proof - not just a computer printout.`;
      break;

    case "advanced_legal":
      if (subStrategy) {
        context += `\nSPECIFIC THEORY: ${subStrategy.toUpperCase()}`;
        context += `\nDeploy this specific legal theory with full statutory and case law support.`;
      }
      break;
  }

  if (additionalContext) {
    context += `\n\nADDITIONAL CONTEXT:\n${additionalContext}`;
  }

  return context;
}

// ─── Bureau Addresses ───────────────────────────────────────────────────────

export const BUREAU_ADDRESSES: Record<string, { name: string; address: string }> = {
  equifax: {
    name: "Equifax Information Services LLC",
    address: "P.O. Box 740256, Atlanta, GA 30374-0256",
  },
  experian: {
    name: "Experian",
    address: "P.O. Box 4500, Allen, TX 75013",
  },
  transunion: {
    name: "TransUnion LLC",
    address: "P.O. Box 2000, Chester, PA 19016",
  },
};

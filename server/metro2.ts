/**
 * DisputeOS - Metro 2 Compliance Attack Module
 * 
 * Checks for field-level violations in reported credit data against
 * the Metro 2 Format standard (CDIA Credit Reporting Resource Guide).
 * 
 * If a furnisher reports data that doesn't conform to Metro 2 format
 * standards, that constitutes an independent dispute vector regardless
 * of whether the underlying debt is valid.
 */

// ─── Metro 2 Field Definitions ──────────────────────────────────────────────

export const METRO2_ACCOUNT_STATUS_CODES: Record<string, string> = {
  "00": "Unspecified",
  "05": "Account transferred",
  "11": "Current",
  "13": "Paid or closed/zero balance",
  "61": "Paid in full - voluntary surrender",
  "62": "Paid in full - collection account",
  "63": "Paid in full - repossession",
  "64": "Paid in full - charge-off",
  "65": "Paid in full - foreclosure",
  "71": "30 days past due",
  "78": "60 days past due",
  "80": "90 days past due",
  "82": "120 days past due",
  "83": "150 days past due",
  "84": "180+ days past due",
  "88": "Claim filed with government",
  "89": "Deed in lieu of foreclosure",
  "93": "Account assigned to internal/external collections",
  "94": "Foreclosure",
  "95": "Voluntary surrender",
  "96": "Grantor repossession/sold",
  "97": "Charge-off",
  "DA": "Delete - consumer dispute",
  "DF": "Delete - fraud",
};

export const METRO2_PAYMENT_RATING_CODES: Record<string, string> = {
  "0": "Current (0 days past due)",
  "1": "30-59 days past due",
  "2": "60-89 days past due",
  "3": "90-119 days past due",
  "4": "120-149 days past due",
  "5": "150-179 days past due",
  "6": "180+ days past due",
  "G": "Collection",
  "L": "Charge-off",
};

export const METRO2_ECOA_CODES: Record<string, string> = {
  "1": "Individual",
  "2": "Joint contractual liability",
  "3": "Authorized user",
  "5": "Co-maker/co-signer",
  "7": "Maker",
  "T": "Terminated",
  "W": "Business/commercial",
  "X": "Deceased",
  "Z": "Delete",
};

export const METRO2_SPECIAL_COMMENT_CODES: Record<string, string> = {
  "AC": "Account closed at consumer's request",
  "AU": "Account being paid through insurance",
  "B": "Dispute resolved - consumer disagrees",
  "BL": "Credit line suspended",
  "CH": "Charged off account",
  "CL": "Closed",
  "CO": "Account closed",
  "M": "Account closed at consumer's request",
  "S": "Special handling - contact credit grantor",
  "V": "Voluntarily surrendered",
};

export const METRO2_COMPLIANCE_CONDITION_CODES: Record<string, string> = {
  "XA": "Account in dispute under FCRA",
  "XB": "Account information disputed by consumer - meets FCRA requirements",
  "XC": "Completed investigation - consumer disagrees",
  "XF": "Account in dispute under Fair Credit Billing Act",
  "XH": "Account previously in dispute - now resolved",
  "XR": "Meets compliance condition of removal",
};

export const METRO2_ACCOUNT_TYPE_CODES: Record<string, string> = {
  "00": "Auto",
  "01": "Unsecured",
  "02": "Secured",
  "03": "Partially secured",
  "04": "Home improvement",
  "05": "FHA home improvement",
  "06": "Charge account",
  "07": "Revolving",
  "08": "Installment",
  "10": "Mortgage - FHA",
  "11": "Mortgage - conventional",
  "12": "Mortgage - VA",
  "13": "Mortgage - USDA",
  "15": "Credit line secured",
  "17": "Home equity line of credit",
  "18": "Student loan",
  "19": "Consolidation",
  "20": "Business",
  "25": "Lease",
  "26": "Child support",
  "29": "Collection account",
  "47": "Credit card",
  "48": "Line of credit",
  "65": "Government",
  "67": "Government fee for service",
  "68": "Government employee advance",
  "69": "Government fine",
  "70": "Government miscellaneous",
  "71": "Government overpayment",
  "73": "Rental agreement",
  "89": "Medical debt",
  "90": "Debt buyer",
  "91": "Returned check",
  "92": "Telecom/utility",
  "93": "Debt consolidation",
  "95": "Home phone",
};

// ─── Metro 2 Violation Types ────────────────────────────────────────────────

export interface Metro2Violation {
  fieldName: string;
  fieldCode: string;
  reportedValue: string;
  expectedFormat: string;
  violationType: "invalid_code" | "format_error" | "logical_inconsistency" | "missing_required" | "date_error" | "status_conflict";
  severity: "critical" | "major" | "minor";
  disputeVector: string;
  crrReference: string;
  metro2Section: string;
}

// ─── Metro 2 Violation Detection ────────────────────────────────────────────

export function detectMetro2Violations(reportText: string): Metro2Violation[] {
  const violations: Metro2Violation[] = [];

  // Date format violations (Metro 2 requires MMDDYYYY or MMYYYY)
  const datePatterns = reportText.match(/(?:opened|reported|closed|last\s*(?:payment|activity))[\s:]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/gi);
  if (datePatterns) {
    for (const match of datePatterns) {
      // Check for non-standard date formats
      if (match.match(/\d{1,2}[-/]\d{1,2}[-/]\d{2}(?!\d)/)) {
        violations.push({
          fieldName: "Date Field",
          fieldCode: "Date Opened/Reported/Closed",
          reportedValue: match,
          expectedFormat: "MMDDYYYY or MMYYYY per Metro 2 Base Segment Field 14-19",
          violationType: "date_error",
          severity: "major",
          disputeVector: "Date reported in non-compliant format. Metro 2 requires MMDDYYYY (8 digits) or MMYYYY (6 digits) format. Two-digit year abbreviations violate field specifications.",
          crrReference: "CRRG Section 6, Base Segment Fields 14-19",
          metro2Section: "Base Segment - Date Fields",
        });
      }
    }
  }

  // Account status code inconsistencies
  const statusPatterns = reportText.match(/(?:status|account\s*status)[\s:]*([A-Z0-9]{2,3})/gi);
  if (statusPatterns) {
    for (const match of statusPatterns) {
      const code = match.replace(/(?:status|account\s*status)[\s:]*/i, "").trim();
      if (code.length === 2 && !METRO2_ACCOUNT_STATUS_CODES[code]) {
        violations.push({
          fieldName: "Account Status",
          fieldCode: "Field 17A",
          reportedValue: code,
          expectedFormat: "Valid 2-character status code per Metro 2 Base Segment Field 17A",
          violationType: "invalid_code",
          severity: "critical",
          disputeVector: `Account Status Code '${code}' is not a valid Metro 2 status code. Furnisher is reporting with a non-existent code in violation of Metro 2 format requirements.`,
          crrReference: "CRRG Section 6, Field 17A - Account Status",
          metro2Section: "Base Segment - Account Status",
        });
      }
    }
  }

  // Payment rating vs status logical inconsistency
  const paidStatuses = ["13", "61", "62", "63", "64", "65"];
  const delinquentRatings = ["1", "2", "3", "4", "5", "6", "G", "L"];

  // Check for balance reported on closed accounts
  if (reportText.match(/(?:closed|paid).*balance[\s:]*\$?[1-9]/i)) {
    violations.push({
      fieldName: "Current Balance",
      fieldCode: "Field 21",
      reportedValue: "Non-zero balance on closed/paid account",
      expectedFormat: "Balance must be $0 when Account Status indicates paid/closed (codes 13, 61-65)",
      violationType: "logical_inconsistency",
      severity: "critical",
      disputeVector: "Furnisher reports a non-zero balance on an account with a paid/closed status code. Per Metro 2 reporting standards, Field 21 (Current Balance) must be zero when Account Status (Field 17A) is 13 or 61-65.",
      crrReference: "CRRG Section 6, Field 21 - Current Balance; Cross-reference Field 17A",
      metro2Section: "Base Segment - Balance/Status Consistency",
    });
  }

  // Check for missing Date of First Delinquency on derogatory accounts
  if (reportText.match(/(?:collection|charge.?off|repossession|foreclosure)/i) &&
      !reportText.match(/(?:date\s*(?:of\s*)?first\s*delinquency|DOFD)/i)) {
    violations.push({
      fieldName: "Date of First Delinquency",
      fieldCode: "Field 25",
      reportedValue: "Missing/Not Reported",
      expectedFormat: "Required for all accounts with derogatory status per Metro 2 Field 25",
      violationType: "missing_required",
      severity: "critical",
      disputeVector: "Date of First Delinquency (Field 25) is required for all accounts reporting derogatory status. Absence of this field violates Metro 2 reporting requirements and prevents accurate calculation of the 7-year reporting period under FCRA §605(a).",
      crrReference: "CRRG Section 6, Field 25 - Date of First Delinquency",
      metro2Section: "Base Segment - Date of First Delinquency",
    });
  }

  // Check for payment history pattern violations
  const paymentHistory = reportText.match(/payment\s*history[\s:]*([0-9XCLG\-\s]{12,})/i);
  if (paymentHistory) {
    const history = paymentHistory[1].replace(/\s/g, "");
    // Check for impossible transitions (e.g., 0 to 4 without 1,2,3)
    for (let i = 1; i < history.length; i++) {
      const prev = parseInt(history[i - 1]);
      const curr = parseInt(history[i]);
      if (!isNaN(prev) && !isNaN(curr) && curr - prev > 1 && prev === 0) {
        violations.push({
          fieldName: "Payment History Profile",
          fieldCode: "Field 24 (K1 Segment)",
          reportedValue: `Jump from rating ${prev} to ${curr} without intermediate months`,
          expectedFormat: "Payment ratings must progress sequentially (0→1→2→3→4→5→6) per Metro 2 K1 Segment",
          violationType: "logical_inconsistency",
          severity: "major",
          disputeVector: `Payment history shows impossible progression from current (0) directly to ${curr * 30}+ days delinquent without intermediate delinquency months. This violates Metro 2 K1 Segment reporting logic.`,
          crrReference: "CRRG Section 8, K1 Segment - Payment History Profile",
          metro2Section: "K1 Segment - Payment History",
        });
        break;
      }
    }
  }

  // Payment rating code validation
  const ratingPattern = reportText.match(/(?:payment\s*rating|pay\s*status)[\s:]*([0-9GLX])/gi);
  if (ratingPattern) {
    for (const match of ratingPattern) {
      const code = match.replace(/(?:payment\s*rating|pay\s*status)[\s:]*/i, "").trim();
      if (code && !METRO2_PAYMENT_RATING_CODES[code]) {
        violations.push({
          fieldName: "Payment Rating",
          fieldCode: "Field 17B",
          reportedValue: code,
          expectedFormat: "Valid single-character payment rating per Metro 2 Base Segment Field 17B",
          violationType: "invalid_code",
          severity: "major",
          disputeVector: `Payment Rating Code '${code}' is not a valid Metro 2 payment rating. Valid codes are: ${Object.entries(METRO2_PAYMENT_RATING_CODES).map(([k, v]) => `${k}=${v}`).join(", ")}.`,
          crrReference: "CRRG Section 6, Field 17B - Payment Rating",
          metro2Section: "Base Segment - Payment Rating",
        });
      }
    }
  }

  // Special comment code validation
  const specialCommentPattern = reportText.match(/(?:special\s*comment|comment\s*code)[\s:]*([A-Z]{1,2})/gi);
  if (specialCommentPattern) {
    for (const match of specialCommentPattern) {
      const code = match.replace(/(?:special\s*comment|comment\s*code)[\s:]*/i, "").trim();
      if (code && !METRO2_SPECIAL_COMMENT_CODES[code]) {
        violations.push({
          fieldName: "Special Comment",
          fieldCode: "Field 19",
          reportedValue: code,
          expectedFormat: "Valid 1-2 character special comment code per Metro 2 Base Segment Field 19",
          violationType: "invalid_code",
          severity: "minor",
          disputeVector: `Special Comment Code '${code}' is not a recognized Metro 2 special comment. This may indicate non-standard reporting practices by the furnisher.`,
          crrReference: "CRRG Section 6, Field 19 - Special Comment",
          metro2Section: "Base Segment - Special Comment",
        });
      }
    }
  }

  // Compliance condition code validation
  const compliancePattern = reportText.match(/(?:compliance|condition\s*code)[\s:]*([A-Z]{2})/gi);
  if (compliancePattern) {
    for (const match of compliancePattern) {
      const code = match.replace(/(?:compliance|condition\s*code)[\s:]*/i, "").trim();
      if (code && code.startsWith("X") && !METRO2_COMPLIANCE_CONDITION_CODES[code]) {
        violations.push({
          fieldName: "Compliance Condition Code",
          fieldCode: "Field 20",
          reportedValue: code,
          expectedFormat: "Valid 2-character compliance condition code per Metro 2 Base Segment Field 20",
          violationType: "invalid_code",
          severity: "major",
          disputeVector: `Compliance Condition Code '${code}' is not a valid Metro 2 compliance code. Valid codes are: ${Object.entries(METRO2_COMPLIANCE_CONDITION_CODES).map(([k, v]) => `${k}=${v}`).join(", ")}.`,
          crrReference: "CRRG Section 6, Field 20 - Compliance Condition Code",
          metro2Section: "Base Segment - Compliance Condition Code",
        });
      }
    }
  }

  // ECOA code validation
  const ecoaPattern = reportText.match(/(?:ECOA|responsibility)[\s:]*([A-Z0-9])/gi);
  if (ecoaPattern) {
    for (const match of ecoaPattern) {
      const code = match.replace(/(?:ECOA|responsibility)[\s:]*/i, "").trim();
      if (code && !METRO2_ECOA_CODES[code]) {
        violations.push({
          fieldName: "ECOA Code",
          fieldCode: "Field 5",
          reportedValue: code,
          expectedFormat: "Valid single-character ECOA code per Metro 2 Base Segment Field 5",
          violationType: "invalid_code",
          severity: "major",
          disputeVector: `ECOA Code '${code}' is not a valid Metro 2 ECOA designation. Valid codes are: ${Object.entries(METRO2_ECOA_CODES).map(([k, v]) => `${k}=${v}`).join(", ")}.`,
          crrReference: "CRRG Section 6, Field 5 - ECOA Code",
          metro2Section: "Base Segment - ECOA Code",
        });
      }
    }
  }

  // Account type validation
  const accountTypePattern = reportText.match(/(?:account\s*type|type\s*of\s*account)[\s:]*([0-9]{2})/gi);
  if (accountTypePattern) {
    for (const match of accountTypePattern) {
      const code = match.replace(/(?:account\s*type|type\s*of\s*account)[\s:]*/i, "").trim();
      if (code && !METRO2_ACCOUNT_TYPE_CODES[code]) {
        violations.push({
          fieldName: "Account Type",
          fieldCode: "Field 13",
          reportedValue: code,
          expectedFormat: "Valid 2-digit account type code per Metro 2 Base Segment Field 13",
          violationType: "invalid_code",
          severity: "major",
          disputeVector: `Account Type Code '${code}' is not a recognized Metro 2 account type. Furnisher is using a non-standard code that does not conform to CDIA reporting specifications.`,
          crrReference: "CRRG Section 6, Field 13 - Account Type",
          metro2Section: "Base Segment - Account Type",
        });
      }
    }
  }

  return violations;
}

// ─── Dispute Strategy Definitions ───────────────────────────────────────────

export type DisputeStrategy =
  | "standard"
  | "metro2_compliance"
  | "procedural_violation"
  | "verification_demand"
  | "validation_demand"
  | "advanced_legal";

export interface StrategyDefinition {
  id: DisputeStrategy;
  name: string;
  description: string;
  legalBasis: string[];
  applicableTo: string[];
  letterType: "verification" | "validation" | "dispute" | "demand" | "conditional";
}

export const DISPUTE_STRATEGIES: Record<DisputeStrategy, StrategyDefinition> = {
  standard: {
    id: "standard",
    name: "Standard Factual Dispute",
    description: "Basic factual dispute citing inaccurate information under FCRA §611",
    legalBasis: ["FCRA §611(a)", "FCRA §623(b)"],
    applicableTo: ["all_accounts"],
    letterType: "dispute",
  },
  metro2_compliance: {
    id: "metro2_compliance",
    name: "Metro 2 Compliance Attack",
    description: "Challenge furnisher's data based on Metro 2 format violations. If reported data doesn't conform to CDIA Metro 2 standards, the reporting itself is defective regardless of underlying debt validity.",
    legalBasis: ["FCRA §623(a)(1)", "FCRA §611(a)(1)(A)", "Metro 2 Format Standards", "CRRG Compliance Requirements"],
    applicableTo: ["all_accounts"],
    letterType: "dispute",
  },
  procedural_violation: {
    id: "procedural_violation",
    name: "Procedural Violation Attack",
    description: "Challenge the bureau's investigation process itself — rubber-stamping, parroting furnisher data, exceeding 30-day window, or failure to conduct reasonable investigation.",
    legalBasis: ["FCRA §611(a)(1)(A)", "FCRA §611(a)(5)", "Cushman v. Trans Union (7th Cir.)", "Johnson v. MBNA (4th Cir.)"],
    applicableTo: ["previously_disputed", "reinvestigation"],
    letterType: "demand",
  },
  verification_demand: {
    id: "verification_demand",
    name: "Method of Verification Demand",
    description: "Force the bureau to disclose exactly HOW they verified disputed information. Under FCRA §611(a)(6)(B)(iii), consumers can request the method of verification.",
    legalBasis: ["FCRA §611(a)(6)(B)(iii)", "FCRA §611(a)(7)"],
    applicableTo: ["previously_verified"],
    letterType: "demand",
  },
  validation_demand: {
    id: "validation_demand",
    name: "Debt Validation Demand (FDCPA §809)",
    description: "Demand debt validation from collectors under FDCPA §809(b). Distinct from FCRA verification — requires collector to prove the debt is valid, accurate, and belongs to the consumer.",
    legalBasis: ["FDCPA §809(b)", "FDCPA §809(a)", "FDCPA §807"],
    applicableTo: ["collection_accounts", "debt_buyers"],
    letterType: "validation",
  },
  advanced_legal: {
    id: "advanced_legal",
    name: "Advanced Legal Theory",
    description: "Deploy sophisticated legal arguments: estoppel, laches, UCC Article 9, conditional acceptance, RESPA qualified written requests, permissible purpose challenges, and obsolete data calculations.",
    legalBasis: ["UCC Article 9", "RESPA §6", "FCRA §605(a)", "FCRA §604", "Equitable Estoppel", "Doctrine of Laches"],
    applicableTo: ["secured_debt", "mortgage", "aged_accounts", "hard_inquiries"],
    letterType: "conditional",
  },
};

// ─── Advanced Legal Sub-Strategies ──────────────────────────────────────────

export interface AdvancedSubStrategy {
  id: string;
  name: string;
  description: string;
  legalBasis: string;
  applicableScenario: string;
  keyLanguage: string;
}

export const ADVANCED_SUB_STRATEGIES: AdvancedSubStrategy[] = [
  {
    id: "estoppel",
    name: "Estoppel Argument",
    description: "If furnisher previously acknowledged an error or agreed to correction, they are estopped from re-reporting the same inaccurate information.",
    legalBasis: "Equitable Estoppel; FCRA §623(a)(2)",
    applicableScenario: "Furnisher previously acknowledged error in writing or verbally",
    keyLanguage: "Having previously acknowledged the inaccuracy of this reporting, [FURNISHER] is now equitably estopped from continuing to furnish this disputed information. Re-reporting previously acknowledged errors constitutes willful non-compliance under FCRA §623(a)(2).",
  },
  {
    id: "laches",
    name: "Laches Doctrine",
    description: "Challenge unreasonable delay in reporting or updating information that prejudices the consumer.",
    legalBasis: "Doctrine of Laches; FCRA §623(a)(2) duty to update",
    applicableScenario: "Furnisher delayed reporting for extended period causing prejudice",
    keyLanguage: "The doctrine of laches bars this reporting due to [FURNISHER]'s unreasonable and prejudicial delay in furnishing this information. The delay of [X] months/years between the alleged activity and initial reporting constitutes laches, particularly where the consumer has been prejudiced by inability to timely dispute.",
  },
  {
    id: "ucc_article_9",
    name: "UCC Article 9 Challenge",
    description: "For secured debt, challenge whether the creditor properly perfected their security interest and whether reporting is consistent with UCC Article 9 requirements.",
    legalBasis: "UCC Article 9; State commercial code",
    applicableScenario: "Secured debt (auto loans, secured credit cards, equipment financing)",
    keyLanguage: "Demand production of the original security agreement, proof of perfection (UCC-1 filing), and documentation that the secured party's interest was properly perfected under UCC Article 9. Absent proper perfection, the creditor's claim of secured status is defective and the account type code reported under Metro 2 Field 13 is inaccurate.",
  },
  {
    id: "conditional_acceptance",
    name: "Conditional Acceptance",
    description: "Accept the alleged debt conditionally upon furnisher providing specific documentary proof. Shifts burden of proof while preserving consumer's rights.",
    legalBasis: "UCC §3-311; Contract law principles",
    applicableScenario: "Any disputed account where furnisher has not provided documentation",
    keyLanguage: "I conditionally accept your claim of the alleged obligation upon proof of claim, specifically: (1) the original signed agreement bearing my wet-ink signature, (2) a complete accounting of all charges from inception, (3) proof of consideration, and (4) documentation of the chain of title if the debt has been assigned or sold. Absent satisfaction of these conditions, the alleged obligation is disputed and must be reported as such.",
  },
  {
    id: "method_of_verification",
    name: "Method of Verification Demand",
    description: "Force bureau to disclose the specific method used to verify disputed information, not just confirm it was 'verified.'",
    legalBasis: "FCRA §611(a)(6)(B)(iii); §611(a)(7)",
    applicableScenario: "After bureau responds with generic 'verified as accurate' without detail",
    keyLanguage: "Pursuant to FCRA §611(a)(6)(B)(iii), I demand disclosure of the method of verification used in your investigation. A generic statement that information was 'verified' is insufficient. Specifically disclose: (1) who was contacted at the furnisher, (2) what documents were reviewed, (3) what specific procedures were followed, and (4) the basis for concluding the information is accurate.",
  },
  {
    id: "respa_qwr",
    name: "Qualified Written Request (RESPA)",
    description: "For mortgage accounts, send a Qualified Written Request under RESPA §6 requiring the servicer to provide specific account information and correct errors.",
    legalBasis: "RESPA §6 (12 USC §2605); Regulation X §1024.35-36",
    applicableScenario: "Mortgage accounts with disputed information",
    keyLanguage: "This letter constitutes a Qualified Written Request pursuant to Section 6 of the Real Estate Settlement Procedures Act (12 USC §2605). Under RESPA and Regulation X §1024.36, you are required to acknowledge this request within 5 business days and provide a substantive response within 30 business days. Failure to comply subjects the servicer to actual damages, statutory damages up to $2,000 for individual actions, and attorney's fees.",
  },
  {
    id: "goodwill_adjustment",
    name: "Goodwill Adjustment Request",
    description: "Strategic supplement requesting removal of accurate but minor negative information as a goodwill gesture, citing positive account history.",
    legalBasis: "Voluntary furnisher discretion; No legal obligation",
    applicableScenario: "Minor late payments on otherwise positive accounts",
    keyLanguage: "I am requesting a goodwill adjustment to remove the [LATE PAYMENT] reported on [DATE]. I acknowledge this was reported accurately; however, given my [X] years of on-time payments and continued loyalty as a customer, I respectfully request this adjustment as a gesture of goodwill. This is a voluntary request and I understand you are under no legal obligation to comply.",
  },
  {
    id: "identity_theft_affidavit",
    name: "Identity Theft Affidavit Strategy",
    description: "For mixed file situations, use identity theft/mixed file procedures to challenge accounts that may belong to another consumer with similar identifying information.",
    legalBasis: "FCRA §605B; FCRA §611(a)(1)(A); FTC Identity Theft Report",
    applicableScenario: "Mixed file situations, accounts not belonging to consumer",
    keyLanguage: "The account referenced does not belong to me and appears to be the result of a mixed file or identity theft. Pursuant to FCRA §605B, I demand immediate blocking of this information. I have filed an identity theft report and am providing the FTC affidavit. You are required to block this information within 4 business days of receipt.",
  },
  {
    id: "obsolete_data",
    name: "Obsolete Data Challenge",
    description: "Calculate exact 7-year reporting period from Date of First Delinquency and challenge accounts reported beyond the statutory limit.",
    legalBasis: "FCRA §605(a); FCRA §605(c)",
    applicableScenario: "Accounts approaching or exceeding 7-year reporting limit",
    keyLanguage: "This account has exceeded the maximum reporting period under FCRA §605(a). The Date of First Delinquency was [DATE], making the 7-year reporting period expire on [CALCULATED DATE]. Continued reporting after this date violates FCRA §605(a) and subjects both the furnisher and CRA to liability under FCRA §616 and §617.",
  },
  {
    id: "permissible_purpose",
    name: "Permissible Purpose Challenge",
    description: "Challenge hard inquiries where the entity lacked permissible purpose under FCRA §604 to access the consumer's credit file.",
    legalBasis: "FCRA §604(a); FCRA §604(f); FCRA §616",
    applicableScenario: "Unauthorized hard inquiries",
    keyLanguage: "I did not authorize [COMPANY] to access my credit file and they lacked permissible purpose under FCRA §604. I did not apply for credit, insurance, or employment with this entity, nor did I initiate any transaction that would constitute written authorization. This unauthorized access violates FCRA §604(f) and I demand immediate removal of this inquiry.",
  },
  {
    id: "direct_to_furnisher",
    name: "Direct-to-Furnisher Dispute (§623)",
    description: "Bypass the bureau and dispute directly with the furnisher under FCRA §623, triggering their independent investigation obligations.",
    legalBasis: "FCRA §623(a)(8); FCRA §623(b)",
    applicableScenario: "After initial bureau dispute, or for furnisher-specific issues",
    keyLanguage: "Pursuant to FCRA §623(a)(8)(E), I am disputing this information directly with you as the furnisher. Upon receipt of this dispute, you are required to: (1) conduct an investigation, (2) review all relevant information provided, (3) report results to all CRAs to which you furnished the disputed information, and (4) modify, delete, or permanently block reporting if found inaccurate or unverifiable.",
  },
];

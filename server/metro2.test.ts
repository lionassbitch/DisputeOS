import { describe, expect, it } from "vitest";
import { detectMetro2Violations, DISPUTE_STRATEGIES, ADVANCED_SUB_STRATEGIES, METRO2_ACCOUNT_STATUS_CODES, METRO2_ECOA_CODES } from "./metro2";

describe("Metro 2 Violation Detection", () => {
  it("detects non-zero balance on closed accounts", () => {
    const text = "Account closed on 01/2020. Current balance: $1,500 remaining.";
    const violations = detectMetro2Violations(text);
    const balanceViolation = violations.find(v => v.fieldName === "Current Balance");
    expect(balanceViolation).toBeDefined();
    expect(balanceViolation?.severity).toBe("critical");
    expect(balanceViolation?.violationType).toBe("logical_inconsistency");
  });

  it("detects missing Date of First Delinquency on collections", () => {
    const text = "Account Type: Collection\nStatus: Charge-off\nBalance: $500";
    const violations = detectMetro2Violations(text);
    const dofdViolation = violations.find(v => v.fieldName === "Date of First Delinquency");
    expect(dofdViolation).toBeDefined();
    expect(dofdViolation?.severity).toBe("critical");
    expect(dofdViolation?.violationType).toBe("missing_required");
  });

  it("returns empty array for clean report text", () => {
    const text = "This is a clean report with no violations. Date of First Delinquency: 01/15/2020";
    const violations = detectMetro2Violations(text);
    // Should not detect balance violation or DOFD missing
    const balanceViolation = violations.find(v => v.fieldName === "Current Balance");
    expect(balanceViolation).toBeUndefined();
  });
});

describe("Dispute Strategies", () => {
  it("defines all 6 strategies", () => {
    expect(Object.keys(DISPUTE_STRATEGIES)).toHaveLength(6);
    expect(DISPUTE_STRATEGIES.standard).toBeDefined();
    expect(DISPUTE_STRATEGIES.metro2_compliance).toBeDefined();
    expect(DISPUTE_STRATEGIES.procedural_violation).toBeDefined();
    expect(DISPUTE_STRATEGIES.verification_demand).toBeDefined();
    expect(DISPUTE_STRATEGIES.validation_demand).toBeDefined();
    expect(DISPUTE_STRATEGIES.advanced_legal).toBeDefined();
  });

  it("each strategy has required fields", () => {
    for (const strategy of Object.values(DISPUTE_STRATEGIES)) {
      expect(strategy.id).toBeDefined();
      expect(strategy.name).toBeDefined();
      expect(strategy.description).toBeDefined();
      expect(strategy.legalBasis.length).toBeGreaterThan(0);
      expect(strategy.letterType).toBeDefined();
    }
  });

  it("metro2_compliance strategy cites Metro 2 standards", () => {
    const metro2 = DISPUTE_STRATEGIES.metro2_compliance;
    expect(metro2.legalBasis).toContain("Metro 2 Format Standards");
    expect(metro2.legalBasis).toContain("CRRG Compliance Requirements");
  });

  it("validation_demand is distinct from verification_demand", () => {
    const validation = DISPUTE_STRATEGIES.validation_demand;
    const verification = DISPUTE_STRATEGIES.verification_demand;
    expect(validation.legalBasis).toContain("FDCPA §809(b)");
    expect(verification.legalBasis).toContain("FCRA §611(a)(6)(B)(iii)");
    expect(validation.letterType).toBe("validation");
    expect(verification.letterType).toBe("demand");
  });
});

describe("Advanced Sub-Strategies", () => {
  it("defines at least 11 sub-strategies", () => {
    expect(ADVANCED_SUB_STRATEGIES.length).toBeGreaterThanOrEqual(11);
  });

  it("includes all required sub-strategies", () => {
    const ids = ADVANCED_SUB_STRATEGIES.map(s => s.id);
    expect(ids).toContain("estoppel");
    expect(ids).toContain("laches");
    expect(ids).toContain("ucc_article_9");
    expect(ids).toContain("conditional_acceptance");
    expect(ids).toContain("method_of_verification");
    expect(ids).toContain("respa_qwr");
    expect(ids).toContain("goodwill_adjustment");
    expect(ids).toContain("identity_theft_affidavit");
    expect(ids).toContain("obsolete_data");
    expect(ids).toContain("permissible_purpose");
    expect(ids).toContain("direct_to_furnisher");
  });

  it("each sub-strategy has key language", () => {
    for (const sub of ADVANCED_SUB_STRATEGIES) {
      expect(sub.keyLanguage.length).toBeGreaterThan(50);
      expect(sub.legalBasis.length).toBeGreaterThan(0);
    }
  });
});

describe("Metro 2 Code Tables", () => {
  it("account status codes include common values", () => {
    expect(METRO2_ACCOUNT_STATUS_CODES["11"]).toBe("Current");
    expect(METRO2_ACCOUNT_STATUS_CODES["97"]).toBe("Charge-off");
    expect(METRO2_ACCOUNT_STATUS_CODES["13"]).toBe("Paid or closed/zero balance");
  });

  it("ECOA codes include standard designations", () => {
    expect(METRO2_ECOA_CODES["1"]).toBe("Individual");
    expect(METRO2_ECOA_CODES["2"]).toBe("Joint contractual liability");
    expect(METRO2_ECOA_CODES["3"]).toBe("Authorized user");
  });
});

import { describe, expect, it } from "vitest";
import type {
  AccessDecision,
  AccessEvaluationInput,
  AccessEvaluationResult
} from "./index";

describe("@kynovia/access-engine", () => {
  it("supports typed access evaluation inputs", () => {
    const input = {
      tenantId: "tenant_123",
      condominiumId: "condominium_123",
      subjectId: "subject_123",
      requestedAt: "2026-05-18T00:00:00.000Z"
    } satisfies AccessEvaluationInput;

    expect(input.condominiumId).toBe("condominium_123");
  });

  it("supports typed access decisions", () => {
    const decision = "review" satisfies AccessDecision;
    const result = {
      decision,
      reason: "Smoke test contract"
    } satisfies AccessEvaluationResult;

    expect(result.decision).toBe("review");
  });
});

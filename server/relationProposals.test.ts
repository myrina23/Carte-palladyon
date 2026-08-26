import { describe, expect, it } from "vitest";
import { relationProposalInput } from "./routers";

const validProposal = {
  sourceActor: "France",
  targetActor: "Union européenne",
  relationType: "juridique",
  title: "Participation à un cadre institutionnel",
  detail: "Proposition sourcée pour documenter une relation institutionnelle et sa période de validité.",
  sourceUrl: "https://www.wikidata.org/wiki/Q142",
  startYear: 1958,
};

describe("relationProposalInput", () => {
  it("accepts a sourced proposal with an optional temporal qualifier", () => {
    expect(relationProposalInput.safeParse(validProposal).success).toBe(true);
  });

  it("rejects a proposal whose end date is earlier than its start date", () => {
    const result = relationProposalInput.safeParse({ ...validProposal, endYear: 1945 });
    expect(result.success).toBe(false);
  });

  it("requires a verifiable source URL", () => {
    const result = relationProposalInput.safeParse({ ...validProposal, sourceUrl: "source locale" });
    expect(result.success).toBe(false);
  });
});

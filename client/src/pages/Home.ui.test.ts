import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const homeSource = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");
const worldStyles = readFileSync(new URL("./world.css", import.meta.url), "utf8");
const relationStyles = readFileSync(new URL("./relations.css", import.meta.url), "utf8");

describe("Atlas Flux · contrats d’interface cartographique", () => {
  it("présente des interrupteurs de typologie plutôt que des états textuels", () => {
    expect(homeSource).toContain('role="switch"');
    expect(homeSource).toContain('className="apple-toggle"');
    expect(relationStyles).toContain(".apple-toggle");
    expect(relationStyles).toContain(".relation-type-grid-expanded{max-height:none;overflow:visible");
  });

  it("propose une timeline à deux bornes et un éditeur de dates à la demande", () => {
    expect(homeSource).toContain('className="timeline-range-start"');
    expect(homeSource).toContain('className="timeline-range-end"');
    expect(homeSource).toContain('className="timeline-date-editor"');
    expect(relationStyles).toContain(".timeline-boundary-dates");
  });

  it("conserve une recherche centrée, des filtres à gauche et une introduction dismissible", () => {
    expect(worldStyles).toContain(".world-filter-panel{right:auto;left:1.6rem}");
    expect(worldStyles).toContain(".world-search{right:auto;left:50%");
    expect(homeSource).toContain("setIsIntroVisible(false)");
    expect(worldStyles).toContain(".world-intro.is-dismissed");
  });
});

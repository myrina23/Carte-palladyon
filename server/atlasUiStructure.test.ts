import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const homeSource = readFileSync(new URL("../client/src/pages/Home.tsx", import.meta.url), "utf8");
const worldStyles = readFileSync(new URL("../client/src/pages/world.css", import.meta.url), "utf8");
const relationStyles = readFileSync(new URL("../client/src/pages/relations.css", import.meta.url), "utf8");

describe("Atlas Flux · contrats d’interface cartographique", () => {
  it("présente des interrupteurs de typologie sans indicateur textuel", () => {
    expect(homeSource).toContain('role="switch"');
    expect(homeSource).toContain('className="apple-toggle"');
    expect(relationStyles).toContain(".apple-toggle");
    expect(relationStyles).toContain(".relation-type-grid-expanded{max-height:none;overflow:visible");
  });

  it("propose une timeline à deux bornes et un éditeur de dates à la demande", () => {
    expect(homeSource).toContain('className="timeline-range-start"');
    expect(homeSource).toContain('className="timeline-range-end"');
    expect(homeSource).toContain('className="timeline-handle-label is-start"');
    expect(homeSource).toContain('className="timeline-handle-label is-end"');
    expect(homeSource).toContain('className="timeline-date-editor"');
    expect(relationStyles).toContain(".timeline-boundary-dates");
  });

  it("conserve une recherche centrée, des filtres à gauche et une introduction dismissible", () => {
    expect(worldStyles).toContain(".world-filter-panel{right:auto;left:1.6rem}");
    expect(worldStyles).toContain(".world-search{right:auto;left:50%");
    expect(homeSource).toContain("setIsIntroVisible(false)");
    expect(worldStyles).toContain(".world-intro.is-dismissed");
    expect(relationStyles).toContain(".timeline-handle-label");
  });
});

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const homeSource = readFileSync(new URL("../client/src/pages/Home.tsx", import.meta.url), "utf8");
const worldStyles = readFileSync(new URL("../client/src/pages/world.css", import.meta.url), "utf8");
const relationStyles = readFileSync(new URL("../client/src/pages/relations.css", import.meta.url), "utf8");
const timelineRefinementStyles = readFileSync(new URL("../client/src/pages/timeline-refinement.css", import.meta.url), "utf8");
const timelineSegmentStyles = readFileSync(new URL("../client/src/pages/timeline-segment.css", import.meta.url), "utf8");
const palladyonStyles = readFileSync(new URL("../client/src/pages/palladyon-adoption.css", import.meta.url), "utf8");
const palladyonSwitch = readFileSync(new URL("../client/src/components/ui/switch.tsx", import.meta.url), "utf8");
const palladyonSlider = readFileSync(new URL("../client/src/components/ui/slider.tsx", import.meta.url), "utf8");
const palladyonScrollArea = readFileSync(new URL("../client/src/components/ui/scroll-area.tsx", import.meta.url), "utf8");
const palladyonLayoutStyles = readFileSync(new URL("../client/src/pages/palladyon-layout.css", import.meta.url), "utf8");
const atlasDock = readFileSync(new URL("../client/src/components/palladyon/AtlasDock.tsx", import.meta.url), "utf8");
const atlasMorphingPopover = readFileSync(new URL("../client/src/components/palladyon/AtlasMorphingPopover.tsx", import.meta.url), "utf8");

describe("Atlas Flux · contrats d’interface cartographique", () => {
  it("présente des interrupteurs Palladyon de typologie sans indicateur textuel", () => {
    expect(homeSource).toContain('import { Switch } from "@/components/ui/switch"');
    expect(homeSource).toContain("<Switch checked={visibleRelationTypes[type.id]}");
    expect(palladyonSwitch).toContain("primitive Switch fournie dans l’archive Palladyon");
    expect(palladyonStyles).toContain("[data-slot=switch]");
    expect(relationStyles).toContain(".relation-type-grid-expanded{max-height:none;overflow:visible");
  });

  it("propose une timeline à deux bornes dans un segment unique et un popover de dates direct", () => {
    expect(homeSource).toContain('className="timeline-handle-label is-start"');
    expect(homeSource).toContain('className="timeline-handle-label is-end"');
    expect(homeSource).toContain('className="timeline-date-editor"');
    expect(homeSource).toContain("timeline-wheel-picker");
    expect(homeSource).toContain('className="atlas-palladyon-range"');
    expect(homeSource).toContain('import { Slider } from "@/components/ui/slider"');
    expect(homeSource).toContain("minStepsBetweenThumbs={1}");
    expect(homeSource).not.toContain('className="timeline-boundary-dates"');
    expect(timelineRefinementStyles).toContain(".timeline-date-popover");
    expect(timelineSegmentStyles).toContain(".relation-timeline .timeline-range-control{grid-column:1/-1;width:100%");
    expect(palladyonSlider).toContain("primitive Slider fournie dans l’archive Palladyon");
    expect(palladyonStyles).toContain(".atlas-palladyon-range");
  });

  it("conserve une recherche centrée, des filtres à gauche et une introduction dismissible", () => {
    expect(worldStyles).toContain(".world-filter-panel{right:auto;left:1.6rem}");
    expect(worldStyles).toContain(".world-search{right:auto;left:50%");
    expect(homeSource).toContain("setIsIntroVisible(false)");
    expect(worldStyles).toContain(".world-intro.is-dismissed");
    expect(relationStyles).toContain(".timeline-handle-label");
    expect(homeSource).not.toContain("demo-corpus-chip");
    expect(timelineRefinementStyles).toContain(".world-filter-panel::-webkit-scrollbar-thumb");
  });

  it("utilise les primitives Palladyon étendues pour les actions, fiches et sources", () => {
    expect(homeSource).toContain('import { AtlasDock, AtlasDockIcon, AtlasDockItem } from "@/components/palladyon/AtlasDock"');
    expect(homeSource).toContain('import { AtlasMorphingContent, AtlasMorphingPopover, AtlasMorphingTrigger } from "@/components/palladyon/AtlasMorphingPopover"');
    expect(homeSource).toContain('<AtlasDock>');
    expect(homeSource).toContain('<AtlasMorphingPopover open={Boolean(selectedRelation)}');
    expect(homeSource).toContain('<ScrollArea className="palladyon-source-scroll">');
    expect(atlasDock).toContain('role="toolbar"');
    expect(atlasMorphingPopover).toContain('layoutId={`atlas-morph-trigger-${context.id}`}');
    expect(palladyonLayoutStyles).toContain('.world-map-action-bar{display:none!important}');
    expect(palladyonLayoutStyles).toContain('.palladyon-source-scroll');
    expect(palladyonScrollArea).toContain("primitive ScrollArea fournie dans l’archive Palladyon");
  });
});

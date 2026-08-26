import { composeMapCanvases, createAtlasPdfReport, createBilateralCsv, type AtlasExportRelation } from "../client/src/lib/atlasExports";
import { describe, expect, it } from "vitest";

const pixel = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
const relation: AtlasExportRelation = { source: "Turquie", target: "Grèce", type: "geopolitique", typeLabel: "Géopolitique", color: [32, 196, 217], title: "Tensions régionales", period: "1974–aujourd’hui", detail: "Relation géopolitique sourcée pour vérifier le rapport analytique.", sourceLabel: "Wikidata", sourceUrl: "https://www.wikidata.org/wiki/Q43" };

describe("exports Atlas Flux", () => {
  it("produces the Atlas Flux analytical PDF with map image, colored chart and sources", () => {
    const report = createAtlasPdfReport({ eyebrow: "ATLAS FLUX / SNAPSHOT D’ANALYSE", headline: "Turquie", metadata: ["Instant : 2024", "Typologies actives : Géopolitique"], relations: [relation], mapImage: pixel });

    const output = report.output("arraybuffer");
    expect(output.byteLength).toBeGreaterThan(800);
  });

  it("produces the Atlas Flux UTF-8 bilateral CSV with source provenance", async () => {
    const csv = createBilateralCsv([relation]);
    const payload = new Blob([csv], { type: "text/csv;charset=utf-8" });
    expect(payload.type).toBe("text/csv;charset=utf-8");
    expect(await payload.text()).toContain("Turquie;Grèce;Géopolitique");
    expect(await payload.text()).toContain("https://www.wikidata.org/wiki/Q43");
  });

  it("composes all visible map canvases into the PNG used by the PDF export", () => {
    const draws: unknown[][] = [];
    const composite = {
      width: 0,
      height: 0,
      getContext: () => ({ drawImage: (...args: unknown[]) => draws.push(args) }),
      toDataURL: () => pixel,
    };
    const mapImage = composeMapCanvases([
      { width: 1280, height: 720, getContext: () => null, toDataURL: () => "maplibre" },
      { width: 1280, height: 720, getContext: () => null, toDataURL: () => "deckgl" },
    ], () => composite as any);

    expect(mapImage).toBe(pixel);
    expect(composite.width).toBe(1280);
    expect(composite.height).toBe(720);
    expect(draws).toHaveLength(2);
  });

  it("builds a cartographic PDF state with active region, relation type and 3D mode metadata", () => {
    const composite = {
      width: 0,
      height: 0,
      getContext: () => ({ drawImage: () => undefined }),
      toDataURL: () => pixel,
    };
    const mapImage = composeMapCanvases([{ width: 1440, height: 900, getContext: () => null, toDataURL: () => "map" }], () => composite as any);
    const report = createAtlasPdfReport({
      eyebrow: "ATLAS FLUX / EXPORT CARTOGRAPHIQUE",
      headline: "Relevé Europe",
      metadata: ["Instant : 2024 · Vue : Globe 3D · Mode : network", "Région : Europe · Typologies : Géopolitique"],
      relations: [relation],
      mapImage,
    });

    expect(mapImage).toBe(pixel);
    expect(report.output("arraybuffer").byteLength).toBeGreaterThan(800);
  });
});

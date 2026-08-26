import { jsPDF } from "jspdf";

export type AtlasExportRelation = {
  source: string;
  target: string;
  type: string;
  typeLabel: string;
  color: [number, number, number];
  title: string;
  period: string;
  detail: string;
  sourceLabel: string;
  sourceUrl: string;
};

export type AtlasPdfReport = {
  eyebrow: string;
  headline: string;
  metadata: string[];
  relations: AtlasExportRelation[];
  mapImage?: string | null;
};

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return /[;"\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function createBilateralCsv(relations: AtlasExportRelation[]) {
  const rows = [["Pays A", "Pays B", "Type", "Relation", "Période", "Détail", "Source", "Lien"], ...relations.map((relation) => [relation.source, relation.target, relation.typeLabel, relation.title, relation.period, relation.detail, relation.sourceLabel, relation.sourceUrl])];
  return `\ufeff${rows.map((row) => row.map(csvCell).join(";")).join("\n")}`;
}

function drawRelationChart(report: jsPDF, relations: AtlasExportRelation[], y: number) {
  const grouped = Array.from(relations.reduce((entries, relation) => {
    const current = entries.get(relation.type) ?? { label: relation.typeLabel, color: relation.color, count: 0 };
    current.count += 1;
    entries.set(relation.type, current);
    return entries;
  }, new Map<string, { label: string; color: [number, number, number]; count: number }>()).values());
  report.setTextColor(31, 47, 57);
  report.setFontSize(10);
  report.text("RÉPARTITION DES TYPOLOGIES", 42, y);
  if (!grouped.length) { report.setTextColor(91, 112, 112); report.setFontSize(8); report.text("Aucune relation dans ce périmètre.", 42, y + 15); return y + 30; }
  const maximum = Math.max(...grouped.map((entry) => entry.count), 1);
  let cursor = y + 16;
  grouped.forEach((entry) => {
    report.setTextColor(72, 91, 96); report.setFontSize(7); report.text(entry.label, 42, cursor + 7);
    report.setFillColor(225, 231, 224); report.rect(145, cursor, 250, 9, "F");
    report.setFillColor(...entry.color); report.rect(145, cursor, Math.max(5, (entry.count / maximum) * 250), 9, "F");
    report.setTextColor(31, 47, 57); report.setFontSize(8); report.text(String(entry.count), 404, cursor + 7);
    cursor += 15;
  });
  return cursor + 8;
}

export function createAtlasPdfReport(specification: AtlasPdfReport) {
  const report = new jsPDF({ unit: "pt", format: "a4" });
  report.setFillColor(16, 26, 36); report.rect(0, 0, 595, 118, "F");
  report.setTextColor(255, 107, 53); report.setFontSize(10); report.text(specification.eyebrow, 42, 42);
  report.setTextColor(246, 240, 229); report.setFontSize(23); report.text(specification.headline, 42, 78);
  report.setTextColor(31, 47, 57); report.setFontSize(10);
  specification.metadata.forEach((line, index) => report.text(line, 42, 150 + index * 17));
  let y = 150 + specification.metadata.length * 17 + 12;
  if (specification.mapImage) {
    try { report.addImage(specification.mapImage, "PNG", 42, y, 511, 220); y += 242; } catch { /* La carte reste optionnelle si son canevas n’est pas exportable. */ }
  }
  y = drawRelationChart(report, specification.relations, y);
  if (!specification.relations.length) { report.setTextColor(91, 112, 112); report.setFontSize(10); report.text("Aucune relation dans ce périmètre.", 42, y); return report; }
  specification.relations.forEach((relation) => {
    if (y > 720) { report.addPage(); y = 50; }
    report.setTextColor(...relation.color); report.setFontSize(10); report.text(`${relation.typeLabel.toUpperCase()} · ${relation.period}`, 42, y);
    report.setTextColor(31, 47, 57); report.setFontSize(14); report.text(relation.title, 42, y + 21);
    report.setFontSize(10); const lines = report.splitTextToSize(relation.detail, 500); report.text(lines, 42, y + 39);
    report.setTextColor(91, 112, 112); report.setFontSize(8); report.text(`Source : ${relation.sourceLabel} — ${relation.sourceUrl}`, 42, y + 39 + lines.length * 12 + 13);
    y += 83 + lines.length * 12;
  });
  return report;
}

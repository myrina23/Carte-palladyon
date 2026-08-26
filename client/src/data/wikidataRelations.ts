/**
 * Atlas Flux — relations résolues depuis l’export SPARQL Wikidata transmis.
 * Propriétés : P47 (partage une frontière avec) et P463 (membre de).
 * Chaque relation conserve les URI Wikidata des entités pour sa provenance.
 */
export type WikidataResolvedRelation = {
  id: string;
  source: { id: string; qid: string; name: string; position: [number, number] };
  target: { id: string; qid: string; name: string; position: [number, number] };
  property: "P47" | "P463";
  type: "geopolitique" | "juridique";
  title: string;
  detail: string;
  start: number;
};

const turkey = { id: "TUR", qid: "Q43", name: "Turquie", position: [32.8597, 39.9334] as [number, number] };
const unitedStates = { id: "USA", qid: "Q30", name: "États-Unis", position: [-77.0369, 38.9072] as [number, number] };
const bulgaria = { id: "BGR", qid: "Q219", name: "Bulgarie", position: [23.3219, 42.6977] as [number, number] };
const unitedNations = { id: "UN", qid: "Q1065", name: "Organisation des Nations unies", position: [-74.006, 40.7128] as [number, number] };
const worldTradeOrganization = { id: "WTO", qid: "Q7825", name: "Organisation mondiale du commerce", position: [6.1432, 46.2044] as [number, number] };

export const WIKIDATA_RESOLVED_RELATIONS: WikidataResolvedRelation[] = [
  { id: "wd-tur-greece-border", source: turkey, target: { id: "GRC", qid: "Q41", name: "Grèce", position: [23.7275, 37.9838] }, property: "P47", type: "geopolitique", title: "Frontière Turquie–Grèce", detail: "Relation de voisinage territorial (P47) résolue depuis l’export Wikidata fourni.", start: 1923 },
  { id: "wd-tur-bulgaria-border", source: turkey, target: bulgaria, property: "P47", type: "geopolitique", title: "Frontière Turquie–Bulgarie", detail: "Relation de voisinage territorial (P47) résolue depuis l’export Wikidata fourni.", start: 1908 },
  { id: "wd-tur-azerbaijan-border", source: turkey, target: { id: "AZE", qid: "Q227", name: "Azerbaïdjan", position: [49.8671, 40.4093] }, property: "P47", type: "geopolitique", title: "Frontière Turquie–Azerbaïdjan", detail: "Relation de voisinage territorial (P47) résolue depuis l’export Wikidata fourni.", start: 1991 },
  { id: "wd-tur-georgia-border", source: turkey, target: { id: "GEO", qid: "Q230", name: "Géorgie", position: [44.8015, 41.7151] }, property: "P47", type: "geopolitique", title: "Frontière Turquie–Géorgie", detail: "Relation de voisinage territorial (P47) résolue depuis l’export Wikidata fourni.", start: 1991 },
  { id: "wd-tur-armenia-border", source: turkey, target: { id: "ARM", qid: "Q399", name: "Arménie", position: [44.5152, 40.1872] }, property: "P47", type: "geopolitique", title: "Frontière Turquie–Arménie", detail: "Relation de voisinage territorial (P47) résolue depuis l’export Wikidata fourni.", start: 1991 },
  { id: "wd-tur-iran-border", source: turkey, target: { id: "IRN", qid: "Q794", name: "Iran", position: [51.389, 35.6892] }, property: "P47", type: "geopolitique", title: "Frontière Turquie–Iran", detail: "Relation de voisinage territorial (P47) résolue depuis l’export Wikidata fourni.", start: 1979 },
  { id: "wd-tur-iraq-border", source: turkey, target: { id: "IRQ", qid: "Q796", name: "Irak", position: [44.3661, 33.3152] }, property: "P47", type: "geopolitique", title: "Frontière Turquie–Irak", detail: "Relation de voisinage territorial (P47) résolue depuis l’export Wikidata fourni.", start: 1932 },
  { id: "wd-tur-syria-border", source: turkey, target: { id: "SYR", qid: "Q858", name: "Syrie", position: [36.2765, 33.5138] }, property: "P47", type: "geopolitique", title: "Frontière Turquie–Syrie", detail: "Relation de voisinage territorial (P47) résolue depuis l’export Wikidata fourni.", start: 1946 },
  { id: "wd-usa-canada-border", source: unitedStates, target: { id: "CAN", qid: "Q16", name: "Canada", position: [-75.6972, 45.4215] }, property: "P47", type: "geopolitique", title: "Frontière États-Unis–Canada", detail: "Relation de voisinage territorial (P47) résolue depuis l’export Wikidata fourni.", start: 1867 },
  { id: "wd-usa-mexico-border", source: unitedStates, target: { id: "MEX", qid: "Q96", name: "Mexique", position: [-99.1332, 19.4326] }, property: "P47", type: "geopolitique", title: "Frontière États-Unis–Mexique", detail: "Relation de voisinage territorial (P47) résolue depuis l’export Wikidata fourni.", start: 1848 },
  { id: "wd-tur-un", source: turkey, target: unitedNations, property: "P463", type: "juridique", title: "Membre de l’Organisation des Nations unies", detail: "Appartenance organisationnelle (P463) résolue depuis l’export Wikidata fourni.", start: 1945 },
  { id: "wd-usa-un", source: unitedStates, target: unitedNations, property: "P463", type: "juridique", title: "Membre de l’Organisation des Nations unies", detail: "Appartenance organisationnelle (P463) résolue depuis l’export Wikidata fourni.", start: 1945 },
  { id: "wd-bgr-un", source: bulgaria, target: unitedNations, property: "P463", type: "juridique", title: "Membre de l’Organisation des Nations unies", detail: "Appartenance organisationnelle (P463) résolue depuis l’export Wikidata fourni.", start: 1955 },
  { id: "wd-usa-wto", source: unitedStates, target: worldTradeOrganization, property: "P463", type: "juridique", title: "Membre de l’Organisation mondiale du commerce", detail: "Appartenance organisationnelle (P463) résolue depuis l’export Wikidata fourni.", start: 1995 },
];

export function wikidataUrl(qid: string) {
  return `https://www.wikidata.org/wiki/${qid}`;
}

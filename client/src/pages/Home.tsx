/* Atlas Flux Monde — observatoire géopolitique : cartographie éditoriale sombre, relations temporelles et lecture multi-échelle. */
import DeckGL from "@deck.gl/react";
import { _GlobeView as GlobeView, FlyToInterpolator } from "@deck.gl/core";
import { ArcLayer, GeoJsonLayer, ScatterplotLayer, TextLayer } from "@deck.gl/layers";
import { HeatmapLayer } from "@deck.gl/aggregation-layers";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { composeMapCanvases, createAtlasPdfReport, createBilateralCsv } from "@/lib/atlasExports";
import Map, { NavigationControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import "./world.css";
import "./relations.css";
import {
  Activity,
  ArrowUpRight,
  BookOpen,
  Building2,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  Crosshair,
  Database,
  ExternalLink,
  Eye,
  EyeOff,
  FileSpreadsheet,
  FileText,
  Filter,
  GitCompareArrows,
  Globe2,
  Layers3,
  LocateFixed,
  MapPin,
  Moon,
  Landmark,
  PenLine,
  Printer,
  Radar,
  Search,
  Share2,
  Sun,
  UsersRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { UCDP_CONFLICT_CELLS, UCDP_GED_PERIOD, UCDP_GED_SOURCE, type UcdpConflictCell } from "@/data/ucdpConflictData";
import { WIKIDATA_ORGANIZATIONS, WIKIDATA_RESOLVED_RELATIONS, wikidataPropertyUrl, wikidataUrl } from "@/data/wikidataRelations";

type IndicatorId = "gdp" | "population" | "defense";
type RegionId = "all" | "europe" | "americas" | "africa" | "asia" | "mena";
type ViewId = "world" | "europe" | "americas" | "indoPacific" | "africaMena";
type DisplayMode = "map" | "globe" | "tactical";
type AnalysisMode = "network" | "conflict" | "evolution" | "multilateral";
type RelationType = "geopolitique" | "militaire" | "economique" | "commercial" | "technologique" | "scientifique" | "culturel" | "historique" | "migratoire" | "ressources" | "securitaire" | "ideologique" | "financier" | "numerique" | "juridique";

type CountryApiRecord = {
  id: string;
  iso2Code: string;
  name: string;
  region: { id: string; value: string };
  capitalCity: string;
  longitude: string;
  latitude: string;
};

type IndicatorApiRecord = { countryiso3code: string; date: string; value: number | null };
type WorldBankResponse<T> = [{ page: number; pages: number }, T[] | null];

type CountryDatum = {
  iso3: string;
  iso2: string;
  name: string;
  capital: string;
  region: RegionId;
  position: [number, number];
  indicators: Record<IndicatorId, Partial<Record<number, number>>>;
  entityKind?: "country" | "territory";
  sovereign?: string;
  status?: string;
};

type Organization = {
  id: string;
  name: string;
  acronym: string;
  position: [number, number];
  description: string;
};

type RelationActor = { id: string; name: string; position: [number, number] };
type Relation = {
  id: string;
  source: RelationActor;
  target: RelationActor;
  type: RelationType;
  title: string;
  start?: number;
  end?: number;
  temporalScope?: "structural";
  detail: string;
  provenance?: string;
  dataset?: "sourced" | "demonstration";
};

type ViewConfig = { id: ViewId; label: string; short: string; longitude: number; latitude: number; zoom: number };
type SearchEntry = { id: string; label: string; kind: "Pays" | "Territoire" | "Organisation" | "Zone"; position: [number, number]; country?: CountryDatum; organization?: Organization; region?: RegionId; flag?: string };
type SavedSnapshot = { name: string; createdAt: string; regions: RegionId[]; organizationIds: string[]; relationTypes: RelationType[]; periodStart: string; periodEnd: string; displayMode: DisplayMode; analysisMode: AnalysisMode; timelineYear: number; gravityThreshold: number };

const INDICATOR_YEARS = [2024, 2023, 2022] as const;
const GRAVITY_FILTERS = [{ value: 0, label: "Tous" }, { value: 500, label: "500+" }, { value: 2000, label: "2 k+" }, { value: 10000, label: "10 k+" }];
const ATLAS_DARK_VECTOR_STYLE = {
  version: 8,
  sources: {},
  layers: [
    { id: "atlas-night", type: "background", paint: { "background-color": "#071424" } },
  ],
} as const;
const ATLAS_LIGHT_VECTOR_STYLE = {
  version: 8,
  sources: {},
  layers: [
    { id: "atlas-day", type: "background", paint: { "background-color": "#e9f3f7" } },
  ],
} as const;
const ATLAS_CONTINENT_LABELS = [
  { label: "AMÉRIQUES", position: [-88, 17] as [number, number] },
  { label: "EUROPE", position: [16, 51] as [number, number] },
  { label: "AFRIQUE", position: [20, 5] as [number, number] },
  { label: "ASIE", position: [96, 35] as [number, number] },
  { label: "OCÉANIE", position: [140, -25] as [number, number] },
];
const WORLD_BANK_API = "https://api.worldbank.org/v2";
const WORLD_BOUNDARIES = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson";
const WORLD_MAP_UNITS = "/manus-storage/ne_10m_admin_0_map_units_26e71358.geojson";

const INDICATORS: Array<{ id: IndicatorId; label: string; compact: string; sourceLabel: string; apiCode: string; color: [number, number, number, number] }> = [
  { id: "gdp", label: "Puissance économique", compact: "PIB", sourceLabel: "PIB, dollars courants", apiCode: "NY.GDP.MKTP.CD", color: [0, 140, 149, 214] },
  { id: "population", label: "Démographie", compact: "POP", sourceLabel: "Population totale", apiCode: "SP.POP.TOTL", color: [242, 193, 78, 210] },
  { id: "defense", label: "Effort de défense", compact: "DEF", sourceLabel: "Dépenses militaires (% PIB)", apiCode: "MS.MIL.XPND.GD.ZS", color: [139, 122, 200, 230] },
];

const RELATION_TYPES: Array<{ id: RelationType; label: string; short: string; color: [number, number, number] }> = [
  { id: "geopolitique", label: "Géopolitique", short: "GÉO", color: [32, 196, 217] },
  { id: "militaire", label: "Militaire", short: "MIL", color: [224, 109, 77] },
  { id: "economique", label: "Économique", short: "ÉCO", color: [0, 140, 149] },
  { id: "commercial", label: "Commercial", short: "COM", color: [44, 142, 222] },
  { id: "technologique", label: "Technologique", short: "TEC", color: [139, 122, 200] },
  { id: "scientifique", label: "Scientifique", short: "SCI", color: [77, 177, 117] },
  { id: "culturel", label: "Culturel", short: "CUL", color: [232, 151, 80] },
  { id: "historique", label: "Historique", short: "HIS", color: [167, 99, 151] },
  { id: "migratoire", label: "Migratoire", short: "MIG", color: [78, 181, 184] },
  { id: "ressources", label: "Ressources", short: "RES", color: [181, 144, 66] },
  { id: "securitaire", label: "Sécuritaire", short: "SÉC", color: [217, 93, 78] },
  { id: "ideologique", label: "Idéologique", short: "IDÉ", color: [178, 90, 182] },
  { id: "financier", label: "Financier", short: "FIN", color: [52, 105, 183] },
  { id: "numerique", label: "Numérique", short: "NUM", color: [91, 185, 255] },
  { id: "juridique", label: "Juridique", short: "JUR", color: [59, 154, 125] },
];

const RELATION_LEGENDS: Record<RelationType, { definition: string; reading: string; cue: string }> = {
  geopolitique: { definition: "Rapport de voisinage, d’influence, de différend ou de coordination politique entre des acteurs territoriaux.", reading: "Arc cyan : lecture d’une proximité ou d’un rapport politique ; vérifier la période et la source avant toute interprétation.", cue: "Carte de référence et frontières" },
  militaire: { definition: "Coopération de défense, alliance, présence, capacité ou posture militaire documentée dans le corpus.", reading: "Arc corail : même repère sur la carte, dans les flèches et dans la fiche ; il signale une dimension militaire, pas nécessairement un conflit en cours.", cue: "Contexte de défense et zones chaudes" },
  economique: { definition: "Interdépendance macroéconomique, financement, investissement ou projet économique entre acteurs.", reading: "Arc teal : lire avec le calque PIB et la période statistique sélectionnée.", cue: "PIB" },
  commercial: { definition: "Échange, accord ou corridor commercial reliant des acteurs économiques ou territoriaux.", reading: "Arc cyan : visualise une circulation de biens ou de règles commerciales ; la source précise le mécanisme.", cue: "PIB et démographie" },
  technologique: { definition: "Coopération, dépendance, transfert ou compétition autour de capacités et infrastructures technologiques.", reading: "Arc lilas : relation de contexte stratégique, à lire avec les acteurs et la période concernés.", cue: "Scénarios et réseaux" },
  scientifique: { definition: "Coopération de recherche, échange de connaissances ou cadre scientifique partagé.", reading: "Arc teal : indique un lien de coopération ; son intensité ne constitue pas une mesure de production scientifique.", cue: "Réseau d’acteurs" },
  culturel: { definition: "Lien d’échange, de diffusion ou de proximité culturelle identifié dans le corpus.", reading: "Arc jaune : repère pédagogique ; consulter la fiche de relation pour connaître son périmètre exact.", cue: "Contexte qualitatif" },
  historique: { definition: "Relation héritée d’une période, d’un événement ou d’une trajectoire historique explicitement datée.", reading: "Arc lilas : la frise donne sa fenêtre d’existence ; ne pas confondre héritage historique et relation actuelle.", cue: "Timeline" },
  migratoire: { definition: "Mouvement, diaspora, route ou cadre de mobilité entre deux acteurs.", reading: "Arc cyan : décrit un lien de mobilité dans le corpus, sans représenter un volume de personnes.", cue: "Carte et période" },
  ressources: { definition: "Lien autour de l’accès, de l’exploitation, de l’acheminement ou de la gouvernance d’une ressource.", reading: "Arc jaune : attire l’attention sur un enjeu matériel, à préciser via sa source.", cue: "PIB et zones" },
  securitaire: { definition: "Coopération, tension, risque ou dispositif relevant de la sécurité.", reading: "Arc jaune : signal d’attention ; la gravité UCDP en corail reste réservée aux alertes de conflit.", cue: "Zones chaudes et gravité UCDP" },
  ideologique: { definition: "Proximité, opposition ou référence idéologique associée à des acteurs.", reading: "Arc lilas : sert à contextualiser des alignements ; le détail source sa qualification.", cue: "Réseau" },
  financier: { definition: "Lien de financement, d’investissement, de dette ou d’architecture financière.", reading: "Arc teal : lecture économique à rapprocher du calque PIB, pas une cotation financière.", cue: "PIB" },
  numerique: { definition: "Lien lié aux données, réseaux, infrastructures ou politiques numériques.", reading: "Arc cyan : met en évidence une continuité informationnelle ou infrastructurelle.", cue: "Réseau et scénarios" },
  juridique: { definition: "Appartenance institutionnelle, règle, traité ou cadre de droit partagé.", reading: "Arc teal : une appartenance Wikidata P463 est structurelle tant qu’aucun qualificateur de date n’est fourni.", cue: "Organisations et sources Wikidata" },
};

const VIEWS: ViewConfig[] = [
  { id: "world", label: "Vue monde", short: "MONDE", longitude: 9, latitude: 22, zoom: 1.15 },
  { id: "europe", label: "Europe", short: "EUROPE", longitude: 14, latitude: 51, zoom: 3.05 },
  { id: "americas", label: "Amériques", short: "AMÉRIQUES", longitude: -82, latitude: 14, zoom: 2.05 },
  { id: "indoPacific", label: "Indo-Pacifique", short: "INDO-PAC", longitude: 118, latitude: 18, zoom: 2.15 },
  { id: "africaMena", label: "Afrique–M.-Orient", short: "AFR. / M.-O.", longitude: 29, latitude: 20, zoom: 2.15 },
];

const REGION_FILTERS: Array<{ id: RegionId; label: string }> = [
  { id: "all", label: "Tous" }, { id: "europe", label: "Europe" }, { id: "americas", label: "Amériques" }, { id: "africa", label: "Afrique" }, { id: "asia", label: "Asie-Pac." }, { id: "mena", label: "M.-Orient" },
];

const REGION_FOCUSES: Record<RegionId, Pick<ViewConfig, "longitude" | "latitude" | "zoom">> = {
  all: { longitude: 9, latitude: 22, zoom: 1.15 },
  europe: { longitude: 14, latitude: 51, zoom: 3.05 },
  americas: { longitude: -82, latitude: 14, zoom: 2.05 },
  africa: { longitude: 20, latitude: 5, zoom: 2.3 },
  asia: { longitude: 115, latitude: 22, zoom: 2.15 },
  mena: { longitude: 40, latitude: 29, zoom: 3.1 },
};

function primaryUrlState() {
  const params = new URLSearchParams(window.location.search);
  const requestedRegion = params.get("region");
  const requestedRegions = (params.get("regions") ?? "").split(",").filter((region): region is RegionId => REGION_FILTERS.some((filter) => filter.id === region));
  const requestedType = params.get("type");
  const regions = requestedRegions.length ? requestedRegions : REGION_FILTERS.some((filter) => filter.id === requestedRegion) ? [requestedRegion as RegionId] : ["all"] as RegionId[];
  return {
    region: regions.length === 1 ? regions[0] : "all" as RegionId,
    regions,
    type: RELATION_TYPES.some((type) => type.id === requestedType) ? requestedType as RelationType : null,
  };
}

function analysisModeForType(type: RelationType | null): AnalysisMode {
  if (type === "militaire" || type === "securitaire") return "conflict";
  if (type === "historique") return "evolution";
  if (type === "juridique") return "multilateral";
  return "network";
}

const ANALYSIS_ZONES: Array<{ id: string; label: string; region: RegionId; position: [number, number] }> = [
  { id: "ZONE_EUROPE", label: "Zone européenne", region: "europe", position: [14, 51] },
  { id: "ZONE_AMERICAS", label: "Zone Amériques", region: "americas", position: [-82, 14] },
  { id: "ZONE_AFRICA", label: "Zone Afrique", region: "africa", position: [20, 5] },
  { id: "ZONE_ASIA", label: "Zone Asie-Pacifique", region: "asia", position: [115, 22] },
  { id: "ZONE_MENA", label: "Zone Moyen-Orient", region: "mena", position: [40, 29] },
];

const ORGANIZATIONS: Organization[] = [
  { id: "NATO", name: "Organisation du traité de l’Atlantique nord", acronym: "OTAN", position: [4.3517, 50.8503], description: "Organisation intergouvernementale de défense collective, siège à Bruxelles." },
  { id: "EU", name: "Union européenne", acronym: "UE", position: [4.3517, 50.8503], description: "Union politique et économique européenne, institutions principales à Bruxelles." },
  { id: "AU", name: "Union africaine", acronym: "UA", position: [38.7578, 8.9806], description: "Organisation continentale africaine, siège à Addis-Abeba." },
  { id: "OPEC", name: "Organisation des pays exportateurs de pétrole", acronym: "OPEP", position: [16.3738, 48.2082], description: "Organisation intergouvernementale des pays exportateurs de pétrole, siège à Vienne." },
  { id: "UN", name: "Organisation des Nations unies", acronym: "ONU", position: [-74.006, 40.7128], description: "Organisation internationale fondée en 1945, siège à New York." },
  { id: "WTO", name: "Organisation mondiale du commerce", acronym: "OMC", position: [6.1432, 46.2044], description: "Organisation internationale chargée des règles du commerce entre les nations, siège à Genève." },
  ...WIKIDATA_ORGANIZATIONS.map((organization) => ({ id: organization.id, name: organization.name, acronym: organization.id, position: organization.position, description: "Organisation présente dans le sous-ensemble Wikidata transmis ; les appartenances visibles proviennent de la propriété P463." })),
];

const DEMONSTRATION_ACTORS: RelationActor[] = [
  { id: "FRA", name: "France", position: [2.3522, 48.8566] },
  { id: "BRA", name: "Brésil", position: [-47.8825, -15.7942] },
  { id: "IND", name: "Inde", position: [77.209, 28.6139] },
  { id: "JPN", name: "Japon", position: [139.6917, 35.6895] },
];

const DEMONSTRATION_PARTNERS: RelationActor[] = [
  DEMONSTRATION_ACTORS[1],
  DEMONSTRATION_ACTORS[2],
  DEMONSTRATION_ACTORS[3],
  { id: "UN", name: "Organisation des Nations unies", position: [-74.006, 40.7128] },
];

const DEMONSTRATION_RELATIONS: Relation[] = RELATION_TYPES.flatMap((type, typeIndex) => DEMONSTRATION_ACTORS.map((source, actorIndex) => {
  const target = DEMONSTRATION_PARTNERS[actorIndex];
  return {
    id: `demo-${type.id}-${source.id.toLowerCase()}`,
    source,
    target,
    type: type.id,
    title: `Scénario ${type.label.toLowerCase()} · ${source.name} → ${target.name}`,
    start: 2020 + (typeIndex % 4),
    detail: `Relation démonstrative conçue pour exercer les filtres, comparaisons, fiches et exports Atlas Flux. Elle ne constitue ni un fait établi ni une donnée UCDP ou Wikidata et doit être remplacée par une source vérifiable avant tout usage analytique.`,
    provenance: "Corpus démonstratif Atlas Flux · non factuel · à remplacer par une source vérifiable",
    dataset: "demonstration",
  };
}));

const ACTOR_SYNONYMS: Record<string, string[]> = {
  FRA: ["france", "french republic", "republique francaise", "république française"],
  BRA: ["brasil", "brazil", "federative republic of brazil"],
  IND: ["india", "bharat", "republic of india"],
  JPN: ["japan", "nihon", "nippon"],
  TUR: ["turkey", "türkiye", "turkiye", "republic of turkey"],
  USA: ["united states", "united states of america", "us", "u.s.", "america", "etats unis", "états-unis"],
  GBR: ["united kingdom", "uk", "great britain", "angleterre", "royaume uni"],
  KOR: ["south korea", "republic of korea", "coree du sud", "corée du sud"],
  UN: ["united nations", "nations unies", "onu"],
  NATO: ["north atlantic treaty organization", "otan"],
  EU: ["european union", "union europeenne", "union européenne"],
  AU: ["african union", "union africaine", "ua"],
  OPEC: ["organization of the petroleum exporting countries", "organisation of petroleum exporting countries", "opep"],
  UNESCO: ["united nations educational scientific and cultural organization", "unesco"],
  WTO: ["world trade organization", "organisation mondiale du commerce", "omc"],
  WHO: ["world health organization", "organisation mondiale de la sante", "organisation mondiale de la santé", "oms"],
  INTERPOL: ["international criminal police organization", "organisation internationale de police criminelle"],
  OECD: ["organisation for economic co-operation and development", "organization for economic cooperation and development", "ocde"],
  APEC: ["asia pacific economic cooperation", "cooperation economique pour l asie pacifique", "coopération économique pour l’asie-pacifique"],
  IEA: ["international energy agency", "agence internationale de l energie", "aIE"],
  OPCW: ["organisation for the prohibition of chemical weapons", "organisation pour l interdiction des armes chimiques", "oiac"],
};

/* Corpus initial : exemples du document de classification transmis, conçus pour tester les filtres de type et de période. */
const CLASSIFICATION_RELATIONS: Relation[] = [
  { id: "uk-india-history", source: { id: "GBR", name: "Royaume-Uni", position: [-0.1278, 51.5074] }, target: { id: "IND", name: "Inde", position: [77.209, 28.6139] }, type: "historique", title: "Empire britannique", start: 1858, end: 1947, detail: "Relation historique citée dans le système de classification : période de l’Empire britannique en Inde.", provenance: "Système de classification transmis · exemple Royaume-Uni–Inde" },
  { id: "india-pakistan-kashmir", source: { id: "IND", name: "Inde", position: [77.209, 28.6139] }, target: { id: "PAK", name: "Pakistan", position: [73.0479, 33.6844] }, type: "geopolitique", title: "Conflit du Cachemire", start: 1947, detail: "Relation géopolitique citée dans le système de classification, associée au conflit du Cachemire.", provenance: "Système de classification transmis · exemple Inde–Pakistan" },
  { id: "pakistan-china-cpec", source: { id: "PAK", name: "Pakistan", position: [73.0479, 33.6844] }, target: { id: "CHN", name: "Chine", position: [116.4074, 39.9042] }, type: "militaire", title: "CPEC / coopération stratégique", start: 2015, detail: "Relation militaire et stratégique citée dans le système de classification, avec référence au CPEC.", provenance: "Système de classification transmis · exemple Pakistan–Chine" },
  { id: "russia-syria-base", source: { id: "RUS", name: "Russie", position: [37.6173, 55.7558] }, target: { id: "SYR", name: "Syrie", position: [36.2765, 33.5138] }, type: "militaire", title: "Base navale et soutien", start: 2015, detail: "Relation militaire citée dans le système de classification : base navale et soutien au régime syrien.", provenance: "Système de classification transmis · exemple Russie–Syrie" },
  { id: "china-african-union", source: { id: "CHN", name: "Chine", position: [116.4074, 39.9042] }, target: { id: "AU", name: "Union africaine", position: [38.7578, 8.9806] }, type: "economique", title: "Nouvelles routes de la soie", start: 2010, detail: "Relation économique illustrant l’exemple Chine–Afrique fourni dans le système de classification.", provenance: "Système de classification transmis · exemple Chine–Afrique" },
  { id: "turkey-azerbaijan-alliance", source: { id: "TUR", name: "Turquie", position: [32.8597, 39.9334] }, target: { id: "AZE", name: "Azerbaïdjan", position: [49.8671, 40.4093] }, type: "militaire", title: "Alliance militaire", start: 1992, detail: "Relation militaire figurant dans le scénario de sélection de la Turquie du document de classification.", provenance: "Système de classification transmis · scénario Turquie" },
  { id: "turkey-greece-tensions", source: { id: "TUR", name: "Turquie", position: [32.8597, 39.9334] }, target: { id: "GRC", name: "Grèce", position: [23.7275, 37.9838] }, type: "geopolitique", title: "Tensions régionales", start: 1974, detail: "Relation géopolitique figurant dans le scénario de sélection de la Turquie du document de classification.", provenance: "Système de classification transmis · scénario Turquie" },
  { id: "turkey-nato", source: { id: "TUR", name: "Turquie", position: [32.8597, 39.9334] }, target: { id: "NATO", name: "OTAN", position: [4.3517, 50.8503] }, type: "militaire", title: "Relations OTAN", start: 1952, detail: "Relation multilatérale associée à l’OTAN, intégrée pour représenter les organisations dans l’outil interactif.", provenance: "Système de classification transmis · scénario Turquie" },
];

const RELATION_REFERENCES: Record<string, { label: string; url: string }> = {
  "uk-india-history": { label: "British Raj · Wikipédia", url: "https://en.wikipedia.org/wiki/British_Raj" },
  "india-pakistan-kashmir": { label: "Conflit du Cachemire · Wikipédia", url: "https://fr.wikipedia.org/wiki/Conflit_du_Cachemire" },
  "pakistan-china-cpec": { label: "China–Pakistan Economic Corridor · Wikipédia", url: "https://en.wikipedia.org/wiki/China%E2%80%93Pakistan_Economic_Corridor" },
  "russia-syria-base": { label: "Intervention russe en Syrie · Wikipédia", url: "https://fr.wikipedia.org/wiki/Intervention_militaire_russe_en_Syrie" },
  "china-african-union": { label: "Forum on China–Africa Cooperation · Wikipédia", url: "https://en.wikipedia.org/wiki/Forum_on_China%E2%80%93Africa_Cooperation" },
  "turkey-azerbaijan-alliance": { label: "Relations Azerbaïdjan–Turquie · Wikipédia", url: "https://en.wikipedia.org/wiki/Azerbaijan%E2%80%93Turkey_relations" },
  "turkey-greece-tensions": { label: "Relations Grèce–Turquie · Wikipédia", url: "https://en.wikipedia.org/wiki/Greece%E2%80%93Turkey_relations" },
  "turkey-nato": { label: "OTAN · Relations avec la Türkiye", url: "https://www.nato.int/cps/en/natohq/topics_52044.htm" },
};

const WIKIDATA_RELATION_REFERENCES: Record<string, { label: string; url: string }> = Object.fromEntries(WIKIDATA_RESOLVED_RELATIONS.map((relation) => [relation.id, { label: `Wikidata · ${relation.source.qid} → ${relation.target.qid}`, url: relation.statementId ? `${wikidataUrl(relation.source.qid)}#${relation.statementId}` : wikidataUrl(relation.source.qid) }]));
const RELATIONS: Relation[] = [...CLASSIFICATION_RELATIONS.map((relation) => ({ ...relation, dataset: "sourced" as const })), ...WIKIDATA_RESOLVED_RELATIONS.map((relation): Relation => ({ id: relation.id, source: { id: relation.source.id, name: relation.source.name, position: relation.source.position }, target: { id: relation.target.id, name: relation.target.name, position: relation.target.position }, type: relation.type, title: relation.title, start: relation.start, end: relation.end, temporalScope: relation.temporalScope, detail: relation.detail, provenance: `Wikidata · ${relation.property} · ${relation.source.qid} → ${relation.target.qid}${relation.statementId ? ` · énoncé qualifié` : ""}`, dataset: "sourced" })), ...DEMONSTRATION_RELATIONS];

const ORGANIZATION_REFERENCES: Record<string, { official: string; wikipedia: string }> = {
  NATO: { official: "https://www.nato.int/", wikipedia: "https://fr.wikipedia.org/wiki/Organisation_du_trait%C3%A9_de_l%27Atlantique_nord" },
  EU: { official: "https://european-union.europa.eu/", wikipedia: "https://fr.wikipedia.org/wiki/Union_europ%C3%A9enne" },
  AU: { official: "https://au.int/", wikipedia: "https://fr.wikipedia.org/wiki/Union_africaine" },
  OPEC: { official: "https://www.opec.org/", wikipedia: "https://fr.wikipedia.org/wiki/Organisation_des_pays_exportateurs_de_p%C3%A9trole" },
  UN: { official: "https://www.un.org/fr/", wikipedia: "https://fr.wikipedia.org/wiki/Organisation_des_Nations_unies" },
  WTO: { official: "https://www.wto.org/", wikipedia: "https://fr.wikipedia.org/wiki/Organisation_mondiale_du_commerce" },
  ...Object.fromEntries(WIKIDATA_ORGANIZATIONS.map((organization) => [organization.id, { official: wikidataUrl(organization.qid), wikipedia: wikidataUrl(organization.qid) }])),
};

function normalizeRegion(region: string): RegionId {
  if (region.includes("Europe") || region.includes("Central Asia")) return "europe";
  if (region.includes("America") || region.includes("Caribbean")) return "americas";
  if (region.includes("Sub-Saharan")) return "africa";
  if (region.includes("Middle East") || region.includes("North Africa")) return "mena";
  return "asia";
}

function formatMetric(indicator: IndicatorId, value?: number) {
  if (value === undefined) return "Non renseigné";
  if (indicator === "defense") return `${value.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
  if (indicator === "population") return new Intl.NumberFormat("fr-FR", { notation: "compact", maximumFractionDigits: 1 }).format(value);
  return `$ ${new Intl.NumberFormat("fr-FR", { notation: "compact", maximumFractionDigits: 2 }).format(value)}`;
}

function pointSize(indicator: IndicatorId, value: number) {
  if (indicator === "gdp") return Math.max(7, Math.min(34, 5 + Math.sqrt(value / 1e10)));
  if (indicator === "population") return Math.max(7, Math.min(34, 5 + Math.sqrt(value / 1e6)));
  return Math.max(7, Math.min(32, 5 + value * 2.1));
}

function relationColor(type: RelationType) {
  return RELATION_TYPES.find((item) => item.id === type)?.color ?? [32, 196, 217];
}

function formatDateFr(date: Date) {
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function relationOverlapsPeriod(relation: Relation, startYear: number, endYear: number) {
  if (relation.temporalScope === "structural" || relation.start === undefined) return true;
  return relation.start <= endYear && (relation.end === undefined || relation.end >= startYear);
}

function evolutionColor(_state: "persistent" | "appeared" | "ended" | undefined, _emphasis: "delta" | "start" | "end", type: RelationType) {
  return relationColor(type);
}

function relationReference(relation: Relation) {
  return RELATION_REFERENCES[relation.id] ?? WIKIDATA_RELATION_REFERENCES[relation.id] ?? { label: "Système de classification transmis", url: "#observatoire" };
}

function isRelationActiveAt(relation: Relation, year: number) {
  return relation.temporalScope === "structural" || relation.start === undefined || (relation.start <= year && (relation.end === undefined || relation.end >= year));
}

function relationPeriodLabel(relation: Relation) {
  return relation.temporalScope === "structural" || relation.start === undefined ? "Relation structurelle · date non fournie" : `${relation.start}${relation.end ? `–${relation.end}` : "–aujourd’hui"}`;
}

function conflictCellRegion(position: [number, number]): RegionId {
  const [longitude, latitude] = position;
  if (longitude < -30) return "americas";
  if (longitude >= 25 && longitude <= 65 && latitude >= 15 && latitude <= 43) return "mena";
  if (longitude >= -25 && longitude <= 45 && latitude >= 35) return "europe";
  if (longitude >= -25 && longitude <= 55 && latitude < 35) return "africa";
  return "asia";
}

function countryWikipediaUrl(name: string) {
  return `https://fr.wikipedia.org/wiki/${encodeURIComponent(name.replace(/\s+/g, "_"))}`;
}

function csvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function normalizeSearch(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr");
}

function localizedCountryAliases(iso2: string | undefined) {
  const code = iso2?.toUpperCase();
  if (!code || code.length !== 2) return [];
  return Array.from(new Set(["fr", "en", "es", "de", "pt", "it"].flatMap((locale) => {
    try { return [new Intl.DisplayNames([locale], { type: "region" }).of(code) ?? ""]; } catch { return []; }
  }).filter(Boolean)));
}

function countryFlag(iso2: string | undefined) {
  const code = iso2?.toUpperCase();
  if (!code || !/^[A-Z]{2}$/.test(code)) return "◉";
  return String.fromCodePoint(127397 + code.charCodeAt(0), 127397 + code.charCodeAt(1));
}

export default function Home() {
  // The useAuth hook provides authentication state.
  // To implement login/logout, call logout(), or start login from an event
  // handler: onClick={() => startLogin()} (imported from "@/const"). Never call
  // startLogin() during render (no href={startLogin()}) — it mints a one-time
  // nonce cookie and must run only at the moment of navigation.
  let { user, loading, error, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [countries, setCountries] = useState<CountryDatum[]>([]);
  const [boundaries, setBoundaries] = useState<any>(null);
  const [mapUnits, setMapUnits] = useState<any>(null);
  const [activeView, setActiveView] = useState<ViewId>("world");
  const [focusView, setFocusView] = useState<Pick<ViewConfig, "longitude" | "latitude" | "zoom"> | null>(null);
  const [displayMode, setDisplayMode] = useState<DisplayMode>(() => { const mode = new URLSearchParams(window.location.search).get("mode"); return mode === "globe" || mode === "tactical" ? mode : "map"; });
  const [indicatorYear, setIndicatorYear] = useState<number>(2024);
  const [timelineYear, setTimelineYear] = useState<number>(2024);
  const [activeRegion, setActiveRegion] = useState<RegionId>(() => primaryUrlState().region);
  const [activeRegions, setActiveRegions] = useState<RegionId[]>(() => primaryUrlState().regions);
  const [activeOrganizationIds, setActiveOrganizationIds] = useState<string[]>(() => new URLSearchParams(window.location.search).get("organizations")?.split(",").filter(Boolean) ?? []);
  const [periodStartDate, setPeriodStartDate] = useState(() => new Date(1945, 0, 1));
  const [periodEndDate, setPeriodEndDate] = useState(() => new Date(2025, 11, 31));
  const [countryTab, setCountryTab] = useState("infos");
  const [savedSnapshots, setSavedSnapshots] = useState<SavedSnapshot[]>(() => {
    try { return JSON.parse(window.localStorage.getItem("atlas-flux-snapshots") ?? "[]"); } catch { return []; }
  });
  const [collectionSnapshotIds, setCollectionSnapshotIds] = useState<string[]>([]);
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>(() => { const mode = new URLSearchParams(window.location.search).get("analysis"); return mode === "conflict" || mode === "evolution" || mode === "multilateral" ? mode : analysisModeForType(primaryUrlState().type); });
  const [selectedZone, setSelectedZone] = useState<RegionId | null>(() => primaryUrlState().region === "all" ? null : primaryUrlState().region);
  const [showConflictHeat, setShowConflictHeat] = useState(() => new URLSearchParams(window.location.search).get("analysis") === "conflict");
  const [gravityThreshold, setGravityThreshold] = useState(() => { const threshold = Number(new URLSearchParams(window.location.search).get("gravity") ?? "0"); return GRAVITY_FILTERS.some((filter) => filter.value === threshold) ? threshold : 0; });
  const [timelinePreviewYear, setTimelinePreviewYear] = useState<number | null>(null);
  const [evolutionStart, setEvolutionStart] = useState(1945);
  const [evolutionEnd, setEvolutionEnd] = useState(2025);
  const [evolutionEmphasis, setEvolutionEmphasis] = useState<"delta" | "start" | "end">("delta");
  const [isSplitComparison, setIsSplitComparison] = useState(() => new URLSearchParams(window.location.search).get("split") === "1");
  const [splitViewState, setSplitViewState] = useState({ longitude: 9, latitude: 22, zoom: 1.15, bearing: 0, pitch: 0 });
  const [visibleRelationTypes, setVisibleRelationTypes] = useState<Record<RelationType, boolean>>(() => { const type = primaryUrlState().type; return Object.fromEntries(RELATION_TYPES.map((item) => [item.id, type ? item.id === type : true])) as Record<RelationType, boolean>; });
  const [selectedCountry, setSelectedCountry] = useState<CountryDatum | null>(null);
  const [selectedActorId, setSelectedActorId] = useState<string | null>(() => new URLSearchParams(window.location.search).get("actor"));
  const [selectedRelation, setSelectedRelation] = useState<Relation | null>(() => {
    const id = new URLSearchParams(window.location.search).get("relation");
    return RELATIONS.find((relation) => relation.id === id) ?? null;
  });
  const [selectedLegendType, setSelectedLegendType] = useState<RelationType | null>(() => {
    const requested = new URLSearchParams(window.location.search).get("legend");
    return RELATION_TYPES.some((type) => type.id === requested) ? requested as RelationType : null;
  });
  const [compareLeftId, setCompareLeftId] = useState("TUR");
  const [compareRightId, setCompareRightId] = useState("GRC");
  const [isComparatorOpen, setIsComparatorOpen] = useState(() => new URLSearchParams(window.location.search).get("compare") === "1");
  const [hoveredRelation, setHoveredRelation] = useState<{ relation: Relation; x: number; y: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState(() => new URLSearchParams(window.location.search).get("search") ?? "");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [areFiltersVisible, setAreFiltersVisible] = useState(true);
  const [shareNotice, setShareNotice] = useState("");
  const [isPeriodAnimating, setIsPeriodAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dataError, setDataError] = useState(false);
  const [viewKey, setViewKey] = useState(0);
  const [animationPhase, setAnimationPhase] = useState(0);
  const mapRef = useRef<any>(null);
  const mapStageRef = useRef<HTMLElement>(null);
  const restoredPrimaryFilterFocus = useRef(false);
  const [isContributionOpen, setIsContributionOpen] = useState(() => new URLSearchParams(window.location.search).get("contribute") === "1");
  const [proposalForm, setProposalForm] = useState({ sourceActor: "", targetActor: "", relationType: "geopolitique", title: "", detail: "", sourceUrl: "", startYear: "", endYear: "" });
  const requestedCollectionKey = new URLSearchParams(window.location.search).get("collection");
  const utils = trpc.useUtils();
  const proposalMutation = trpc.relationProposals.submit.useMutation({ onSuccess: () => { void utils.relationProposals.mine.invalidate(); setProposalForm({ sourceActor: "", targetActor: "", relationType: "geopolitique", title: "", detail: "", sourceUrl: "", startYear: "", endYear: "" }); } });
  const pendingProposalsQuery = trpc.relationProposals.pending.useQuery(undefined, { enabled: Boolean(user?.role === "admin" && isContributionOpen) });
  const reviewMutation = trpc.relationProposals.review.useMutation({ onSuccess: () => { void utils.relationProposals.pending.invalidate(); } });
  const collectionsQuery = trpc.snapshotCollections.mine.useQuery(undefined, { enabled: isAuthenticated });
  const createCollectionMutation = trpc.snapshotCollections.create.useMutation({ onSuccess: () => { void utils.snapshotCollections.mine.invalidate(); setShareNotice("Collection enregistrée."); } });
  const removeCollectionMutation = trpc.snapshotCollections.remove.useMutation({ onSuccess: () => { void utils.snapshotCollections.mine.invalidate(); setShareNotice("Collection supprimée."); } });
  const sharedCollectionQuery = trpc.snapshotCollections.shared.useQuery({ shareKey: requestedCollectionKey ?? "" }, { enabled: Boolean(requestedCollectionKey) });

  const selectedViewConfig = VIEWS.find((view) => view.id === activeView) ?? VIEWS[0];
  const selectedView = focusView ?? selectedViewConfig;
  const projectionView = useMemo(() => ({ longitude: selectedView.longitude, latitude: selectedView.latitude, zoom: displayMode === "globe" ? Math.min(selectedView.zoom, 1.35) : displayMode === "tactical" ? Math.max(selectedView.zoom, 2.45) : selectedView.zoom }), [displayMode, selectedView.latitude, selectedView.longitude, selectedView.zoom]);
  const globeView = useMemo(() => displayMode === "globe" ? new GlobeView({ id: "world-globe" }) : undefined, [displayMode]);
  const [globeCamera, setGlobeCamera] = useState(() => ({ longitude: 8, latitude: 24, zoom: 0.6 }));

  useEffect(() => {
    if (displayMode !== "globe") return;
    setGlobeCamera((current) => ({ ...projectionView, transitionDuration: current ? 720 : 0, transitionInterpolator: new FlyToInterpolator() }));
  }, [displayMode, projectionView]);

  useEffect(() => {
    const payload = new URLSearchParams(window.location.search).get("snapshot");
    if (!payload) return;
    try { applySavedSnapshot(JSON.parse(decodeURIComponent(window.atob(payload))) as SavedSnapshot); } catch { setShareNotice("Le lien de relevé reçu est incomplet."); }
  }, []);

  useEffect(() => {
    const firstItem = sharedCollectionQuery.data?.items?.[0];
    if (!firstItem) return;
    try { applySavedSnapshot(JSON.parse(firstItem.snapshotJson) as SavedSnapshot); setShareNotice(`Collection partagée ouverte : ${sharedCollectionQuery.data?.name ?? "relevé"}.`); } catch { setShareNotice("La collection partagée ne peut pas être restaurée."); }
  }, [sharedCollectionQuery.data]);

  useEffect(() => {
    let isMounted = true;
    async function loadWorldData() {
      try {
        const countryRequest = fetch(`${WORLD_BANK_API}/country?format=json&per_page=400`);
        const indicatorRequests = INDICATORS.map((indicator) => fetch(`${WORLD_BANK_API}/country/all/indicator/${indicator.apiCode}?date=2022:2024&format=json&per_page=1000`));
        const responses = await Promise.all([countryRequest, ...indicatorRequests]);
        if (responses.some((response) => !response.ok)) throw new Error("Source indisponible");
        const payloads = await Promise.all(responses.map((response) => response.json()));
        const countryPayload = payloads[0] as WorldBankResponse<CountryApiRecord>;
        const indicatorPayloads = payloads.slice(1) as WorldBankResponse<IndicatorApiRecord>[];
        const entries = new globalThis.Map<string, CountryDatum>();

        (countryPayload[1] ?? []).forEach((country) => {
          const longitude = Number(country.longitude);
          const latitude = Number(country.latitude);
          if (country.region.id === "NA" || !Number.isFinite(longitude) || !Number.isFinite(latitude) || !country.id) return;
          entries.set(country.id, { iso3: country.id, iso2: country.iso2Code, name: country.name, capital: country.capitalCity, region: normalizeRegion(country.region.value), position: [longitude, latitude], indicators: { gdp: {}, population: {}, defense: {} } });
        });

        INDICATORS.forEach((indicator, index) => {
          (indicatorPayloads[index][1] ?? []).forEach((record) => {
            const country = entries.get(record.countryiso3code);
            const year = Number(record.date);
            if (country && record.value !== null && INDICATOR_YEARS.includes(year as (typeof INDICATOR_YEARS)[number])) country.indicators[indicator.id][year] = record.value;
          });
        });
        if (isMounted) setCountries(Array.from(entries.values()));
      } catch {
        if (isMounted) setDataError(true);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadWorldData();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetch(WORLD_BOUNDARIES).then((response) => response.ok ? response.json() : null).then((data) => { if (isMounted && data) setBoundaries(data); }).catch(() => undefined);
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetch(WORLD_MAP_UNITS).then((response) => response.ok ? response.json() : null).then((data) => { if (isMounted && data) setMapUnits(data); }).catch(() => undefined);
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setAnimationPhase((phase) => (phase + 1) % 36), 180);
    return () => window.clearInterval(timer);
  }, []);

  const territoryActors = useMemo<CountryDatum[]>(() => {
    if (!mapUnits?.features) return [];
    const knownIds = new Set(countries.map((country) => country.iso3));
    return mapUnits.features.flatMap((feature: any) => {
      const properties = feature.properties ?? {};
      if (Number(properties.LEVEL ?? 2) > 3) return [];
      const rawId = String(properties.GU_A3 ?? "");
      const id = rawId && rawId !== "-99" ? rawId : `NE_${properties.NE_ID}`;
      if (knownIds.has(id)) return [];
      const longitude = Number(properties.LABEL_X);
      const latitude = Number(properties.LABEL_Y);
      if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return [];
      return [{ iso3: id, iso2: String(properties.ISO_A2 ?? ""), name: String(properties.NAME_FR ?? properties.NAME ?? properties.GEOUNIT ?? id), capital: "", region: normalizeRegion(String(properties.REGION_WB ?? properties.CONTINENT ?? "")), position: [longitude, latitude] as [number, number], indicators: { gdp: {}, population: {}, defense: {} }, entityKind: "territory" as const, sovereign: String(properties.SOVEREIGNT ?? properties.ADMIN ?? ""), status: String(properties.TYPE ?? "Unité cartographique") }];
    });
  }, [countries, mapUnits]);
  const allCountries = useMemo(() => [...countries, ...territoryActors], [countries, territoryActors]);
  const filteredCountries = useMemo(() => allCountries.filter((country) => activeRegions.includes("all") || activeRegions.includes(country.region)), [allCountries, activeRegions]);
  const filteredCount = filteredCountries.length;

  useEffect(() => {
    if (!selectedActorId || selectedCountry || !allCountries.length) return;
    const country = allCountries.find((entry) => entry.iso3 === selectedActorId);
    if (country) setSelectedCountry(country);
  }, [allCountries, selectedActorId, selectedCountry]);

  useEffect(() => {
    if (restoredPrimaryFilterFocus.current || !allCountries.length) return;
    restoredPrimaryFilterFocus.current = true;
    const primary = primaryUrlState();
    if (!primary.regions.includes("all")) setActiveRegions(primary.regions);
    if (primary.region !== "all" || primary.type) applyPrimaryFilterFocus({ region: primary.region, ...(primary.type ? { type: primary.type } : {}) });
  }, [allCountries.length]);

  const scopedRelations = useMemo(() => RELATIONS
    .filter((relation) => visibleRelationTypes[relation.type])
    .filter((relation) => relationOverlapsPeriod(relation, periodStartDate.getFullYear(), periodEndDate.getFullYear()))
    .filter((relation) => !selectedActorId || relation.source.id === selectedActorId || relation.target.id === selectedActorId)
    .filter((relation) => activeRegions.includes("all") || activeRegions.some((region) => allCountries.find((country) => country.iso3 === relation.source.id)?.region === region || allCountries.find((country) => country.iso3 === relation.target.id)?.region === region))
    .filter((relation) => !activeOrganizationIds.length || activeOrganizationIds.includes(relation.source.id) || activeOrganizationIds.includes(relation.target.id))
    .filter((relation) => analysisMode !== "multilateral" || ORGANIZATIONS.some((organization) => organization.id === relation.source.id || organization.id === relation.target.id)), [allCountries, analysisMode, visibleRelationTypes, selectedActorId, activeRegions, activeOrganizationIds, periodStartDate, periodEndDate]);
  const evolutionStartRelations = useMemo(() => scopedRelations.filter((relation) => isRelationActiveAt(relation, evolutionStart)), [scopedRelations, evolutionStart]);
  const evolutionEndRelations = useMemo(() => scopedRelations.filter((relation) => isRelationActiveAt(relation, evolutionEnd)), [scopedRelations, evolutionEnd]);
  const evolutionRelationState = useMemo(() => {
    const atStart = new Set(evolutionStartRelations.map((relation) => relation.id));
    const atEnd = new Set(evolutionEndRelations.map((relation) => relation.id));
    const ids = Array.from(atStart);
    atEnd.forEach((id) => { if (!atStart.has(id)) ids.push(id); });
    return Object.fromEntries(ids.map((id) => [id, atStart.has(id) && atEnd.has(id) ? "persistent" : atEnd.has(id) ? "appeared" : "ended"])) as Record<string, "persistent" | "appeared" | "ended">;
  }, [evolutionStartRelations, evolutionEndRelations]);
  const evolutionCounts = useMemo(() => ({ persistent: Object.values(evolutionRelationState).filter((state) => state === "persistent").length, appeared: Object.values(evolutionRelationState).filter((state) => state === "appeared").length, ended: Object.values(evolutionRelationState).filter((state) => state === "ended").length }), [evolutionRelationState]);
  const splitStartLayers = useMemo(() => [new ArcLayer<Relation>({ id: `split-start-${viewKey}`, data: evolutionStartRelations, greatCircle: true, getSourcePosition: (relation) => relation.source.position, getTargetPosition: (relation) => relation.target.position, getSourceColor: (relation) => [...relationColor(relation.type), 230] as [number, number, number, number], getTargetColor: (relation) => [...relationColor(relation.type), 230] as [number, number, number, number], getWidth: 2.1, widthUnits: "pixels", pickable: true, autoHighlight: true, highlightColor: [255, 245, 215, 255] })], [evolutionStartRelations, viewKey]);
  const splitEndLayers = useMemo(() => [new ArcLayer<Relation>({ id: `split-end-${viewKey}`, data: evolutionEndRelations, greatCircle: true, getSourcePosition: (relation) => relation.source.position, getTargetPosition: (relation) => relation.target.position, getSourceColor: (relation) => [...relationColor(relation.type), 230] as [number, number, number, number], getTargetColor: (relation) => [...relationColor(relation.type), 230] as [number, number, number, number], getWidth: 2.1, widthUnits: "pixels", pickable: true, autoHighlight: true, highlightColor: [255, 245, 215, 255] })], [evolutionEndRelations, viewKey]);
  const activeRelations = useMemo(() => {
    if (analysisMode !== "evolution") return scopedRelations.filter((relation) => isRelationActiveAt(relation, timelineYear));
    if (evolutionEmphasis === "start") return evolutionStartRelations;
    if (evolutionEmphasis === "end") return evolutionEndRelations;
    return scopedRelations.filter((relation) => evolutionRelationState[relation.id] !== undefined);
  }, [analysisMode, evolutionEmphasis, evolutionEndRelations, evolutionRelationState, evolutionStartRelations, scopedRelations, timelineYear]);
  const selectedOrganization = ORGANIZATIONS.find((organization) => organization.id === selectedActorId) ?? null;
  const relatedActorIds = useMemo(() => new Set(activeRelations.flatMap((relation) => [relation.source.id, relation.target.id])), [activeRelations]);
  const compareLeft = allCountries.find((country) => country.iso3 === compareLeftId) ?? null;
  const compareRight = allCountries.find((country) => country.iso3 === compareRightId) ?? null;
  const bilateralRelations = RELATIONS.filter((relation) => isRelationActiveAt(relation, timelineYear) && ((relation.source.id === compareLeftId && relation.target.id === compareRightId) || (relation.source.id === compareRightId && relation.target.id === compareLeftId)));
  const bilateralHistory = RELATIONS.filter((relation) => (relation.source.id === compareLeftId && relation.target.id === compareRightId) || (relation.source.id === compareRightId && relation.target.id === compareLeftId));
  const datedBilateralHistory = bilateralHistory.filter((relation): relation is Relation & { start: number } => relation.start !== undefined && relation.temporalScope !== "structural");
  const historyStart = datedBilateralHistory.length ? Math.min(...datedBilateralHistory.map((relation) => relation.start)) : 1858;

  const searchResults = useMemo<SearchEntry[]>(() => {
    const query = normalizeSearch(searchQuery.trim());
    const score = (label: string, aliases: string[] = []) => { const values = [label, ...aliases].map(normalizeSearch); return values.some((value) => value === query) ? 0 : values.some((value) => value.startsWith(query)) ? 1 : values.some((value) => value.split(/[\s-]+/).some((word) => word.startsWith(query))) ? 2 : 3; };
    const countryEntries = allCountries.filter((country) => { const aliases = [...(ACTOR_SYNONYMS[country.iso3] ?? []), ...localizedCountryAliases(country.iso2)]; return !query || normalizeSearch(country.name).includes(query) || normalizeSearch(country.iso3).includes(query) || normalizeSearch(country.sovereign ?? "").includes(query) || aliases.some((alias) => normalizeSearch(alias).includes(query)); }).map((country) => ({ id: country.iso3, label: country.name, kind: country.entityKind === "territory" ? "Territoire" as const : "Pays" as const, position: country.position, country, flag: countryFlag(country.iso2), score: score(country.name, [country.iso3, country.sovereign ?? "", ...(ACTOR_SYNONYMS[country.iso3] ?? []), ...localizedCountryAliases(country.iso2)]) }));
    const organizationEntries = ORGANIZATIONS.filter((organization) => { const aliases = ACTOR_SYNONYMS[organization.id] ?? []; return !query || normalizeSearch(organization.name).includes(query) || normalizeSearch(organization.acronym).includes(query) || aliases.some((alias) => normalizeSearch(alias).includes(query)); }).map((organization) => ({ id: organization.id, label: organization.name, kind: "Organisation" as const, position: organization.position, organization, score: score(organization.name, [organization.acronym, ...(ACTOR_SYNONYMS[organization.id] ?? [])]) }));
    const zoneEntries = ANALYSIS_ZONES.filter((zone) => !query || normalizeSearch(zone.label).includes(query)).map((zone) => ({ id: zone.id, label: zone.label, kind: "Zone" as const, position: zone.position, region: zone.region, score: score(zone.label) }));
    if (!query) {
      if (!isSearchFocused) return [];
      const suggestedCountries = countryEntries.filter((entry) => ["FRA", "USA", "CHN", "RUS", "TUR", "BRA"].includes(entry.id));
      return [...suggestedCountries, ...organizationEntries.slice(0, 4), ...zoneEntries.slice(0, 3)].map(({ score: _score, ...entry }) => entry);
    }
    return [...countryEntries, ...organizationEntries, ...zoneEntries].sort((left, right) => left.score - right.score || left.label.localeCompare(right.label, "fr")).map(({ score: _score, ...entry }) => entry);
  }, [allCountries, isSearchFocused, searchQuery]);

  const conflictSignals = useMemo<UcdpConflictCell[]>(() => UCDP_CONFLICT_CELLS.filter((cell) => (analysisMode === "evolution" ? cell.year >= evolutionStart && cell.year <= evolutionEnd : cell.year === timelineYear) && cell.fatalities >= gravityThreshold && (activeRegion === "all" || conflictCellRegion(cell.position) === activeRegion)), [activeRegion, analysisMode, evolutionEnd, evolutionStart, gravityThreshold, timelineYear]);

  const layers = useMemo(() => {
    const atlasLandLayer = displayMode !== "globe" && boundaries ? new GeoJsonLayer({
      id: `atlas-land-mass-${viewKey}`,
      data: boundaries,
      stroked: true,
      filled: true,
      pickable: false,
      getFillColor: [26, 59, 91, 114],
      getLineColor: [101, 151, 183, 120],
      getLineWidth: 0.7,
      lineWidthUnits: "pixels",
    }) : null;
    const atlasLabelLayer = displayMode !== "globe" ? new TextLayer({
      id: `atlas-continent-labels-${viewKey}`,
      data: ATLAS_CONTINENT_LABELS,
      getPosition: (entry) => entry.position,
      getText: (entry) => entry.label,
      getSize: 12,
      sizeUnits: "pixels",
      getColor: [137, 181, 206, 145],
      getTextAnchor: "middle",
      getAlignmentBaseline: "center",
      pickable: false,
    }) : null;
    const boundaryLayer = displayMode === "globe" ? new GeoJsonLayer({
      id: `world-boundaries-${viewKey}`,
      data: boundaries ?? { type: "FeatureCollection", features: [] },
      stroked: true,
      filled: true,
      pickable: false,
      getFillColor: [17, 34, 43, 248],
      getLineColor: [96, 124, 126, 190],
      getLineWidth: 0.55,
      lineWidthUnits: "pixels",
    }) : null;
    const countryClickLayer = boundaries ? new GeoJsonLayer({
      id: `country-click-target-${viewKey}`,
      data: boundaries,
      filled: true,
      stroked: false,
      pickable: true,
      getFillColor: [0, 0, 0, 1],
    }) : null;
    const relatedCountryIds = new Set(selectedActorId ? allCountries.filter((country) => relatedActorIds.has(country.iso3)).map((country) => country.iso3) : []);
    const zoneCountryIds = new Set(allCountries.filter((country) => selectedZone && country.region === selectedZone).map((country) => country.iso3));
    const selectionIds = new Set([selectedActorId, isComparatorOpen ? compareLeftId : null, isComparatorOpen ? compareRightId : null].filter(Boolean));
    const selectionGeometry = mapUnits ? { type: "FeatureCollection", features: mapUnits.features.filter((feature: any) => selectionIds.has(String(feature.properties?.GU_A3 ?? feature.properties?.ISO_A3 ?? feature.properties?.ADM0_A3 ?? ""))) } : boundaries;
    const selectionLayer = selectionGeometry ? new GeoJsonLayer({
      id: `actor-selection-${viewKey}`,
      data: selectionGeometry,
      filled: true,
      stroked: true,
      pickable: false,
      getFillColor: (feature: any) => {
        const iso3 = String(feature.properties?.GU_A3 ?? feature.properties?.ISO_A3 ?? feature.properties?.ADM0_A3 ?? "");
        if (isComparatorOpen && iso3 === compareLeftId) return [8, 41, 74, 212];
        if (isComparatorOpen && iso3 === compareRightId) return [32, 196, 217, 180];
        if (iso3 === selectedActorId) return [8, 41, 74, 205];
        if (zoneCountryIds.has(iso3)) return [8, 41, 74, 124];
        if (relatedCountryIds.has(iso3)) return [102, 164, 205, 126];
        return [0, 0, 0, 0];
      },
      getLineColor: (feature: any) => {
        const iso3 = String(feature.properties?.GU_A3 ?? feature.properties?.ISO_A3 ?? feature.properties?.ADM0_A3 ?? "");
        if (isComparatorOpen && iso3 === compareLeftId) return [216, 238, 255, 255];
        if (isComparatorOpen && iso3 === compareRightId) return [121, 240, 245, 255];
        if (iso3 === selectedActorId) return [168, 213, 241, 255];
        if (zoneCountryIds.has(iso3) || relatedCountryIds.has(iso3)) return [131, 188, 222, 210];
        return [0, 0, 0, 0];
      },
      getLineWidth: 1.6,
      lineWidthUnits: "pixels",
    }) : null;
    const pulse = Math.round(130 + ((Math.sin(animationPhase / 3) + 1) / 2) * 110);
    const relationCyanAuraLayer = new ArcLayer<Relation>({
      id: `geopolitical-arcs-cyan-aura-${viewKey}`,
      data: activeRelations,
      greatCircle: true,
      getSourcePosition: (relation) => relation.source.position,
      getTargetPosition: (relation) => relation.target.position,
      getSourceColor: [32, 196, 217, 34],
      getTargetColor: [32, 196, 217, 8],
      getWidth: (relation) => selectedActorId && (relation.source.id === selectedActorId || relation.target.id === selectedActorId) ? 9 : 6.5,
      widthUnits: "pixels",
      pickable: false,
    });
    const relationGlowLayer = new ArcLayer<Relation>({
      id: `geopolitical-arcs-glow-${viewKey}`,
      data: activeRelations,
      greatCircle: true,
      getSourcePosition: (relation) => relation.source.position,
      getTargetPosition: (relation) => relation.target.position,
      getSourceColor: (relation) => [...(analysisMode === "evolution" ? evolutionColor(evolutionRelationState[relation.id], evolutionEmphasis, relation.type) : relationColor(relation.type)), 30] as [number, number, number, number],
      getTargetColor: (relation) => [...(analysisMode === "evolution" ? evolutionColor(evolutionRelationState[relation.id], evolutionEmphasis, relation.type) : relationColor(relation.type)), 12] as [number, number, number, number],
      getWidth: (relation) => selectedActorId && (relation.source.id === selectedActorId || relation.target.id === selectedActorId) ? 6 : 4.25,
      widthUnits: "pixels",
      pickable: false,
    });
    const relationNodeAuraLayer = new ScatterplotLayer<RelationActor>({
      id: `relation-node-aura-${viewKey}`,
      data: activeRelations.flatMap((relation) => [relation.source, relation.target]),
      getPosition: (actor) => actor.position,
      getRadius: 11,
      radiusUnits: "pixels",
      getFillColor: [32, 196, 217, 54],
      getLineColor: [32, 196, 217, 0],
      pickable: false,
    });
    const relationLayer = new ArcLayer<Relation>({
      id: `geopolitical-arcs-${viewKey}`,
      data: activeRelations,
      greatCircle: true,
      getSourcePosition: (relation) => relation.source.position,
      getTargetPosition: (relation) => relation.target.position,
      getSourceColor: (relation) => [...(analysisMode === "evolution" ? evolutionColor(evolutionRelationState[relation.id], evolutionEmphasis, relation.type) : relationColor(relation.type)), pulse] as [number, number, number, number],
      getTargetColor: (relation) => [...(analysisMode === "evolution" ? evolutionColor(evolutionRelationState[relation.id], evolutionEmphasis, relation.type) : relationColor(relation.type)), 245] as [number, number, number, number],
      getWidth: (relation) => analysisMode === "evolution" && evolutionEmphasis === "delta" && evolutionRelationState[relation.id] !== "persistent" ? 3.1 : selectedActorId && (relation.source.id === selectedActorId || relation.target.id === selectedActorId) ? 3.4 : 2.15,
      widthUnits: "pixels",
      pickable: true,
      autoHighlight: true,
      highlightColor: [255, 245, 215, 255],
    });
    const directionLayer = selectedActorId ? new TextLayer<Relation>({
      id: `relation-directions-${viewKey}`,
      data: activeRelations,
      getPosition: (relation) => relation.target.position,
      getText: () => ">",
      getSize: 18,
      sizeUnits: "pixels",
      getColor: (relation) => [...(analysisMode === "evolution" ? evolutionColor(evolutionRelationState[relation.id], evolutionEmphasis, relation.type) : relationColor(relation.type)), 245] as [number, number, number, number],
      getTextAnchor: "middle",
      getAlignmentBaseline: "center",
      pickable: false,
    }) : null;
    const conflictHeatLayer = showConflictHeat ? new HeatmapLayer<UcdpConflictCell>({
      id: `conflict-signals-${viewKey}`,
      data: conflictSignals,
      getPosition: (signal) => signal.position,
      getWeight: (signal) => Math.log1p(signal.fatalities),
      radiusPixels: displayMode === "tactical" ? 86 : 68,
      intensity: 1.02,
      threshold: 0.06,
      colorRange: [[17, 34, 53], [32, 196, 217], [242, 193, 78], [217, 93, 78], [217, 93, 78]],
      pickable: false,
    }) : null;
    const conflictCellLayer = showConflictHeat ? new ScatterplotLayer<UcdpConflictCell>({
      id: `conflict-cells-${viewKey}`,
      data: conflictSignals,
      getPosition: (signal) => signal.position,
      getRadius: (signal) => Math.max(3, Math.min(12, Math.log1p(signal.fatalities))),
      radiusUnits: "pixels",
      getFillColor: [255, 236, 180, 150],
      getLineColor: [217, 93, 78, 235],
      getLineWidth: 1,
      lineWidthUnits: "pixels",
      stroked: true,
      pickable: true,
    }) : null;
    const organizationLayer = new ScatterplotLayer<Organization>({
      id: `world-organizations-${viewKey}`,
      data: ORGANIZATIONS,
      getPosition: (organization) => organization.position,
      getRadius: (organization) => organization.id === selectedActorId ? 14 : 8.5,
      radiusUnits: "pixels",
      getFillColor: (organization) => organization.id === selectedActorId ? [216, 178, 255, 255] : [165, 117, 236, 220],
      getLineColor: [248, 243, 232, 220],
      getLineWidth: 1,
      lineWidthUnits: "pixels",
      stroked: true,
      pickable: true,
      autoHighlight: true,
      highlightColor: [255, 237, 186, 170],
    });
    const territoryMarkerLayer = new ScatterplotLayer<CountryDatum>({
      id: `world-territories-${viewKey}`,
      data: territoryActors,
      getPosition: (territory) => territory.position,
      getRadius: (territory) => territory.iso3 === selectedActorId ? 8 : 3.2,
      radiusUnits: "pixels",
      getFillColor: (territory) => territory.iso3 === selectedActorId ? [216, 178, 255, 255] : [139, 122, 200, 175],
      getLineColor: [248, 243, 232, 185],
      getLineWidth: 0.7,
      lineWidthUnits: "pixels",
      stroked: true,
      pickable: true,
      autoHighlight: true,
      highlightColor: [255, 237, 186, 170],
    });
    return [...(atlasLandLayer ? [atlasLandLayer] : []), ...(atlasLabelLayer ? [atlasLabelLayer] : []), ...(boundaryLayer ? [boundaryLayer] : []), ...(countryClickLayer ? [countryClickLayer] : []), ...(selectionLayer ? [selectionLayer] : []), ...(conflictHeatLayer ? [conflictHeatLayer] : []), ...(conflictCellLayer ? [conflictCellLayer] : []), territoryMarkerLayer, relationCyanAuraLayer, relationGlowLayer, relationNodeAuraLayer, relationLayer, ...(directionLayer ? [directionLayer] : []), organizationLayer];
  }, [activeRelations, allCountries, analysisMode, animationPhase, boundaries, compareLeftId, compareRightId, conflictSignals, displayMode, evolutionEmphasis, evolutionRelationState, isComparatorOpen, mapUnits, relatedActorIds, selectedActorId, selectedZone, showConflictHeat, territoryActors, viewKey]);

  function resetView() {
    setActiveView("world");
    setFocusView(null);
    setSelectedActorId(null);
    setSelectedCountry(null);
    setSelectedRelation(null);
    setViewKey((key) => key + 1);
  }

  function selectView(view: ViewConfig) {
    setActiveView(view.id);
    setFocusView(null);
    setViewKey((key) => key + 1);
  }

  function selectSearchEntry(entry: SearchEntry) {
    if (entry.kind === "Zone" && entry.region) {
      setSelectedZone(entry.region);
      setActiveRegion(entry.region);
      setSelectedActorId(null);
      setSelectedCountry(null);
      setFocusView({ longitude: entry.position[0], latitude: entry.position[1], zoom: 2.25 });
      setSearchQuery("");
      setViewKey((key) => key + 1);
      return;
    }
    setSelectedActorId(entry.id);
    setSelectedCountry(entry.country ?? null);
    setSelectedRelation(null);
    setFocusView({ longitude: entry.position[0], latitude: entry.position[1], zoom: displayMode === "globe" ? 0.95 : 3.2 });
    setSearchQuery("");
    setViewKey((key) => key + 1);
  }

  function selectCountryFromMap(country: CountryDatum) {
    if (!isComparatorOpen && selectedCountry?.iso3 === country.iso3) {
      setSelectedCountry(null);
      setSelectedActorId(null);
      setSelectedRelation(null);
      return;
    }
    if (isComparatorOpen && compareRightId && compareRightId !== country.iso3) {
      setCompareLeftId(compareRightId);
      setCompareRightId(country.iso3);
    } else if (selectedCountry && selectedCountry.iso3 !== country.iso3) {
      setCompareLeftId(selectedCountry.iso3);
      setCompareRightId(country.iso3);
      setIsComparatorOpen(true);
    }
    setSelectedCountry(country);
    setSelectedActorId(country.iso3);
    setSelectedRelation(null);
  }

  function selectRelationDetail(relation: Relation) {
    setSelectedRelation(relation);
    setSelectedCountry(null);
    const url = new URL(window.location.href);
    url.searchParams.set("relation", relation.id);
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }

  function openSplitComparison() {
    const longitude = compareLeft && compareRight ? (compareLeft.position[0] + compareRight.position[0]) / 2 : selectedView.longitude;
    const latitude = compareLeft && compareRight ? (compareLeft.position[1] + compareRight.position[1]) / 2 : selectedView.latitude;
    setSplitViewState({ longitude, latitude, zoom: compareLeft && compareRight ? 2.2 : Math.max(1.15, selectedView.zoom), bearing: 0, pitch: 0 });
    setIsSplitComparison(true);
  }

  function openContribution() {
    if (!isAuthenticated) { startLogin(); return; }
    setIsContributionOpen(true);
  }

  function submitProposal(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    proposalMutation.mutate({ sourceActor: proposalForm.sourceActor, targetActor: proposalForm.targetActor, relationType: proposalForm.relationType, title: proposalForm.title, detail: proposalForm.detail, sourceUrl: proposalForm.sourceUrl, ...(proposalForm.startYear ? { startYear: Number(proposalForm.startYear) } : {}), ...(proposalForm.endYear ? { endYear: Number(proposalForm.endYear) } : {}) });
  }

  function applyPrimaryFilterFocus(filter: { region?: RegionId; type?: RelationType }) {
    const nextRegion = filter.region ?? activeRegion;
    if (filter.region) {
      setActiveRegion(filter.region);
      setActiveRegions([filter.region]);
      setSelectedZone(filter.region === "all" ? null : filter.region);
      setSelectedActorId(null);
      setSelectedCountry(null);
      setSelectedRelation(null);
    }
    if (filter.type) {
      setVisibleRelationTypes(() => Object.fromEntries(RELATION_TYPES.map((type) => [type.id, type.id === filter.type])) as Record<RelationType, boolean>);
      setSelectedLegendType(filter.type);
      const nextMode = analysisModeForType(filter.type);
      setAnalysisMode(nextMode);
      setShowConflictHeat(nextMode === "conflict");
      if (nextMode === "evolution") setTimelinePreviewYear(timelineYear);
      const typedRelations = RELATIONS.filter((relation) => relation.type === filter.type && (nextRegion === "all" || allCountries.find((country) => country.iso3 === relation.source.id)?.region === nextRegion || allCountries.find((country) => country.iso3 === relation.target.id)?.region === nextRegion));
      const positions = typedRelations.flatMap((relation) => [relation.source.position, relation.target.position]);
      if (positions.length) {
        setFocusView({ longitude: positions.reduce((total, position) => total + position[0], 0) / positions.length, latitude: positions.reduce((total, position) => total + position[1], 0) / positions.length, zoom: Math.max(1.45, nextRegion === "all" ? 1.85 : REGION_FOCUSES[nextRegion].zoom) });
      } else {
        setFocusView(REGION_FOCUSES[nextRegion]);
      }
    } else if (filter.region) {
      setFocusView(REGION_FOCUSES[filter.region]);
    }
    const currentUrl = new URL(window.location.href);
    const nextType = filter.type ?? RELATION_TYPES.find((type) => visibleRelationTypes[type.id] && RELATION_TYPES.filter((entry) => visibleRelationTypes[entry.id]).length === 1)?.id;
    if (nextRegion === "all") currentUrl.searchParams.delete("region"); else currentUrl.searchParams.set("region", nextRegion);
    if (nextType) currentUrl.searchParams.set("type", nextType); else currentUrl.searchParams.delete("type");
    window.history.replaceState({}, "", `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`);
    setViewKey((key) => key + 1);
  }

  function toggleRegionFilter(region: RegionId) {
    const nextRegions = region === "all" ? ["all"] as RegionId[] : (() => {
      const current = activeRegions.filter((entry) => entry !== "all");
      const next = current.includes(region) ? current.filter((entry) => entry !== region) : [...current, region];
      return next.length ? next : ["all"] as RegionId[];
    })();
    const focusRegion = nextRegions.length === 1 ? nextRegions[0] : "all";
    setActiveRegions(nextRegions);
    setActiveRegion(focusRegion);
    setSelectedZone(focusRegion === "all" ? null : focusRegion);
    setSelectedActorId(null);
    setSelectedCountry(null);
    setSelectedRelation(null);
    setFocusView(REGION_FOCUSES[focusRegion]);
    window.setTimeout(() => {
      if (displayMode !== "globe") mapRef.current?.flyTo?.({ center: [REGION_FOCUSES[focusRegion].longitude, REGION_FOCUSES[focusRegion].latitude], zoom: displayMode === "tactical" ? Math.max(REGION_FOCUSES[focusRegion].zoom, 2.45) : REGION_FOCUSES[focusRegion].zoom, duration: 720, essential: true });
    }, 0);
    const url = new URL(window.location.href);
    if (nextRegions.includes("all")) url.searchParams.delete("regions"); else url.searchParams.set("regions", nextRegions.join(","));
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    setViewKey((key) => key + 1);
  }

  function toggleRelationType(id: RelationType) {
    setVisibleRelationTypes((current) => ({ ...current, [id]: !current[id] }));
    setAnalysisMode(analysisModeForType(id));
    setShowConflictHeat(id === "militaire" || id === "securitaire");
  }

  function toggleOrganizationFilter(id: string) {
    const next = activeOrganizationIds.includes(id) ? activeOrganizationIds.filter((entry) => entry !== id) : [...activeOrganizationIds, id];
    setActiveOrganizationIds(next);
    const focused = ORGANIZATIONS.filter((organization) => next.includes(organization.id));
    if (focused.length === 1) {
      const organization = focused[0];
      setFocusView({ longitude: organization.position[0], latitude: organization.position[1], zoom: displayMode === "globe" ? 0.95 : 3.15 });
      window.setTimeout(() => { if (displayMode !== "globe") mapRef.current?.flyTo?.({ center: organization.position, zoom: 3.15, duration: 720, essential: true }); }, 0);
    } else if (!focused.length) setFocusView(null);
    const url = new URL(window.location.href);
    if (next.length) url.searchParams.set("organizations", next.join(",")); else url.searchParams.delete("organizations");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    setViewKey((key) => key + 1);
  }
  function toggleDisplayMode(mode: DisplayMode) { setDisplayMode(mode); setViewKey((key) => key + 1); }
  function stepTimeline(amount: number) { setTimelineYear((year) => Math.max(1858, Math.min(2025, year + amount))); }

  function updatePeriodDate(boundary: "start" | "end", part: "day" | "month" | "year", value: number) {
    const current = boundary === "start" ? periodStartDate : periodEndDate;
    const year = part === "year" ? value : current.getFullYear();
    const month = part === "month" ? value : current.getMonth();
    const day = Math.min(part === "day" ? value : current.getDate(), new Date(year, month + 1, 0).getDate());
    const next = new Date(year, month, day);
    if (boundary === "start") {
      setPeriodStartDate(next);
      if (next > periodEndDate) setPeriodEndDate(next);
    } else {
      setPeriodEndDate(next);
      if (next < periodStartDate) setPeriodStartDate(next);
    }
    setTimelineYear(next.getFullYear());
    setIsPeriodAnimating(false);
    window.requestAnimationFrame(() => setIsPeriodAnimating(true));
    window.setTimeout(() => setIsPeriodAnimating(false), 190);
  }

  function selectRelationType(id: RelationType) {
    toggleRelationType(id);
  }

  function exportRelation(relation: Relation) {
    const reference = relationReference(relation);
    const type = RELATION_TYPES.find((entry) => entry.id === relation.type) ?? RELATION_TYPES[0];
    return { source: relation.source.name, target: relation.target.name, type: relation.type, typeLabel: type.label, color: relationColor(relation.type), title: relation.title, period: relationPeriodLabel(relation), detail: relation.detail, sourceLabel: reference.label, sourceUrl: reference.url };
  }

  function downloadComparisonCsv() {
    const content = createBilateralCsv(bilateralHistory.map(exportRelation));
    const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `atlas-flux-${compareLeft?.iso3 ?? "pays-a"}-${compareRight?.iso3 ?? "pays-b"}.csv`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  async function captureActiveMap() {
    await new Promise<void>((resolve) => window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve())));
    try {
      const canvases = Array.from(mapStageRef.current?.querySelectorAll("canvas") ?? []);
      const mapInstance = mapRef.current?.getMap?.() ?? mapRef.current;
      const baseMapCanvas = mapInstance?.getCanvas?.() as HTMLCanvasElement | undefined;
      const orderedCanvases = baseMapCanvas ? [baseMapCanvas, ...canvases.filter((canvas) => canvas !== baseMapCanvas)] : canvases;
      if (!orderedCanvases.length) return null;
      return composeMapCanvases(orderedCanvases) ?? baseMapCanvas?.toDataURL("image/png") ?? null;
    } catch {
      try { return (mapRef.current?.getMap?.() ?? mapRef.current)?.getCanvas?.().toDataURL("image/png") ?? null; } catch { return null; }
    }
  }

  async function downloadComparisonPdf() {
    const leftName = compareLeft?.name ?? "Pays A";
    const rightName = compareRight?.name ?? "Pays B";
    const report = createAtlasPdfReport({ eyebrow: "ATLAS FLUX / RAPPORT BILATÉRAL", headline: `${leftName} ↔ ${rightName}`, metadata: [`Période d’analyse : ${timelineYear} · Relations actives : ${bilateralRelations.length}`], relations: bilateralHistory.map(exportRelation), mapImage: await captureActiveMap() });
    report.save(`atlas-flux-${compareLeft?.iso3 ?? "pays-a"}-${compareRight?.iso3 ?? "pays-b"}.pdf`);
  }

  async function downloadScenarioSnapshot() {
    const selectedActor = selectedCountry?.name ?? selectedOrganization?.name ?? (selectedZone ? ANALYSIS_ZONES.find((zone) => zone.region === selectedZone)?.label : "Monde") ?? "Monde";
    const activeTypes = RELATION_TYPES.filter((type) => visibleRelationTypes[type.id]).map((type) => type.label).join(", ") || "Aucun";
    const regionLabel = REGION_FILTERS.find((region) => region.id === activeRegion)?.label ?? "Monde";
    const report = createAtlasPdfReport({ eyebrow: "ATLAS FLUX / EXPORT CARTOGRAPHIQUE", headline: selectedActor, metadata: [`Instant : ${timelineYear} · Vue : ${displayMode === "globe" ? "Globe 3D" : displayMode === "tactical" ? "Tactique 3D" : "Carte 2D"} · Mode : ${analysisMode}`, `Région : ${regionLabel} · Typologies : ${activeTypes}`], relations: activeRelations.map(exportRelation), mapImage: await captureActiveMap() });
    report.save(`atlas-flux-snapshot-${timelineYear}.pdf`);
  }

  function downloadDetailCsv(kind: string, title: string, relations: Relation[]) {
    const content = createBilateralCsv(relations.map(exportRelation));
    const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `atlas-flux-${kind.toLowerCase()}-${normalizeSearch(title).replace(/\s+/g, "-") || "fiche"}.csv`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  async function downloadDetailPdf(kind: string, title: string, relations: Relation[]) {
    const report = createAtlasPdfReport({ eyebrow: `ATLAS FLUX / FICHE ${kind.toUpperCase()}`, headline: title, metadata: [`Période de lecture : ${formatDateFr(periodStartDate)} — ${formatDateFr(periodEndDate)}`, `${relations.length} relation${relations.length > 1 ? "s" : ""} dans la fiche · ${relations.filter((relation) => relation.dataset === "demonstration").length} entrée${relations.filter((relation) => relation.dataset === "demonstration").length > 1 ? "s" : ""} démonstrative${relations.filter((relation) => relation.dataset === "demonstration").length > 1 ? "s" : ""}`], relations: relations.map(exportRelation), mapImage: await captureActiveMap() });
    report.save(`atlas-flux-${kind.toLowerCase()}-${normalizeSearch(title).replace(/\s+/g, "-") || "fiche"}.pdf`);
  }

  function saveNamedSnapshot() {
    const defaultName = `Relevé ${formatDateFr(new Date())}`;
    const name = window.prompt("Nommer ce relevé filtré", defaultName)?.trim();
    if (!name) return;
    const record: SavedSnapshot = { name, createdAt: new Date().toISOString(), regions: activeRegions, organizationIds: activeOrganizationIds, relationTypes: RELATION_TYPES.filter((type) => visibleRelationTypes[type.id]).map((type) => type.id), periodStart: periodStartDate.toISOString(), periodEnd: periodEndDate.toISOString(), displayMode, analysisMode, timelineYear, gravityThreshold };
    const next = [record, ...savedSnapshots].slice(0, 8);
    setSavedSnapshots(next);
    window.localStorage.setItem("atlas-flux-snapshots", JSON.stringify(next));
  }

  function createCollectionFromSavedSnapshots() {
    if (!isAuthenticated) { startLogin(); return; }
    const selectedSnapshots = savedSnapshots.filter((snapshot) => collectionSnapshotIds.includes(snapshot.createdAt));
    if (!selectedSnapshots.length) { setShareNotice("Sélectionnez au moins un relevé avant de créer une collection."); return; }
    const name = window.prompt("Nom de la collection", `Collection ${formatDateFr(new Date())}`)?.trim();
    if (!name) return;
    const shared = window.confirm("Partager cette collection par un lien unique ?");
    createCollectionMutation.mutate({ name, visibility: shared ? "shared" : "private", items: selectedSnapshots.map((snapshot) => ({ label: snapshot.name, snapshotJson: JSON.stringify(snapshot) })) });
  }

  function applySavedSnapshot(snapshot: SavedSnapshot) {
    const regions: RegionId[] = snapshot.regions?.length ? snapshot.regions : ["all"];
    setActiveRegions(regions);
    setActiveRegion(regions.length === 1 ? regions[0] : "all");
    setSelectedZone(regions.length === 1 && regions[0] !== "all" ? regions[0] : null);
    setActiveOrganizationIds(snapshot.organizationIds ?? []);
    setVisibleRelationTypes(() => Object.fromEntries(RELATION_TYPES.map((type) => [type.id, snapshot.relationTypes?.includes(type.id) ?? true])) as Record<RelationType, boolean>);
    setPeriodStartDate(new Date(snapshot.periodStart));
    setPeriodEndDate(new Date(snapshot.periodEnd));
    setDisplayMode(snapshot.displayMode ?? "map");
    setAnalysisMode(snapshot.analysisMode ?? "network");
    setTimelineYear(snapshot.timelineYear ?? 2024);
    setGravityThreshold(snapshot.gravityThreshold ?? 0);
    setFocusView(regions.length === 1 ? REGION_FOCUSES[regions[0]] : null);
    setSelectedActorId(null);
    setSelectedCountry(null);
    setSelectedRelation(null);
    setViewKey((key) => key + 1);
  }

  function deleteSavedSnapshot(createdAt: string) {
    const next = savedSnapshots.filter((snapshot) => snapshot.createdAt !== createdAt);
    setSavedSnapshots(next);
    window.localStorage.setItem("atlas-flux-snapshots", JSON.stringify(next));
  }

  async function shareSavedSnapshot(snapshot: SavedSnapshot | undefined = savedSnapshots[0]) {
    if (!snapshot) { setShareNotice("Enregistrez d’abord un relevé à partager."); return; }
    const url = new URL(window.location.href);
    url.searchParams.set("snapshot", window.btoa(encodeURIComponent(JSON.stringify(snapshot))));
    const shareData = { title: `Atlas Flux · ${snapshot.name}`, text: `Relevé filtré Atlas Flux : ${snapshot.name}`, url: url.toString() };
    try {
      const nativeShare = (navigator as unknown as { share?: (data: ShareData) => Promise<void> }).share;
      if (nativeShare) {
        await nativeShare(shareData);
        setShareNotice("Lien de relevé partagé.");
      } else {
        await navigator.clipboard?.writeText(url.toString());
        setShareNotice("Lien de relevé copié.");
      }
    } catch { setShareNotice("Partage annulé."); }
  }

  function tooltipFor(object: unknown, layerId?: string) {
    if (layerId?.startsWith("country-click-target")) {
      const properties = (object as any)?.properties ?? {};
      const name = properties.NAME_FR ?? properties.NAME ?? properties.ADMIN ?? "Pays";
      return `${name}\nCliquer pour révéler son réseau ; cliquer un second acteur pour comparer.`;
    }
    if (layerId?.startsWith("map-units")) {
      const properties = (object as any)?.properties ?? {};
      const name = properties.NAME_FR ?? properties.NAME ?? properties.GEOUNIT ?? "Unité cartographique";
      const status = properties.TYPE ?? "Unité cartographique";
      const sovereign = properties.SOVEREIGNT ?? properties.ADMIN;
      return `${name}\n${status}${sovereign ? ` · Souveraineté : ${sovereign}` : ""}\nCliquer pour consulter la fiche et comparer un second acteur.`;
    }
    if (layerId?.startsWith("conflict-cells")) {
      const cell = object as UcdpConflictCell;
      return `${UCDP_GED_SOURCE}\n${cell.year} · ${cell.events.toLocaleString("fr-FR")} événements\n${cell.fatalities.toLocaleString("fr-FR")} décès estimés (best)\nAgrégation spatiale : 0,5°`;
    }
    if (layerId?.startsWith("geopolitical-arcs")) {
      const relation = object as Relation;
      return `${relation.source.name} → ${relation.target.name}\n${relation.title} · ${relation.type} · ${relationPeriodLabel(relation)}\n${relation.detail}\nSource : ${relation.provenance ?? "Système de classification transmis"}`;
    }
    if (layerId?.startsWith("world-organizations")) {
      const organization = object as Organization;
      return `${organization.acronym} · ${organization.name}`;
    }
    const country = object as CountryDatum;
    return `${country.name}\nCliquer pour consulter la fiche et comparer un second acteur.`;
  }

  return (
    <div className={`atlas-shell atlas-world-shell theme-${theme} ${displayMode === "globe" ? "is-globe-mode" : ""} ${displayMode === "tactical" ? "is-tactical-mode" : ""} ${analysisMode === "evolution" ? "is-evolution-mode" : ""}`}>
      <header className="atlas-header" aria-label="Navigation principale">
        <a className="atlas-brand" href="#observatoire" aria-label="Atlas Flux — observatoire mondial"><svg className="atlas-mark atlas-logo-vector" viewBox="0 0 64 64" aria-hidden="true"><path d="M32 3 39 31 61 38 32 43Z" /><path d="m3 32 28-7 5 29Z" /></svg><span>ATLAS <em>FLUX</em></span></a>
        <div className="atlas-header-meta"><span className="live-dot" /><span>MONDE / RELATIONS</span><span className="header-rule" /><span>CARTOGRAPHIE INTERACTIVE</span></div>
        <div className="atlas-header-actions"><a className="source-link" href="https://data.worldbank.org/" target="_blank" rel="noreferrer">Sources ouvertes <ArrowUpRight size={15} aria-hidden="true" /></a><button type="button" className="theme-toggle" onClick={toggleTheme} title={theme === "dark" ? "Passer au thème clair" : "Passer au thème sombre"} aria-label={theme === "dark" ? "Passer au thème clair" : "Passer au thème sombre"}>{theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}</button></div>
      </header>

      <main id="observatoire" className="world-observatory">
        <section ref={mapStageRef} className={`world-map-stage ${areFiltersVisible ? "" : "filters-hidden"}`} aria-label="Carte mondiale des relations géopolitiques">
          <DeckGL
            key={displayMode === "globe" ? "globe" : `${viewKey}-${displayMode}`}
            views={globeView}
            initialViewState={displayMode === "globe" ? undefined : projectionView}
            viewState={displayMode === "globe" ? globeCamera : undefined}
            controller
            onViewStateChange={displayMode === "globe" ? ({ viewState }) => setGlobeCamera(viewState as typeof globeCamera) : undefined}
            layers={layers}
            getCursor={({ isDragging, isHovering }) => isDragging ? "grabbing" : isHovering ? "pointer" : "grab"}
            onHover={(info) => {
              if (info.object && info.layer?.id.startsWith("geopolitical-arcs")) setHoveredRelation({ relation: info.object as Relation, x: info.x, y: info.y });
              else setHoveredRelation(null);
            }}
            onClick={(info) => {
              if (!info.object || !info.layer) return;
              if (info.layer.id.startsWith("geopolitical-arcs")) { selectRelationDetail(info.object as Relation); return; }
              if (info.layer.id.startsWith("world-organizations")) { const organization = info.object as Organization; selectSearchEntry({ id: organization.id, label: organization.name, kind: "Organisation", position: organization.position, organization }); return; }
              if (info.layer.id.startsWith("country-click-target")) { const properties = (info.object as any)?.properties ?? {}; const id = String(properties.ISO_A3 ?? properties.ADM0_A3 ?? ""); const matchingCountry = allCountries.find((actor) => actor.iso3 === id); if (matchingCountry) selectCountryFromMap(matchingCountry); return; }
              const country = info.object as CountryDatum;
              if (country.iso3) selectCountryFromMap(country);
            }}
          >
            {displayMode !== "globe" && <Map key={`map-${viewKey}-${displayMode}-${theme}`} ref={mapRef} initialViewState={{ ...projectionView, pitch: displayMode === "tactical" ? 58 : 0, bearing: displayMode === "tactical" ? -14 : 0 } as any} mapStyle={(theme === "light" ? ATLAS_LIGHT_VECTOR_STYLE : ATLAS_DARK_VECTOR_STYLE) as any} attributionControl={false} canvasContextAttributes={{ preserveDrawingBuffer: true }} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}><NavigationControl position="bottom-right" showCompass={displayMode === "tactical"} /></Map>}
          </DeckGL>

          {isSplitComparison && <section className="split-comparison-overlay" aria-label={`Comparaison cartographique synchronisée ${evolutionStart} et ${evolutionEnd}`}>
            <header><div><p><GitCompareArrows size={15} aria-hidden="true" /> CARTE COMPARATIVE SYNCHRONISÉE</p><strong>{evolutionStart} <span>↔</span> {evolutionEnd}</strong></div><button type="button" onClick={() => setIsSplitComparison(false)} aria-label="Fermer la comparaison cartographique"><X size={18} /></button></header>
            <div className="split-map-grid">
              <article><div className="split-map-caption"><span>A · {evolutionStart}</span><small>{evolutionStartRelations.length} liens à cette date</small></div><DeckGL controller viewState={splitViewState as any} onViewStateChange={({ viewState }) => { const state = viewState as any; setSplitViewState({ longitude: state.longitude, latitude: state.latitude, zoom: state.zoom, bearing: state.bearing ?? 0, pitch: state.pitch ?? 0 }); }} layers={splitStartLayers} getTooltip={(info) => info.object ? { text: tooltipFor(info.object, info.layer?.id) } : null}><Map initialViewState={splitViewState as any} mapStyle={(theme === "light" ? ATLAS_LIGHT_VECTOR_STYLE : ATLAS_DARK_VECTOR_STYLE) as any} attributionControl={false} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} /></DeckGL></article>
              <article><div className="split-map-caption"><span>B · {evolutionEnd}</span><small>{evolutionEndRelations.length} liens à cette date</small></div><DeckGL controller viewState={splitViewState as any} onViewStateChange={({ viewState }) => { const state = viewState as any; setSplitViewState({ longitude: state.longitude, latitude: state.latitude, zoom: state.zoom, bearing: state.bearing ?? 0, pitch: state.pitch ?? 0 }); }} layers={splitEndLayers} getTooltip={(info) => info.object ? { text: tooltipFor(info.object, info.layer?.id) } : null}><Map initialViewState={splitViewState as any} mapStyle={(theme === "light" ? ATLAS_LIGHT_VECTOR_STYLE : ATLAS_DARK_VECTOR_STYLE) as any} attributionControl={false} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} /></DeckGL></article>
            </div>
            <footer><span><i className="is-persistent" /> Continus : {evolutionCounts.persistent}</span><span><i className="is-appeared" /> Apparitions : {evolutionCounts.appeared}</span><span><i className="is-ended" /> Sorties : {evolutionCounts.ended}</span><small>Déplacer ou zoomer une carte pour synchroniser l’autre.</small></footer>
          </section>}

          <div className="world-grid-labels" aria-hidden="true"><span>180° O</span><span>{displayMode === "globe" ? "GLOBE 3D" : displayMode === "tactical" ? "TACTIQUE 3D" : "0°"}</span><span>180° E</span><small>ATLAS / RELATIONS MONDIALES</small></div>
          {hoveredRelation && (() => { const reference = relationReference(hoveredRelation.relation); return <aside className="arc-source-tooltip" style={{ left: Math.min(hoveredRelation.x + 16, 820), top: Math.max(70, hoveredRelation.y - 12) }}><p><i style={{ backgroundColor: `rgb(${relationColor(hoveredRelation.relation.type).join(" ")})` }} />{hoveredRelation.relation.type} · {relationPeriodLabel(hoveredRelation.relation)}</p><strong>{hoveredRelation.relation.source.name} → {hoveredRelation.relation.target.name}</strong><span>{hoveredRelation.relation.title}</span><a href={reference.url} target="_blank" rel="noreferrer">{reference.label} <ExternalLink size={12} /></a></aside>; })()}

          <div className="world-intro intro-animate"><p className="eyebrow"><Radar size={14} aria-hidden="true" /> {displayMode === "globe" ? "GLOBE DES INTERDÉPENDANCES" : displayMode === "tactical" ? "VUE TACTIQUE LOCALE" : "OBSERVATOIRE GÉOPOLITIQUE"}</p><h1>Relier les<br /><i>forces</i> en présence.</h1><p>{displayMode === "tactical" ? "Approchez une zone, un pays ou une organisation pour examiner sa densité relationnelle et les événements de conflit sourcés." : "Un clic révèle le réseau d’un acteur ; un second clic sur un autre acteur lance leur comparaison directe. Filtrez ensuite les liens par nature et par période."}</p></div>
          <p className="demo-corpus-chip"><Database size={12} /> {DEMONSTRATION_RELATIONS.length} scénarios démonstratifs · non factuels</p><button className="map-filter-visibility-toggle" type="button" onClick={() => setAreFiltersVisible((visible) => !visible)} aria-pressed={areFiltersVisible} title={areFiltersVisible ? "Masquer les filtres" : "Afficher les filtres"}>{areFiltersVisible ? <Eye size={16} /> : <EyeOff size={16} />}</button>

          <section className="world-search" aria-label="Rechercher un acteur"><Search size={16} aria-hidden="true" /><input value={searchQuery} onFocus={() => setIsSearchFocused(true)} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Rechercher « France », « OTAN », « Europe »…" aria-label="Rechercher un pays, un territoire, une organisation ou une zone" />{searchQuery && <button type="button" onClick={() => setSearchQuery("")} aria-label="Effacer la recherche"><X size={15} /></button>}{searchResults.length > 0 && <div className="search-results"><p className="search-results-heading">{searchQuery ? `${searchResults.length} correspondance${searchResults.length > 1 ? "s" : ""}` : "Suggestions pour commencer"}</p>{searchResults.map((entry) => <button key={entry.id} type="button" onClick={() => { selectSearchEntry(entry); setIsSearchFocused(false); }}><span className={entry.kind === "Organisation" ? "search-kind is-organization" : "search-kind"}>{entry.flag ? <span className="country-flag" aria-hidden="true">{entry.flag}</span> : entry.kind === "Organisation" ? <Building2 size={13} /> : <MapPin size={13} />}</span><span><b>{entry.label}</b><small>{entry.kind}{entry.country?.sovereign ? ` · ${entry.country.sovereign}` : ""}</small></span><ChevronRight size={14} className="search-result-arrow" aria-hidden="true" /></button>)}</div>}</section>

          {analysisMode === "evolution" && <section className="evolution-comparison-panel" aria-label="Comparaison cartographique entre les dates A et B"><div><p><GitCompareArrows size={14} aria-hidden="true" /> COMPARAISON CARTOGRAPHIQUE</p><strong>{evolutionStart} <span>→</span> {evolutionEnd}</strong></div><div className="evolution-window"><label>DE <input type="number" min="1858" max={evolutionEnd} value={evolutionStart} onChange={(event) => setEvolutionStart(Number(event.target.value))} /></label><span>→</span><label>À <input type="number" min={evolutionStart} max="2025" value={evolutionEnd} onChange={(event) => setEvolutionEnd(Number(event.target.value))} /></label></div><div className="evolution-emphasis-controls" aria-label="Lecture de la comparaison"><button type="button" className={evolutionEmphasis === "start" ? "is-active" : ""} onClick={() => setEvolutionEmphasis("start")} aria-pressed={evolutionEmphasis === "start"}>A · {evolutionStart}</button><button type="button" className={evolutionEmphasis === "delta" ? "is-active" : ""} onClick={() => setEvolutionEmphasis("delta")} aria-pressed={evolutionEmphasis === "delta"}>Δ · écarts</button><button type="button" className={evolutionEmphasis === "end" ? "is-active" : ""} onClick={() => setEvolutionEmphasis("end")} aria-pressed={evolutionEmphasis === "end"}>B · {evolutionEnd}</button></div>{evolutionEmphasis === "delta" && <div className="evolution-delta-legend"><span><i className="is-persistent" />{evolutionCounts.persistent} continus</span><span><i className="is-appeared" />{evolutionCounts.appeared} apparus</span><span><i className="is-ended" />{evolutionCounts.ended} sortis</span></div>}<small>Les liens Wikidata non datés sont structurels ; ils restent hors comparaison chronologique.</small></section>}
          {analysisMode === "evolution" && <button className="split-comparison-trigger" type="button" onClick={openSplitComparison}><GitCompareArrows size={15} /> Ouvrir la carte A/B</button>}

          {selectedLegendType && (() => { const type = RELATION_TYPES.find((item) => item.id === selectedLegendType) ?? RELATION_TYPES[0]; const legend = RELATION_LEGENDS[type.id]; const property = type.id === "geopolitique" ? "P47" : type.id === "juridique" ? "P463" : null; return <aside className="contextual-legend-panel" aria-live="polite" aria-label={`Légende détaillée : ${type.label}`}><button className="detail-close" type="button" onClick={() => setSelectedLegendType(null)} aria-label="Fermer la légende"><X size={17} /></button><p className="eyebrow"><span style={{ backgroundColor: `rgb(${type.color.join(" ")})` }} /> LÉGENDE CONTEXTUELLE</p><h3>{type.label}</h3><p>{legend.definition}</p><div className="legend-reading"><b>Comment lire</b><span>{legend.reading}</span></div><div className="legend-cue"><MapPin size={13} aria-hidden="true" /><span><b>Repère associé</b>{legend.cue}</span></div>{property && <a className="relation-source-link" href={wikidataPropertyUrl(property)} target="_blank" rel="noreferrer">Wikidata · propriété {property} <ExternalLink size={13} /></a>}<div className="legend-type-options" aria-label="Choisir une typologie à expliquer">{RELATION_TYPES.map((item) => <button key={item.id} type="button" className={item.id === type.id ? "is-active" : ""} onClick={() => applyPrimaryFilterFocus({ type: item.id })} aria-pressed={item.id === type.id}><i style={{ backgroundColor: `rgb(${item.color.join(" ")})` }} />{item.short}</button>)}</div></aside>; })()}

          <section className="world-filter-panel world-filter-panel-merged relation-filter-panel intro-animate delay-1" aria-label="Filtres principaux">
            <div className="world-filter-title"><span className="compass-state-marker" aria-hidden="true" /><Filter size={15} aria-hidden="true" /><span>FILTRES PRINCIPAUX</span><b>{String(activeRelations.length).padStart(2, "0")}</b></div>
            <div className="filter-map-controls" aria-label="Projection"><div className="display-mode-switch"><button type="button" title="Carte plane" aria-pressed={displayMode === "map"} className={displayMode === "map" ? "is-active" : ""} onClick={() => toggleDisplayMode("map")}>2D</button><button type="button" title="Globe" aria-pressed={displayMode === "globe"} className={displayMode === "globe" ? "is-active" : ""} onClick={() => toggleDisplayMode("globe")}>GLOBE</button><button type="button" title="Vue tactique" aria-pressed={displayMode === "tactical"} className={displayMode === "tactical" ? "is-active" : ""} onClick={() => toggleDisplayMode("tactical")}>TAC</button></div></div>
            <button className="filter-legend-trigger" type="button" onClick={() => setSelectedLegendType((current) => current ?? RELATION_TYPES.find((type) => visibleRelationTypes[type.id])?.id ?? "geopolitique")} aria-expanded={selectedLegendType !== null}><CircleHelp size={14} aria-hidden="true" /> Décoder les typologies</button>
            <div className="filter-group"><p>RÉGIONS · CHOIX MULTIPLES</p><div className="filter-pills region-pills">{REGION_FILTERS.map((region) => <button key={region.id} type="button" className={activeRegions.includes(region.id) ? "is-selected" : ""} onClick={() => toggleRegionFilter(region.id)} aria-pressed={activeRegions.includes(region.id)}>{region.label}</button>)}</div></div><div className="filter-group filter-organizations filter-organizations-priority"><p><Building2 size={13} /> ORGANISATIONS · CHOIX MULTIPLES</p><div className="filter-pills">{ORGANIZATIONS.slice(0, 8).map((organization) => <button type="button" key={organization.id} className={activeOrganizationIds.includes(organization.id) ? "is-selected" : ""} onClick={() => toggleOrganizationFilter(organization.id)} aria-pressed={activeOrganizationIds.includes(organization.id)}>{organization.acronym}</button>)}</div>{activeOrganizationIds.length > 0 && <small>{activeOrganizationIds.length} organisation{activeOrganizationIds.length > 1 ? "s" : ""} sélectionnée{activeOrganizationIds.length > 1 ? "s" : ""}</small>}</div>
            <div className="filter-group date-range-filter"><p><CalendarDays size={13} aria-hidden="true" /> PÉRIODE DE LECTURE</p><div className="date-range-inputs"><label>DE<input type="date" value={periodStartDate.toISOString().slice(0, 10)} max={periodEndDate.toISOString().slice(0, 10)} onChange={(event) => { const value = new Date(`${event.target.value}T00:00:00`); setPeriodStartDate(value); setTimelineYear(value.getFullYear()); }} /></label><label>À<input type="date" value={periodEndDate.toISOString().slice(0, 10)} min={periodStartDate.toISOString().slice(0, 10)} onChange={(event) => { const value = new Date(`${event.target.value}T00:00:00`); setPeriodEndDate(value); setTimelineYear(value.getFullYear()); }} /></label></div><Popover><PopoverTrigger asChild><button className="calendar-range-trigger" type="button"><CalendarDays size={14} /> Calendrier · {formatDateFr(periodStartDate)} — {formatDateFr(periodEndDate)}</button></PopoverTrigger><PopoverContent className="atlas-date-popover" align="start"><Calendar mode="range" selected={{ from: periodStartDate, to: periodEndDate }} onSelect={(range) => { if (range?.from) setPeriodStartDate(range.from); if (range?.to) { setPeriodEndDate(range.to); setTimelineYear(range.to.getFullYear()); } }} captionLayout="dropdown" fromYear={1858} toYear={2025} numberOfMonths={1} /></PopoverContent></Popover></div>
            <div className={`period-wheel-picker filter-period-wheel ${isPeriodAnimating ? "is-changing" : ""}`} aria-label="Sélecteur de période à listes défilantes"><p><CalendarDays size={14} /> PÉRIODE · MOLETTES</p>{(["start", "end"] as const).map((boundary) => { const date = boundary === "start" ? periodStartDate : periodEndDate; return <div key={boundary}><b>{boundary === "start" ? "DE" : "À"} {formatDateFr(date)}</b><span><select aria-label={`${boundary === "start" ? "Jour de début" : "Jour de fin"}`} value={date.getDate()} onChange={(event) => updatePeriodDate(boundary, "day", Number(event.target.value))}>{Array.from({ length: 31 }, (_, index) => <option key={index + 1} value={index + 1}>{String(index + 1).padStart(2, "0")}</option>)}</select><select aria-label={`${boundary === "start" ? "Mois de début" : "Mois de fin"}`} value={date.getMonth()} onChange={(event) => updatePeriodDate(boundary, "month", Number(event.target.value))}>{Array.from({ length: 12 }, (_, index) => <option key={index} value={index}>{String(index + 1).padStart(2, "0")}</option>)}</select><select aria-label={`${boundary === "start" ? "Année de début" : "Année de fin"}`} value={date.getFullYear()} onChange={(event) => updatePeriodDate(boundary, "year", Number(event.target.value))}>{Array.from({ length: 168 }, (_, index) => 1858 + index).map((year) => <option key={year} value={year}>{year}</option>)}</select></span></div>; })}</div>
            <div className="filter-group filter-typologies"><p><Layers3 size={13} aria-hidden="true" /> LIENS · CHOIX MULTIPLES</p><div className="relation-type-grid relation-type-grid-expanded">{RELATION_TYPES.map((type) => <button key={type.id} data-relation={type.short} type="button" onClick={() => selectRelationType(type.id)} className={visibleRelationTypes[type.id] ? "is-active" : ""} aria-pressed={visibleRelationTypes[type.id]}><i style={{ backgroundColor: `rgb(${type.color.join(" ")})` }} /><span>{type.label}</span><em>{visibleRelationTypes[type.id] ? "actif" : ""}</em></button>)}</div></div>
            <button type="button" className={`heatmap-toggle ${showConflictHeat ? "is-active" : ""}`} onClick={() => setShowConflictHeat((value) => !value)}><span /> Conflits UCDP GED <em>{UCDP_GED_PERIOD}</em></button>{showConflictHeat && <div className="gravity-filter"><p>GRAVITÉ · DÉCÈS ESTIMÉS</p><div>{GRAVITY_FILTERS.map((filter) => <button key={filter.value} type="button" className={gravityThreshold === filter.value ? "is-active" : ""} onClick={() => setGravityThreshold(filter.value)}>{filter.label}</button>)}</div><small>{conflictSignals.length} cellules visibles</small></div>}
            <div className="filter-group filter-organizations"><p><Building2 size={13} /> ORGANISATIONS · CHOIX MULTIPLES</p><div className="filter-pills">{ORGANIZATIONS.slice(0, 8).map((organization) => <button type="button" key={organization.id} className={activeOrganizationIds.includes(organization.id) ? "is-selected" : ""} onClick={() => toggleOrganizationFilter(organization.id)} aria-pressed={activeOrganizationIds.includes(organization.id)}>{organization.acronym}</button>)}</div>{activeOrganizationIds.length > 0 && <small>{activeOrganizationIds.length} organisation{activeOrganizationIds.length > 1 ? "s" : ""} sélectionnée{activeOrganizationIds.length > 1 ? "s" : ""}</small>}</div>
            {showConflictHeat && <div className="ucdp-gravity-legend"><b>UCDP GED · LECTURE DES SEUILS</b><span><i className="is-neutral" /> Tous · visibilité du sous-ensemble agrégé</span><span><i className="is-low" /> 500+ · signal de vigilance</span><span><i className="is-medium" /> 2 000+ · intensité élevée</span><span><i className="is-critical" /> 10 000+ · alerte critique</span></div>}
            {savedSnapshots.length > 0 && <div className="saved-snapshots-list"><b>RELEVÉS MÉMORISÉS</b>{savedSnapshots.slice(0, 3).map((snapshot) => <div key={snapshot.createdAt}><button type="button" onClick={() => applySavedSnapshot(snapshot)} title="Réappliquer les filtres de ce relevé">{snapshot.name}</button><button type="button" onClick={() => deleteSavedSnapshot(snapshot.createdAt)} aria-label={`Supprimer ${snapshot.name}`} title="Supprimer ce relevé"><X size={12} /></button></div>)}</div>}
            <p className="filter-status">{isLoading ? "Lecture des acteurs…" : `${filteredCount} pays et territoires référencés`}</p>
          </section>

          <section className="relation-timeline" aria-label="Timeline des relations"><div><Clock3 size={15} aria-hidden="true" /><span>TIMELINE</span></div><button type="button" onClick={() => stepTimeline(-1)} aria-label="Année précédente"><ChevronLeft size={16} /></button><div className="timeline-slider-wrap"><input type="range" min="1858" max="2025" value={timelineYear} onChange={(event) => setTimelineYear(Number(event.target.value))} onPointerMove={(event) => { const rect = event.currentTarget.getBoundingClientRect(); setTimelinePreviewYear(Math.round(1858 + ((event.clientX - rect.left) / rect.width) * (2025 - 1858))); }} onPointerLeave={() => setTimelinePreviewYear(null)} aria-label="Année des relations" />{timelinePreviewYear !== null && <div className="timeline-preview"><b>{timelinePreviewYear}</b><span>{RELATIONS.filter((relation) => isRelationActiveAt(relation, timelinePreviewYear)).length} liens du corpus</span></div>}</div><button type="button" onClick={() => stepTimeline(1)} aria-label="Année précédente"><ChevronRight size={16} /></button><strong>{timelineYear}</strong><p>{activeRelations.length} liens actifs</p></section>

          <aside className={`world-detail-panel ${selectedCountry || selectedOrganization ? "is-open" : ""}`} aria-live="polite" aria-label="Fiche acteur">
            <button className="detail-close" type="button" onClick={() => { setSelectedCountry(null); setSelectedActorId(null); }} aria-label="Fermer la fiche"><X size={17} /></button>
            {selectedCountry && (() => { const countryRelations = activeRelations.filter((relation) => relation.source.id === selectedCountry.iso3 || relation.target.id === selectedCountry.iso3); const militaryRelations = countryRelations.filter((relation) => relation.type === "militaire").length; const tensionRelations = countryRelations.filter((relation) => relation.type === "securitaire" || relation.type === "geopolitique").length; const organizations = ORGANIZATIONS.filter((organization) => RELATIONS.some((relation) => (relation.source.id === selectedCountry.iso3 && relation.target.id === organization.id) || (relation.target.id === selectedCountry.iso3 && relation.source.id === organization.id))); return <Tabs value={countryTab} onValueChange={setCountryTab} className="country-profile-tabs"><div className="country-profile-head"><p className="eyebrow"><MapPin size={14} aria-hidden="true" /> {selectedCountry.entityKind === "territory" ? "FICHE TERRITOIRE" : "FICHE PAYS"}</p><span>{selectedCountry.iso3}</span><h2>{selectedCountry.name}</h2><p className="country-capital">{selectedCountry.entityKind === "territory" ? selectedCountry.status ?? "Unité cartographique" : selectedCountry.capital || "Capitale non renseignée"}</p><a className="country-wikipedia" href={countryWikipediaUrl(selectedCountry.name)} target="_blank" rel="noreferrer"><ExternalLink size={14} /> Voir sur Wikipédia</a><div className="country-relations-count"><div><strong>{countryRelations.length}</strong><span>Relations</span></div><div><strong className="is-positive">{militaryRelations}</strong><span>Liens militaires</span></div><div><strong className="is-attention">{tensionRelations}</strong><span>Vigilances</span></div></div></div><TabsList className="country-tabs-list"><TabsTrigger value="infos">Infos</TabsTrigger><TabsTrigger value="relations">Relations</TabsTrigger><TabsTrigger value="organizations">Organisations</TabsTrigger></TabsList><TabsContent value="infos" className="country-tab-content"><div className="country-tags"><span>{REGION_FILTERS.find((region) => region.id === selectedCountry.region)?.label ?? "Monde"}</span>{selectedCountry.entityKind === "territory" && <span>{selectedCountry.sovereign ?? "Territoire"}</span>}</div><div className="country-profile-fields"><p><MapPin size={15} /><span>CAPITALE</span><strong>{selectedCountry.capital || "Non renseignée"}</strong></p><p><UsersRound size={15} /><span>POPULATION</span><strong>{formatMetric("population", selectedCountry.indicators.population[indicatorYear])}</strong></p><p><Landmark size={15} /><span>INDICATEUR ÉCONOMIQUE</span><strong>{formatMetric("gdp", selectedCountry.indicators.gdp[indicatorYear])}</strong></p><p><Activity size={15} /><span>EFFORT DE DÉFENSE</span><strong>{formatMetric("defense", selectedCountry.indicators.defense[indicatorYear])}</strong></p></div><div className="actor-source-links"><a className="detail-link" href={countryWikipediaUrl(selectedCountry.name)} target="_blank" rel="noreferrer"><BookOpen size={14} /> Wikipédia — {selectedCountry.name} <ExternalLink size={14} /></a>{selectedCountry.entityKind !== "territory" && <a className="detail-link" href={`https://data.worldbank.org/country/${selectedCountry.iso2.toLowerCase()}`} target="_blank" rel="noreferrer">Banque mondiale <ExternalLink size={14} /></a>}</div></TabsContent><TabsContent value="relations" className="country-tab-content"><p className="tab-note">{countryRelations.length} relation{countryRelations.length > 1 ? "s" : ""} dans la période sélectionnée.</p><div className="country-relation-list">{countryRelations.length ? countryRelations.map((relation) => <button key={relation.id} type="button" onClick={() => selectRelationDetail(relation)}><i style={{ backgroundColor: `rgb(${relationColor(relation.type).join(" ")})` }} /><span><b>{relation.source.id === selectedCountry.iso3 ? relation.target.name : relation.source.name}</b><small>{relation.title} · {relationPeriodLabel(relation)}</small></span></button>) : <p className="tab-note">Aucune relation visible pour cette période.</p>}</div></TabsContent><TabsContent value="organizations" className="country-tab-content"><div className="country-relation-list">{organizations.length ? organizations.map((organization) => <button key={organization.id} type="button" onClick={() => selectSearchEntry({ id: organization.id, label: organization.name, kind: "Organisation", position: organization.position, organization })}><Building2 size={15} /><span><b>{organization.acronym}</b><small>{organization.name}</small></span></button>) : <p className="tab-note">Aucune organisation reliée dans le corpus affiché.</p>}</div></TabsContent><footer className="country-profile-footer"><span>Mis à jour selon la période sélectionnée</span><button type="button" onClick={downloadScenarioSnapshot}><Printer size={14} /> PDF</button></footer></Tabs>; })()}
            {selectedOrganization && (() => { const reference = ORGANIZATION_REFERENCES[selectedOrganization.id]; const organizationRelations = activeRelations.filter((relation) => relation.source.id === selectedOrganization.id || relation.target.id === selectedOrganization.id); const organizationTypes = new Set(organizationRelations.map((relation) => relation.type)); return <>
              <p className="eyebrow"><Building2 size={14} aria-hidden="true" /> FICHE ORGANISATION</p><h2>{selectedOrganization.acronym}</h2><p className="country-capital">{selectedOrganization.name}</p>
              <div className="organization-context-grid"><div><span>STATUT</span><strong>Organisation</strong></div><div><span>POSITION</span><strong>{selectedOrganization.position[1].toFixed(1)}° / {selectedOrganization.position[0].toFixed(1)}°</strong></div><div><span>LIENS ACTIFS</span><strong>{organizationRelations.length}</strong></div><div><span>TYPOLOGIES</span><strong>{organizationTypes.size}</strong></div></div>
              <p className="country-note">{selectedOrganization.description}</p><div className="actor-source-links"><a className="detail-link" href={reference.wikipedia} target="_blank" rel="noreferrer"><BookOpen size={14} aria-hidden="true" /> Wikipédia <ExternalLink size={14} aria-hidden="true" /></a><a className="detail-link" href={reference.official} target="_blank" rel="noreferrer">Site officiel <ExternalLink size={14} aria-hidden="true" /></a></div>
            </>; })()}
          </aside>

          {(selectedCountry || selectedOrganization || selectedRelation) && (() => { const title = selectedRelation ? `${selectedRelation.source.name} — ${selectedRelation.target.name}` : selectedCountry?.name ?? selectedOrganization?.name ?? "Fiche"; const kind = selectedRelation ? "relation" : selectedCountry ? "pays" : "organisation"; const relations = selectedRelation ? [selectedRelation] : activeRelations.filter((relation) => relation.source.id === selectedCountry?.iso3 || relation.target.id === selectedCountry?.iso3 || relation.source.id === selectedOrganization?.id || relation.target.id === selectedOrganization?.id); return <div className="detail-export-dock" aria-label="Exporter la fiche détaillée"><span>EXPORTER LA FICHE</span><button type="button" onClick={() => void downloadDetailPdf(kind, title, relations)}><Printer size={14} /> PDF</button><button type="button" onClick={() => downloadDetailCsv(kind, title, relations)}><FileSpreadsheet size={14} /> CSV</button></div>; })()}

          {(selectedCountry || selectedRelation || selectedOrganization) && (() => { const actor = selectedCountry ? { id: selectedCountry.iso3, name: selectedCountry.name, position: selectedCountry.position } : selectedRelation ? selectedRelation.source : selectedOrganization ? { id: selectedOrganization.id, name: selectedOrganization.name, position: selectedOrganization.position } : null; if (!actor) return null; const wikidataContext = WIKIDATA_RESOLVED_RELATIONS.filter((relation) => relation.source.id === actor.id || relation.target.id === actor.id); const ucdpContext = UCDP_CONFLICT_CELLS.filter((cell) => cell.year >= periodStartDate.getFullYear() && cell.year <= periodEndDate.getFullYear() && Math.abs(cell.position[0] - actor.position[0]) < 12 && Math.abs(cell.position[1] - actor.position[1]) < 9); const fatalities = ucdpContext.reduce((sum, cell) => sum + cell.fatalities, 0); return <aside className="context-evidence-panel" aria-live="polite" aria-label="Contexte UCDP et Wikidata"><p><Database size={13} /> CONTEXTE SOURCÉ</p><div><b>Wikidata</b><span>{wikidataContext.length} relation{wikidataContext.length > 1 ? "s" : ""} P47/P463 pour {actor.name}</span>{wikidataContext.slice(0, 2).map((relation) => <a key={relation.id} href={wikidataUrl(relation.source.id === actor.id ? relation.target.qid : relation.source.qid)} target="_blank" rel="noreferrer">{relation.title} · {relation.start ? `${relation.start}${relation.end ? `–${relation.end}` : "–auj."}` : "structurelle"}<ExternalLink size={11} /></a>)}</div><div><b>UCDP GED</b><span>{ucdpContext.length} cellule{ucdpContext.length > 1 ? "s" : ""} proche{ucdpContext.length > 1 ? "s" : ""} · {fatalities.toLocaleString("fr-FR")} décès agrégés</span><a href={UCDP_GED_SOURCE} target="_blank" rel="noreferrer">Sous-ensemble {UCDP_GED_PERIOD} <ExternalLink size={11} /></a></div></aside>; })()}

          <aside className={`world-relation-panel ${selectedRelation ? "is-open" : ""}`} aria-live="polite" aria-label="Détail de la relation"><button className="detail-close" type="button" onClick={() => setSelectedRelation(null)} aria-label="Fermer le détail"><X size={17} /></button>{selectedRelation && (() => { const reference = relationReference(selectedRelation); const type = RELATION_TYPES.find((entry) => entry.id === selectedRelation.type) ?? RELATION_TYPES[0]; const intensity = Math.min(10, Math.max(2, Math.round((selectedRelation.detail.length + (selectedRelation.end ? 30 : 10)) / 24))); return <><div className="relation-profile-head"><p className="eyebrow"><i style={{ backgroundColor: `rgb(${type.color.join(" ")})` }} /> {type.label.toUpperCase()}</p><h3>{selectedRelation.source.name}<span>→</span>{selectedRelation.target.name}</h3></div><div className="relation-quick-actions"><button type="button" onClick={() => setSelectedActorId(selectedRelation.source.id)}><UsersRound size={14} /> Voir les acteurs</button><a href={reference.url} target="_blank" rel="noreferrer"><ExternalLink size={14} /> Voir la relation</a><button type="button" onClick={() => navigator.clipboard?.writeText(window.location.href)}><ArrowUpRight size={14} /> Partager</button></div><div className="relation-facts"><div><span>PÉRIODE</span><strong>{relationPeriodLabel(selectedRelation)}</strong></div><div><span>ÉCHELLE</span><strong>{activeRegions.includes("all") ? "Mondiale" : activeRegions.length > 1 ? "Multi-régionale" : "Régionale"}</strong></div><div><span>INTENSITÉ</span><strong><i><b style={{ width: `${intensity * 10}%`, backgroundColor: `rgb(${type.color.join(" ")})` }} /></i>{intensity}/10</strong></div></div><section className="relation-summary"><p>RÉSUMÉ</p><h4>{selectedRelation.title}</h4><span>{selectedRelation.detail}</span></section><section className="relation-history-card"><p><Clock3 size={14} /> HISTORIQUE <em>{selectedRelation.start ? "1 événement" : "Structurel"}</em></p><div><strong>{selectedRelation.start ?? "—"}</strong><span>{selectedRelation.end ? `→ ${selectedRelation.end}` : "→ aujourd’hui"}</span></div><small>Dernière mise à jour : lecture de la source active</small></section><a className="relation-source-link" href={reference.url} target="_blank" rel="noreferrer"><BookOpen size={14} /> {reference.label} <ExternalLink size={14} /></a><div className="relation-bottom-actions"><button type="button" onClick={downloadScenarioSnapshot}><Printer size={15} /> PDF</button><button type="button" onClick={openContribution}><PenLine size={15} /> Correction</button></div></>; })()}</aside>

          <aside className={`bilateral-comparator ${isComparatorOpen ? "is-open" : ""}`} aria-label="Comparateur bilatéral"><button className="detail-close" type="button" onClick={() => setIsComparatorOpen(false)} aria-label="Fermer le comparateur"><X size={17} /></button><p className="eyebrow"><GitCompareArrows size={14} aria-hidden="true" /> COMPARATEUR BILATÉRAL</p><h3>Deux acteurs,<br /><i>une relation</i>.</h3><div className="comparator-selects"><label><span>ACTEUR A</span><select value={compareLeftId} onChange={(event) => setCompareLeftId(event.target.value)}>{allCountries.map((country) => <option key={country.iso3} value={country.iso3}>{countryFlag(country.iso2)} {country.name}</option>)}</select></label><span className="compare-arrow">↔</span><label><span>ACTEUR B</span><select value={compareRightId} onChange={(event) => setCompareRightId(event.target.value)}>{allCountries.map((country) => <option key={country.iso3} value={country.iso3}>{countryFlag(country.iso2)} {country.name}</option>)}</select></label></div><section className="comparison-history" aria-label="Évolution historique des relations"><div className="comparison-history-heading"><Activity size={14} /><span>ÉVOLUTION HISTORIQUE</span><b>{historyStart} — 2025</b></div>{datedBilateralHistory.length ? <div className="history-lines">{datedBilateralHistory.map((relation) => <div className="history-line" key={relation.id}><span>{relation.type}</span><div className="history-track"><i style={{ left: `${((relation.start - historyStart) / Math.max(1, 2025 - historyStart)) * 100}%`, width: `${(((relation.end ?? 2025) - relation.start) / Math.max(1, 2025 - historyStart)) * 100}%`, backgroundColor: `rgb(${relationColor(relation.type).join(" ")})` }} /><em style={{ left: `${((timelineYear - historyStart) / Math.max(1, 2025 - historyStart)) * 100}%` }} /></div></div>)}</div> : <div className="comparison-empty">Aucune évolution datée n’est renseignée pour cette paire ; les liens structurels restent visibles dans le résumé.</div>}</section><div className="comparison-summary"><p>{compareLeft?.name ?? "Acteur A"}<span>↔</span>{compareRight?.name ?? "Acteur B"}</p>{bilateralRelations.length > 0 ? bilateralRelations.map((relation) => { const reference = relationReference(relation); return <article key={relation.id}><i style={{ backgroundColor: `rgb(${relationColor(relation.type).join(" ")})` }} /><div><b>{relation.title}</b><small>{relation.type} · {relationPeriodLabel(relation)}</small><span>{relation.detail}</span><a href={reference.url} target="_blank" rel="noreferrer">{reference.label} <ExternalLink size={12} /></a></div></article>; }) : <div className="comparison-empty">Aucune relation active de ce corpus pour la période sélectionnée.</div>}</div><div className="comparison-exports"><button type="button" onClick={downloadComparisonCsv}><FileSpreadsheet size={14} /> CSV</button><button type="button" onClick={downloadComparisonPdf}><FileText size={14} /> Rapport PDF</button></div><button className="comparison-focus" type="button" onClick={() => { if (compareLeft && compareRight) { setSelectedActorId(null); setFocusView({ longitude: (compareLeft.position[0] + compareRight.position[0]) / 2, latitude: (compareLeft.position[1] + compareRight.position[1]) / 2, zoom: displayMode === "globe" ? 0.65 : 2.2 }); setViewKey((key) => key + 1); } }}><LocateFixed size={14} /> Cadrer les deux acteurs</button></aside>

          <aside className={`contribution-panel ${isContributionOpen ? "is-open" : ""}`} aria-label="Proposer ou valider une relation"><button className="detail-close" type="button" onClick={() => setIsContributionOpen(false)} aria-label="Fermer la contribution"><X size={17} /></button><p className="eyebrow"><PenLine size={14} aria-hidden="true" /> CONTRIBUTION SOURCÉE</p><h3>Proposer une<br /><i>relation</i>.</h3><p>Chaque proposition exige une source vérifiable et reste en attente de validation éditoriale.</p>{!isAuthenticated ? <button type="button" className="contribution-login" onClick={openContribution}>Se connecter pour contribuer <ArrowUpRight size={14} /></button> : <form className="proposal-form" onSubmit={submitProposal}><label>ACTEUR SOURCE<input required value={proposalForm.sourceActor} onChange={(event) => setProposalForm((form) => ({ ...form, sourceActor: event.target.value }))} placeholder="Ex. France" /></label><label>ACTEUR CIBLE<input required value={proposalForm.targetActor} onChange={(event) => setProposalForm((form) => ({ ...form, targetActor: event.target.value }))} placeholder="Ex. Union européenne" /></label><label>TYPOLOGIE<select value={proposalForm.relationType} onChange={(event) => setProposalForm((form) => ({ ...form, relationType: event.target.value }))}>{RELATION_TYPES.map((type) => <option value={type.id} key={type.id}>{type.label}</option>)}</select></label><label>INTITULÉ<input required minLength={4} value={proposalForm.title} onChange={(event) => setProposalForm((form) => ({ ...form, title: event.target.value }))} placeholder="Nom de la relation" /></label><label>DÉTAIL<textarea required minLength={20} value={proposalForm.detail} onChange={(event) => setProposalForm((form) => ({ ...form, detail: event.target.value }))} placeholder="Périmètre, contexte et qualification de la relation" /></label><label>SOURCE VÉRIFIABLE<input required type="url" value={proposalForm.sourceUrl} onChange={(event) => setProposalForm((form) => ({ ...form, sourceUrl: event.target.value }))} placeholder="https://…" /></label><div className="proposal-years"><label>DÉBUT<input type="number" min="1800" max="2100" value={proposalForm.startYear} onChange={(event) => setProposalForm((form) => ({ ...form, startYear: event.target.value }))} /></label><label>FIN<input type="number" min="1800" max="2100" value={proposalForm.endYear} onChange={(event) => setProposalForm((form) => ({ ...form, endYear: event.target.value }))} /></label></div><button type="submit" disabled={proposalMutation.isPending}>{proposalMutation.isPending ? "Envoi…" : "Soumettre à validation"} <ArrowUpRight size={14} /></button>{proposalMutation.isSuccess && <small className="proposal-success"><Check size={13} /> Proposition transmise à la revue éditoriale.</small>}{proposalMutation.error && <small className="proposal-error">La proposition doit comporter une source et des dates cohérentes.</small>}</form>}{user?.role === "admin" && <section className="proposal-review"><p><Check size={13} /> REVUE ÉDITORIALE</p>{pendingProposalsQuery.isLoading ? <small>Lecture des propositions…</small> : pendingProposalsQuery.data?.length ? pendingProposalsQuery.data.map((proposal) => <article key={proposal.id}><b>{proposal.sourceActor} → {proposal.targetActor}</b><span>{proposal.title}</span><a href={proposal.sourceUrl} target="_blank" rel="noreferrer">Source <ExternalLink size={12} /></a><div><button type="button" onClick={() => reviewMutation.mutate({ id: proposal.id, status: "approved" })}>Valider</button><button type="button" onClick={() => reviewMutation.mutate({ id: proposal.id, status: "rejected" })}>Refuser</button></div></article>) : <small>Aucune proposition en attente.</small>}</section>}</aside>

          {dataError && <p className="map-data-error" role="status">Les indicateurs mondiaux n’ont pas pu être chargés. Veuillez réessayer plus tard.</p>}
        </section>
      </main>

      <section className="world-map-action-bar" aria-label="Actions cartographiques"><div className="map-actions-left"><Button className="instrument-button compare-trigger" variant="outline" title="Sélectionner deux pays et examiner leurs relations" onClick={() => setIsComparatorOpen(true)}><GitCompareArrows size={16} aria-hidden="true" /> Comparer</Button><Button className="instrument-button" variant="outline" title="Revenir au cadrage mondial" onClick={resetView}><LocateFixed size={16} aria-hidden="true" /> Recentrer</Button><Button className="instrument-button contribution-trigger" variant="outline" title="Proposer une relation sourcée à validation éditoriale" onClick={openContribution}><PenLine size={16} aria-hidden="true" /> Annoter</Button><Button className="instrument-button saved-snapshot-trigger" variant="outline" title="Nommer et conserver ce relevé filtré pour la session" onClick={saveNamedSnapshot}><BookOpen size={16} aria-hidden="true" /> Enregistrer{savedSnapshots.length ? ` (${savedSnapshots.length})` : ""}</Button></div><div className="map-actions-right"><Button className="instrument-icon-button" variant="outline" title="Exporter la carte et les filtres actifs dans un relevé PDF" aria-label="Exporter le relevé PDF" onClick={downloadScenarioSnapshot}><Printer size={16} aria-hidden="true" /></Button><Button className="instrument-icon-button" variant="outline" title="Produire un rapport analytique sourcé" aria-label="Produire le rapport PDF" onClick={downloadScenarioSnapshot}><FileText size={16} aria-hidden="true" /></Button><Button className="instrument-icon-button" variant="outline" title="Partager le dernier relevé sauvegardé" aria-label="Partager le relevé" onClick={() => void shareSavedSnapshot()}><Share2 size={16} aria-hidden="true" /></Button></div>{shareNotice && <span className="share-notice" role="status">{shareNotice}</span>}</section>

      {isAuthenticated && collectionsQuery.data?.length ? <section className="collection-management-section" aria-label="Gérer mes collections"><p className="eyebrow"><BookOpen size={13} /> MES COLLECTIONS</p><div>{collectionsQuery.data.map((collection) => <article key={collection.id}><span><b>{collection.name}</b><small>{collection.items.length} relevé{collection.items.length > 1 ? "s" : ""}</small></span><button type="button" onClick={() => { if (window.confirm(`Supprimer la collection « ${collection.name} » ?`)) removeCollectionMutation.mutate({ id: collection.id }); }} disabled={removeCollectionMutation.isPending} aria-label={`Supprimer ${collection.name}`}><X size={14} /></button></article>)}</div></section> : null}

      {sharedCollectionQuery.data && <section className="shared-collection-section" aria-label="Relevés de la collection partagée"><div><p className="eyebrow"><Share2 size={13} /> COLLECTION PARTAGÉE</p><strong>{sharedCollectionQuery.data.name}</strong><small>{sharedCollectionQuery.data.items.length} relevé{sharedCollectionQuery.data.items.length > 1 ? "s" : ""} disponible{sharedCollectionQuery.data.items.length > 1 ? "s" : ""}</small></div><div>{sharedCollectionQuery.data.items.map((item) => <button type="button" key={item.id} onClick={() => { try { applySavedSnapshot(JSON.parse(item.snapshotJson) as SavedSnapshot); setShareNotice(`Relevé appliqué : ${item.label}`); } catch { setShareNotice("Ce relevé ne peut pas être restauré."); } }}>{item.label}</button>)}</div></section>}

      {savedSnapshots.length > 0 && <section className="collection-picker-section" aria-label="Choisir les relevés à organiser"><div><p className="eyebrow"><Check size={13} /> PRÉPARER UNE COLLECTION</p><strong>{collectionSnapshotIds.length} relevé{collectionSnapshotIds.length > 1 ? "s" : ""} sélectionné{collectionSnapshotIds.length > 1 ? "s" : ""}</strong></div><div>{savedSnapshots.map((snapshot) => <label key={snapshot.createdAt}><input type="checkbox" checked={collectionSnapshotIds.includes(snapshot.createdAt)} onChange={() => setCollectionSnapshotIds((current) => current.includes(snapshot.createdAt) ? current.filter((id) => id !== snapshot.createdAt) : [...current, snapshot.createdAt])} /> <span>{snapshot.name}</span></label>)}</div><button type="button" onClick={createCollectionFromSavedSnapshots} disabled={createCollectionMutation.isPending || !collectionSnapshotIds.length}>Créer la collection <Share2 size={14} /></button></section>}

      <section className="snapshot-collections-section" aria-label="Collections de relevés"><div><p className="eyebrow"><BookOpen size={14} /> COLLECTIONS DE RELEVÉS</p><h2>Organiser les lectures<br /><i>à partager</i>.</h2><p>Regroupez vos relevés filtrés dans une collection privée ou générez un lien de lecture partagé. Les relations du corpus démonstratif restent toujours signalées comme telles.</p></div><div className="snapshot-collections-card"><button type="button" onClick={createCollectionFromSavedSnapshots} disabled={createCollectionMutation.isPending}>{createCollectionMutation.isPending ? "Création…" : "Créer depuis mes relevés"} <Share2 size={15} /></button>{!isAuthenticated ? <small>Connectez-vous pour mémoriser vos collections et leurs liens de partage.</small> : collectionsQuery.isLoading ? <small>Lecture des collections…</small> : collectionsQuery.data?.length ? <div>{collectionsQuery.data.map((collection) => <article key={collection.id}><div><b>{collection.name}</b><span>{collection.items.length} relevé{collection.items.length > 1 ? "s" : ""} · {collection.visibility === "shared" ? "partagée" : "privée"}</span></div>{collection.visibility === "shared" && <button type="button" onClick={() => navigator.clipboard?.writeText(`${window.location.origin}${window.location.pathname}?collection=${collection.shareKey}`)} title="Copier le lien de collection"><Share2 size={14} /></button>}</article>)}</div> : <small>Aucune collection encore enregistrée. Créez un premier groupe à partir de vos relevés.</small>}</div></section>

      <section className="world-brief" aria-labelledby="world-brief-title"><div className="world-brief-index"><span>02</span><p>LECTURE<br />DES LIENS</p></div><div className="world-brief-copy"><p className="eyebrow"><span className="compass-state-marker" aria-hidden="true" /><UsersRound size={14} aria-hidden="true" /> CORPUS EXPLORATOIRE</p><h2 id="world-brief-title">Des relations pour <i>interroger</i> les rapports de force.</h2><p>Les arcs visibles illustrent les types de relations, périodes et échelles définis dans votre système de classification. Le corpus initial sert à tester l’exploration et doit être enrichi de sources vérifiables avant toute analyse approfondie.</p><div className="field-notes"><span>PLANCHE 02 / MONDE</span><span>GRILLE 0,5° / 2020–2025</span><span>RÉF. GED + WIKIDATA</span></div><a href="https://www.naturalearthdata.com/" target="_blank" rel="noreferrer">Fond géographique Natural Earth <ArrowUpRight size={15} aria-hidden="true" /></a></div><div className="world-method"><article><strong>{RELATIONS.length}</strong><span>relations<br />classifiées</span></article><article><strong>{RELATION_TYPES.length}</strong><span>types de<br />liens</span></article><article><strong>03</strong><span>modes de<br />projection</span></article></div></section>

      <footer className="atlas-footer"><div><Crosshair size={16} aria-hidden="true" /> <span>ATLAS FLUX / RELATIONS</span></div><p>Corpus : système de classification fourni · Pays : Banque mondiale · Frontières : Natural Earth</p><img src="/manus-storage/atlas-flux-route_f9e9cd02.png" alt="Aperçu cartographique décoratif" /></footer>
    </div>
  );
}

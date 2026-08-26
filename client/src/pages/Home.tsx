/* Atlas Flux Monde — observatoire géopolitique : cartographie éditoriale sombre, relations temporelles et lecture multi-échelle. */
import DeckGL from "@deck.gl/react";
import { _GlobeView as GlobeView } from "@deck.gl/core";
import { ArcLayer, GeoJsonLayer, ScatterplotLayer, TextLayer } from "@deck.gl/layers";
import { HeatmapLayer } from "@deck.gl/aggregation-layers";
import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button";
import Map, { NavigationControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import "./world.css";
import "./relations.css";
import {
  Activity,
  ArrowUpRight,
  BookOpen,
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Crosshair,
  Database,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Filter,
  GitCompareArrows,
  Globe2,
  Layers3,
  LocateFixed,
  MapPin,
  Radar,
  Search,
  UsersRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { UCDP_CONFLICT_CELLS, UCDP_GED_PERIOD, UCDP_GED_SOURCE, type UcdpConflictCell } from "@/data/ucdpConflictData";

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
  start: number;
  end?: number;
  detail: string;
  provenance?: string;
};

type ViewConfig = { id: ViewId; label: string; short: string; longitude: number; latitude: number; zoom: number };
type SearchEntry = { id: string; label: string; kind: "Pays" | "Organisation" | "Zone"; position: [number, number]; country?: CountryDatum; organization?: Organization; region?: RegionId };

const INDICATOR_YEARS = [2024, 2023, 2022] as const;
const VECTOR_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
const WORLD_BANK_API = "https://api.worldbank.org/v2";
const WORLD_BOUNDARIES = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson";

const INDICATORS: Array<{ id: IndicatorId; label: string; compact: string; sourceLabel: string; apiCode: string; color: [number, number, number, number] }> = [
  { id: "gdp", label: "Puissance économique", compact: "PIB", sourceLabel: "PIB, dollars courants", apiCode: "NY.GDP.MKTP.CD", color: [89, 151, 146, 214] },
  { id: "population", label: "Démographie", compact: "POP", sourceLabel: "Population totale", apiCode: "SP.POP.TOTL", color: [224, 188, 106, 210] },
  { id: "defense", label: "Effort de défense", compact: "DEF", sourceLabel: "Dépenses militaires (% PIB)", apiCode: "MS.MIL.XPND.GD.ZS", color: [255, 107, 53, 230] },
];

const RELATION_TYPES: Array<{ id: RelationType; label: string; short: string; color: [number, number, number] }> = [
  { id: "geopolitique", label: "Géopolitique", short: "GÉO", color: [255, 107, 53] },
  { id: "militaire", label: "Militaire", short: "MIL", color: [239, 86, 78] },
  { id: "economique", label: "Économique", short: "ÉCO", color: [242, 194, 78] },
  { id: "commercial", label: "Commercial", short: "COM", color: [80, 175, 202] },
  { id: "technologique", label: "Technologique", short: "TEC", color: [96, 139, 235] },
  { id: "scientifique", label: "Scientifique", short: "SCI", color: [122, 191, 165] },
  { id: "culturel", label: "Culturel", short: "CUL", color: [205, 141, 186] },
  { id: "historique", label: "Historique", short: "HIS", color: [165, 117, 236] },
  { id: "migratoire", label: "Migratoire", short: "MIG", color: [99, 190, 197] },
  { id: "ressources", label: "Ressources", short: "RES", color: [208, 163, 90] },
  { id: "securitaire", label: "Sécuritaire", short: "SÉC", color: [234, 91, 91] },
  { id: "ideologique", label: "Idéologique", short: "IDÉ", color: [191, 117, 214] },
  { id: "financier", label: "Financier", short: "FIN", color: [151, 203, 105] },
  { id: "numerique", label: "Numérique", short: "NUM", color: [88, 144, 215] },
  { id: "juridique", label: "Juridique", short: "JUR", color: [163, 177, 187] },
];

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
];

/* Corpus initial : exemples du document de classification transmis, conçus pour tester les filtres de type et de période. */
const RELATIONS: Relation[] = [
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

const ORGANIZATION_REFERENCES: Record<string, { official: string; wikipedia: string }> = {
  NATO: { official: "https://www.nato.int/", wikipedia: "https://fr.wikipedia.org/wiki/Organisation_du_trait%C3%A9_de_l%27Atlantique_nord" },
  EU: { official: "https://european-union.europa.eu/", wikipedia: "https://fr.wikipedia.org/wiki/Union_europ%C3%A9enne" },
  AU: { official: "https://au.int/", wikipedia: "https://fr.wikipedia.org/wiki/Union_africaine" },
  OPEC: { official: "https://www.opec.org/", wikipedia: "https://fr.wikipedia.org/wiki/Organisation_des_pays_exportateurs_de_p%C3%A9trole" },
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
  return RELATION_TYPES.find((item) => item.id === type)?.color ?? [255, 107, 53];
}

function relationReference(relation: Relation) {
  return RELATION_REFERENCES[relation.id] ?? { label: "Système de classification transmis", url: "#observatoire" };
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

export default function Home() {
  const [countries, setCountries] = useState<CountryDatum[]>([]);
  const [boundaries, setBoundaries] = useState<any>(null);
  const [activeView, setActiveView] = useState<ViewId>("world");
  const [focusView, setFocusView] = useState<Pick<ViewConfig, "longitude" | "latitude" | "zoom"> | null>(null);
  const [displayMode, setDisplayMode] = useState<DisplayMode>(() => { const mode = new URLSearchParams(window.location.search).get("mode"); return mode === "globe" || mode === "tactical" ? mode : "map"; });
  const [indicatorYear, setIndicatorYear] = useState<number>(2024);
  const [timelineYear, setTimelineYear] = useState<number>(2024);
  const [activeRegion, setActiveRegion] = useState<RegionId>("all");
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>(() => { const mode = new URLSearchParams(window.location.search).get("analysis"); return mode === "conflict" || mode === "evolution" || mode === "multilateral" ? mode : "network"; });
  const [selectedZone, setSelectedZone] = useState<RegionId | null>(null);
  const [showConflictHeat, setShowConflictHeat] = useState(() => new URLSearchParams(window.location.search).get("analysis") === "conflict");
  const [timelinePreviewYear, setTimelinePreviewYear] = useState<number | null>(null);
  const [evolutionStart, setEvolutionStart] = useState(1945);
  const [evolutionEnd, setEvolutionEnd] = useState(2025);
  const [visibleLayers, setVisibleLayers] = useState<Record<IndicatorId, boolean>>({ gdp: true, population: false, defense: false });
  const [visibleRelationTypes, setVisibleRelationTypes] = useState<Record<RelationType, boolean>>(() => Object.fromEntries(RELATION_TYPES.map((type) => [type.id, true])) as Record<RelationType, boolean>);
  const [selectedCountry, setSelectedCountry] = useState<CountryDatum | null>(null);
  const [selectedActorId, setSelectedActorId] = useState<string | null>(() => new URLSearchParams(window.location.search).get("actor"));
  const [selectedRelation, setSelectedRelation] = useState<Relation | null>(null);
  const [compareLeftId, setCompareLeftId] = useState("TUR");
  const [compareRightId, setCompareRightId] = useState("GRC");
  const [isComparatorOpen, setIsComparatorOpen] = useState(() => new URLSearchParams(window.location.search).get("compare") === "1");
  const [hoveredRelation, setHoveredRelation] = useState<{ relation: Relation; x: number; y: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState(() => new URLSearchParams(window.location.search).get("search") ?? "");
  const [isLoading, setIsLoading] = useState(true);
  const [dataError, setDataError] = useState(false);
  const [viewKey, setViewKey] = useState(0);
  const [animationPhase, setAnimationPhase] = useState(0);

  const selectedViewConfig = VIEWS.find((view) => view.id === activeView) ?? VIEWS[0];
  const selectedView = focusView ?? selectedViewConfig;
  const globeView = useMemo(() => displayMode === "globe" ? new GlobeView({ id: "world-globe" }) : undefined, [displayMode]);

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
    const timer = window.setInterval(() => setAnimationPhase((phase) => (phase + 1) % 36), 180);
    return () => window.clearInterval(timer);
  }, []);

  const filteredCountries = useMemo(() => countries.filter((country) => activeRegion === "all" || country.region === activeRegion), [countries, activeRegion]);
  const visibleIndicatorCount = INDICATORS.filter((indicator) => visibleLayers[indicator.id]).length;
  const filteredCount = filteredCountries.filter((country) => INDICATORS.some((indicator) => visibleLayers[indicator.id] && country.indicators[indicator.id][indicatorYear] !== undefined)).length;

  const activeRelations = useMemo(() => RELATIONS.filter((relation) => {
    const isInTemporalWindow = analysisMode === "evolution" ? relation.start <= evolutionEnd && (relation.end === undefined || relation.end >= evolutionStart) : relation.start <= timelineYear && (relation.end === undefined || relation.end >= timelineYear);
    return isInTemporalWindow && visibleRelationTypes[relation.type];
  }).filter((relation) => !selectedActorId || relation.source.id === selectedActorId || relation.target.id === selectedActorId).filter((relation) => !selectedZone || countries.find((country) => country.iso3 === relation.source.id)?.region === selectedZone || countries.find((country) => country.iso3 === relation.target.id)?.region === selectedZone).filter((relation) => analysisMode !== "multilateral" || ORGANIZATIONS.some((organization) => organization.id === relation.source.id || organization.id === relation.target.id)), [analysisMode, evolutionEnd, evolutionStart, timelineYear, visibleRelationTypes, selectedActorId, selectedZone, countries]);
  const selectedOrganization = ORGANIZATIONS.find((organization) => organization.id === selectedActorId) ?? null;
  const relatedActorIds = useMemo(() => new Set(activeRelations.flatMap((relation) => [relation.source.id, relation.target.id])), [activeRelations]);
  const compareLeft = countries.find((country) => country.iso3 === compareLeftId) ?? null;
  const compareRight = countries.find((country) => country.iso3 === compareRightId) ?? null;
  const bilateralRelations = RELATIONS.filter((relation) => relation.start <= timelineYear && (relation.end === undefined || relation.end >= timelineYear) && ((relation.source.id === compareLeftId && relation.target.id === compareRightId) || (relation.source.id === compareRightId && relation.target.id === compareLeftId)));
  const bilateralHistory = RELATIONS.filter((relation) => (relation.source.id === compareLeftId && relation.target.id === compareRightId) || (relation.source.id === compareRightId && relation.target.id === compareLeftId));
  const historyStart = bilateralHistory.length ? Math.min(...bilateralHistory.map((relation) => relation.start)) : 1858;

  const searchResults = useMemo<SearchEntry[]>(() => {
    const query = normalizeSearch(searchQuery.trim());
    if (!query) return [];
    const countryEntries = countries.filter((country) => normalizeSearch(country.name).includes(query) || normalizeSearch(country.iso3).includes(query)).map((country) => ({ id: country.iso3, label: country.name, kind: "Pays" as const, position: country.position, country }));
    const organizationEntries = ORGANIZATIONS.filter((organization) => normalizeSearch(organization.name).includes(query) || normalizeSearch(organization.acronym).includes(query)).map((organization) => ({ id: organization.id, label: organization.name, kind: "Organisation" as const, position: organization.position, organization }));
    const zoneEntries = ANALYSIS_ZONES.filter((zone) => normalizeSearch(zone.label).includes(query)).map((zone) => ({ id: zone.id, label: zone.label, kind: "Zone" as const, position: zone.position, region: zone.region }));
    return [...countryEntries, ...organizationEntries, ...zoneEntries].slice(0, 7);
  }, [countries, searchQuery]);

  const conflictSignals = useMemo<UcdpConflictCell[]>(() => UCDP_CONFLICT_CELLS.filter((cell) => analysisMode === "evolution" ? cell.year >= evolutionStart && cell.year <= evolutionEnd : cell.year === timelineYear), [analysisMode, evolutionEnd, evolutionStart, timelineYear]);

  const layers = useMemo(() => {
    const indicatorLayers = INDICATORS.filter((indicator) => visibleLayers[indicator.id]).map((indicator) => new ScatterplotLayer<CountryDatum>({
      id: `world-${indicator.id}-${viewKey}`,
      data: filteredCountries.filter((country) => country.indicators[indicator.id][indicatorYear] !== undefined),
      getPosition: (country) => country.position,
      getRadius: (country) => pointSize(indicator.id, country.indicators[indicator.id][indicatorYear] ?? 0),
      radiusUnits: "pixels",
      getFillColor: (country) => country.iso3 === selectedActorId ? [8, 41, 74, 255] : selectedActorId && relatedActorIds.has(country.iso3) ? [102, 164, 205, 230] : indicator.color,
      getLineColor: (country) => country.iso3 === selectedActorId ? [216, 238, 255, 255] : selectedActorId && relatedActorIds.has(country.iso3) ? [185, 221, 242, 225] : [248, 243, 232, 190],
      getLineWidth: (country) => country.iso3 === selectedActorId ? 3.2 : selectedActorId && relatedActorIds.has(country.iso3) ? 2 : 1,
      lineWidthUnits: "pixels",
      stroked: true,
      pickable: true,
      autoHighlight: true,
      highlightColor: [255, 237, 186, 180],
    }));
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
    const relatedCountryIds = new Set(selectedActorId ? filteredCountries.filter((country) => relatedActorIds.has(country.iso3)).map((country) => country.iso3) : []);
    const zoneCountryIds = new Set(countries.filter((country) => selectedZone && country.region === selectedZone).map((country) => country.iso3));
    const selectionLayer = boundaries ? new GeoJsonLayer({
      id: `actor-selection-${viewKey}`,
      data: boundaries,
      filled: true,
      stroked: true,
      pickable: false,
      getFillColor: (feature: any) => {
        const iso3 = String(feature.properties?.ISO_A3 ?? feature.properties?.ADM0_A3 ?? "");
        if (iso3 === selectedActorId) return [8, 41, 74, 205];
        if (zoneCountryIds.has(iso3)) return [8, 41, 74, 124];
        if (relatedCountryIds.has(iso3)) return [102, 164, 205, 126];
        return [0, 0, 0, 0];
      },
      getLineColor: (feature: any) => {
        const iso3 = String(feature.properties?.ISO_A3 ?? feature.properties?.ADM0_A3 ?? "");
        if (iso3 === selectedActorId) return [168, 213, 241, 255];
        if (zoneCountryIds.has(iso3) || relatedCountryIds.has(iso3)) return [131, 188, 222, 210];
        return [0, 0, 0, 0];
      },
      getLineWidth: 1.6,
      lineWidthUnits: "pixels",
    }) : null;
    const pulse = Math.round(130 + ((Math.sin(animationPhase / 3) + 1) / 2) * 110);
    const relationLayer = new ArcLayer<Relation>({
      id: `geopolitical-arcs-${viewKey}`,
      data: activeRelations,
      greatCircle: true,
      getSourcePosition: (relation) => relation.source.position,
      getTargetPosition: (relation) => relation.target.position,
      getSourceColor: (relation) => [...relationColor(relation.type), pulse] as [number, number, number, number],
      getTargetColor: (relation) => [...relationColor(relation.type), 245] as [number, number, number, number],
      getWidth: (relation) => selectedActorId && (relation.source.id === selectedActorId || relation.target.id === selectedActorId) ? 3.4 : 2.15,
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
      getColor: (relation) => [...relationColor(relation.type), 245] as [number, number, number, number],
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
      colorRange: [[21, 38, 53], [66, 104, 120], [224, 188, 106], [255, 107, 53], [239, 86, 78]],
      pickable: false,
    }) : null;
    const conflictCellLayer = showConflictHeat ? new ScatterplotLayer<UcdpConflictCell>({
      id: `conflict-cells-${viewKey}`,
      data: conflictSignals,
      getPosition: (signal) => signal.position,
      getRadius: (signal) => Math.max(3, Math.min(12, Math.log1p(signal.fatalities))),
      radiusUnits: "pixels",
      getFillColor: [255, 236, 180, 150],
      getLineColor: [239, 86, 78, 235],
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
    return [...(boundaryLayer ? [boundaryLayer] : []), ...(selectionLayer ? [selectionLayer] : []), ...(conflictHeatLayer ? [conflictHeatLayer] : []), ...(conflictCellLayer ? [conflictCellLayer] : []), ...indicatorLayers, relationLayer, ...(directionLayer ? [directionLayer] : []), organizationLayer];
  }, [activeRelations, animationPhase, boundaries, conflictSignals, countries, displayMode, filteredCountries, indicatorYear, relatedActorIds, selectedActorId, selectedZone, showConflictHeat, viewKey, visibleLayers]);

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

  function toggleLayer(id: IndicatorId) { setVisibleLayers((current) => ({ ...current, [id]: !current[id] })); }
  function toggleRelationType(id: RelationType) { setVisibleRelationTypes((current) => ({ ...current, [id]: !current[id] })); }
  function toggleDisplayMode(mode: DisplayMode) { setDisplayMode(mode); setFocusView(null); setViewKey((key) => key + 1); }
  function stepTimeline(amount: number) { setTimelineYear((year) => Math.max(1858, Math.min(2025, year + amount))); }

  function selectRelationType(id: RelationType) {
    setVisibleRelationTypes(() => Object.fromEntries(RELATION_TYPES.map((type) => [type.id, type.id === id])) as Record<RelationType, boolean>);
    setAnalysisMode(id === "militaire" || id === "securitaire" ? "conflict" : "network");
    setShowConflictHeat(id === "militaire" || id === "securitaire");
    if (id === "militaire" || id === "securitaire") setVisibleLayers({ gdp: false, population: false, defense: true });
    if (id === "economique" || id === "commercial" || id === "financier" || id === "ressources") setVisibleLayers({ gdp: true, population: false, defense: false });
  }

  function selectAnalysisMode(mode: AnalysisMode) {
    setAnalysisMode(mode);
    if (mode !== "conflict") setShowConflictHeat(false);
    if (mode === "conflict") { setShowConflictHeat(true); setVisibleLayers({ gdp: false, population: false, defense: true }); }
    if (mode === "multilateral") { setSelectedActorId(null); setSelectedZone(null); }
    if (mode === "evolution") setTimelinePreviewYear(timelineYear);
  }

  function downloadComparisonCsv() {
    const rows = [["Pays A", "Pays B", "Type", "Relation", "Début", "Fin", "Détail", "Source", "Lien"], ...bilateralHistory.map((relation) => {
      const reference = relationReference(relation);
      return [relation.source.name, relation.target.name, relation.type, relation.title, relation.start, relation.end ?? "Aujourd’hui", relation.detail, reference.label, reference.url];
    })];
    const content = `\ufeff${rows.map((row) => row.map((cell) => csvCell(cell)).join(";")).join("\n")}`;
    const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `atlas-flux-${compareLeft?.iso3 ?? "pays-a"}-${compareRight?.iso3 ?? "pays-b"}.csv`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function downloadComparisonPdf() {
    const report = new jsPDF({ unit: "pt", format: "a4" });
    const leftName = compareLeft?.name ?? "Pays A";
    const rightName = compareRight?.name ?? "Pays B";
    report.setFillColor(16, 26, 36);
    report.rect(0, 0, 595, 118, "F");
    report.setTextColor(255, 107, 53);
    report.setFontSize(10);
    report.text("ATLAS FLUX / RAPPORT BILATÉRAL", 42, 42);
    report.setTextColor(246, 240, 229);
    report.setFontSize(23);
    report.text(`${leftName} ↔ ${rightName}`, 42, 78);
    report.setTextColor(31, 47, 57);
    report.setFontSize(11);
    report.text(`Période d’analyse : ${timelineYear}`, 42, 152);
    let y = 180;
    if (!bilateralHistory.length) report.text("Aucune relation du corpus pour cette paire de pays.", 42, y);
    bilateralHistory.forEach((relation) => {
      if (y > 720) { report.addPage(); y = 50; }
      const reference = relationReference(relation);
      report.setTextColor(89, 151, 146);
      report.setFontSize(10);
      report.text(`${relation.type.toUpperCase()} · ${relation.start}${relation.end ? `–${relation.end}` : "–aujourd’hui"}`, 42, y);
      report.setTextColor(31, 47, 57);
      report.setFontSize(14);
      report.text(relation.title, 42, y + 21);
      report.setFontSize(10);
      const lines = report.splitTextToSize(relation.detail, 500);
      report.text(lines, 42, y + 39);
      report.setTextColor(91, 112, 112);
      report.setFontSize(8);
      report.text(`Source : ${reference.label} — ${reference.url}`, 42, y + 39 + lines.length * 12 + 13);
      y += 83 + lines.length * 12;
    });
    report.save(`atlas-flux-${compareLeft?.iso3 ?? "pays-a"}-${compareRight?.iso3 ?? "pays-b"}.pdf`);
  }

  function downloadScenarioSnapshot() {
    const report = new jsPDF({ unit: "pt", format: "a4" });
    const selectedActor = selectedCountry?.name ?? selectedOrganization?.name ?? (selectedZone ? ANALYSIS_ZONES.find((zone) => zone.region === selectedZone)?.label : "Monde") ?? "Monde";
    const activeTypes = RELATION_TYPES.filter((type) => visibleRelationTypes[type.id]).map((type) => type.label).join(", ") || "Aucun";
    report.setFillColor(16, 26, 36);
    report.rect(0, 0, 595, 118, "F");
    report.setTextColor(255, 107, 53);
    report.setFontSize(10);
    report.text("ATLAS FLUX / SNAPSHOT D’ANALYSE", 42, 42);
    report.setTextColor(246, 240, 229);
    report.setFontSize(22);
    report.text(selectedActor, 42, 78);
    report.setTextColor(31, 47, 57);
    report.setFontSize(11);
    report.text(`Instant : ${timelineYear} · Vue : ${displayMode === "globe" ? "Globe 3D" : "Carte 2D"} · Mode : ${analysisMode}`, 42, 150);
    report.text(`Typologies actives : ${activeTypes}`, 42, 169);
    let y = 204;
    activeRelations.forEach((relation) => {
      if (y > 720) { report.addPage(); y = 50; }
      const reference = relationReference(relation);
      report.setTextColor(89, 151, 146);
      report.setFontSize(10);
      report.text(`${relation.source.name} → ${relation.target.name} · ${relation.type}`, 42, y);
      report.setTextColor(31, 47, 57);
      report.setFontSize(12);
      report.text(relation.title, 42, y + 18);
      report.setFontSize(8);
      report.text(`Source : ${reference.label}`, 42, y + 33);
      y += 57;
    });
    if (!activeRelations.length) report.text("Aucune relation active dans ce filtre temporel.", 42, y);
    report.save(`atlas-flux-snapshot-${timelineYear}.pdf`);
  }

  function tooltipFor(object: unknown, layerId?: string) {
    if (layerId?.startsWith("conflict-cells")) {
      const cell = object as UcdpConflictCell;
      return `${UCDP_GED_SOURCE}\n${cell.year} · ${cell.events.toLocaleString("fr-FR")} événements\n${cell.fatalities.toLocaleString("fr-FR")} décès estimés (best)\nAgrégation spatiale : 0,5°`;
    }
    if (layerId?.startsWith("geopolitical-arcs")) {
      const relation = object as Relation;
      return `${relation.source.name} → ${relation.target.name}\n${relation.title} · ${relation.type} · ${relation.start}${relation.end ? `–${relation.end}` : "–aujourd’hui"}\n${relation.detail}\nSource : ${relation.provenance ?? "Système de classification transmis"}`;
    }
    if (layerId?.startsWith("world-organizations")) {
      const organization = object as Organization;
      return `${organization.acronym} · ${organization.name}`;
    }
    const country = object as CountryDatum;
    const activeIndicator = INDICATORS.find((indicator) => visibleLayers[indicator.id] && country.indicators?.[indicator.id]?.[indicatorYear] !== undefined);
    return activeIndicator ? `${country.name}\n${activeIndicator.compact} · ${formatMetric(activeIndicator.id, country.indicators[activeIndicator.id][indicatorYear])}` : country.name;
  }

  return (
    <div className={`atlas-shell atlas-world-shell ${displayMode === "globe" ? "is-globe-mode" : ""} ${displayMode === "tactical" ? "is-tactical-mode" : ""}`}>
      <header className="atlas-header" aria-label="Navigation principale">
        <a className="atlas-brand" href="#observatoire" aria-label="Atlas Flux — observatoire mondial"><img className="atlas-mark" src="/manus-storage/atlas-flux-mark_3ba6f503.png" alt="" /><span>ATLAS <em>FLUX</em></span></a>
        <div className="atlas-header-meta"><span className="live-dot" /><span>MONDE / RELATIONS</span><span className="header-rule" /><span>CARTOGRAPHIE INTERACTIVE</span></div>
        <a className="source-link" href="https://data.worldbank.org/" target="_blank" rel="noreferrer">Sources ouvertes <ArrowUpRight size={15} aria-hidden="true" /></a>
      </header>

      <main id="observatoire" className="world-observatory">
        <aside className="world-view-rail" aria-label="Vues cartographiques">
          <div className="world-rail-heading"><Globe2 size={16} aria-hidden="true" /><span>VUES</span></div>
          <div className="display-mode-switch" aria-label="Mode de projection"><button type="button" className={displayMode === "map" ? "is-active" : ""} onClick={() => toggleDisplayMode("map")}>2D</button><button type="button" className={displayMode === "globe" ? "is-active" : ""} onClick={() => toggleDisplayMode("globe")}>GLOBE</button><button type="button" className={displayMode === "tactical" ? "is-active" : ""} onClick={() => toggleDisplayMode("tactical")}>TAC</button></div>
          <div className="world-view-list">
            {VIEWS.map((view) => <button key={view.id} className={activeView === view.id && !focusView ? "is-active" : ""} type="button" onClick={() => selectView(view)} aria-pressed={activeView === view.id && !focusView}><span>{view.short}</span><i>{view.label}</i></button>)}
          </div>
          <div className="world-view-source"><Database size={15} aria-hidden="true" /><span>ATLAS /<br />CORPUS</span></div>
        </aside>

        <section className="world-map-stage" aria-label="Carte mondiale des relations géopolitiques">
          <DeckGL
            key={`${viewKey}-${displayMode}`}
            views={globeView}
            initialViewState={{ longitude: selectedView.longitude, latitude: selectedView.latitude, zoom: displayMode === "tactical" ? Math.max(selectedView.zoom, 2.2) : selectedView.zoom }}
            controller
            layers={layers}
            getCursor={({ isDragging, isHovering }) => isDragging ? "grabbing" : isHovering ? "pointer" : "grab"}
            getTooltip={(info) => info.object ? { text: tooltipFor(info.object, info.layer?.id) } : null}
            onHover={(info) => {
              if (info.object && info.layer?.id.startsWith("geopolitical-arcs")) setHoveredRelation({ relation: info.object as Relation, x: info.x, y: info.y });
              else setHoveredRelation(null);
            }}
            onClick={(info) => {
              if (!info.object || !info.layer) return;
              if (info.layer.id.startsWith("geopolitical-arcs")) { setSelectedRelation(info.object as Relation); setSelectedCountry(null); return; }
              if (info.layer.id.startsWith("world-organizations")) { const organization = info.object as Organization; selectSearchEntry({ id: organization.id, label: organization.name, kind: "Organisation", position: organization.position, organization }); return; }
              const country = info.object as CountryDatum;
              if (country.iso3) { setSelectedCountry(country); setSelectedActorId(country.iso3); setSelectedRelation(null); }
            }}
          >
            {displayMode !== "globe" && <Map initialViewState={{ longitude: selectedView.longitude, latitude: selectedView.latitude, zoom: displayMode === "tactical" ? Math.max(selectedView.zoom, 2.2) : selectedView.zoom, pitch: displayMode === "tactical" ? 58 : 0, bearing: displayMode === "tactical" ? -14 : 0 } as any} mapStyle={VECTOR_STYLE} attributionControl={false} reuseMaps style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}><NavigationControl position="bottom-right" showCompass={displayMode === "tactical"} /></Map>}
          </DeckGL>

          <div className="world-grid-labels" aria-hidden="true"><span>180° O</span><span>{displayMode === "globe" ? "GLOBE 3D" : displayMode === "tactical" ? "TACTIQUE 3D" : "0°"}</span><span>180° E</span><small>ATLAS / RELATIONS MONDIALES</small></div>
          {hoveredRelation && (() => { const reference = relationReference(hoveredRelation.relation); return <aside className="arc-source-tooltip" style={{ left: Math.min(hoveredRelation.x + 16, 820), top: Math.max(70, hoveredRelation.y - 12) }}><p><i style={{ backgroundColor: `rgb(${relationColor(hoveredRelation.relation.type).join(" ")})` }} />{hoveredRelation.relation.type} · {hoveredRelation.relation.start}{hoveredRelation.relation.end ? `–${hoveredRelation.relation.end}` : "–aujourd’hui"}</p><strong>{hoveredRelation.relation.source.name} → {hoveredRelation.relation.target.name}</strong><span>{hoveredRelation.relation.title}</span><a href={reference.url} target="_blank" rel="noreferrer">{reference.label} <ExternalLink size={12} /></a></aside>; })()}

          <div className="world-intro intro-animate"><p className="eyebrow"><Radar size={14} aria-hidden="true" /> {displayMode === "globe" ? "GLOBE DES INTERDÉPENDANCES" : displayMode === "tactical" ? "VUE TACTIQUE LOCALE" : "OBSERVATOIRE GÉOPOLITIQUE"}</p><h1>Relier les<br /><i>forces</i> en présence.</h1><p>{displayMode === "tactical" ? "Approchez une zone, un pays ou une organisation pour examiner sa densité relationnelle et les événements de conflit sourcés." : "Explorez les liens géopolitiques du corpus, filtrez leur période et sélectionnez un acteur pour faire apparaître son réseau."}</p></div>

          <section className="world-search" aria-label="Rechercher un acteur"><Search size={16} aria-hidden="true" /><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Rechercher un pays ou une organisation" aria-label="Rechercher un pays ou une organisation" />{searchQuery && <button type="button" onClick={() => setSearchQuery("")} aria-label="Effacer la recherche"><X size={15} /></button>}{searchResults.length > 0 && <div className="search-results">{searchResults.map((entry) => <button key={entry.id} type="button" onClick={() => selectSearchEntry(entry)}><span className={entry.kind === "Organisation" ? "search-kind is-organization" : "search-kind"}>{entry.kind === "Organisation" ? <Building2 size={13} /> : <MapPin size={13} />}</span><span><b>{entry.label}</b><small>{entry.kind}</small></span></button>)}</div>}</section>

          <section className="analysis-mode-panel" aria-label="Vues spécialisées"><p><Activity size={14} /> ANALYSE GUIDÉE</p><div><button type="button" className={analysisMode === "network" ? "is-active" : ""} onClick={() => selectAnalysisMode("network")}>Réseau</button><button type="button" className={analysisMode === "conflict" ? "is-active" : ""} onClick={() => selectAnalysisMode("conflict")}>Zones chaudes</button><button type="button" className={analysisMode === "evolution" ? "is-active" : ""} onClick={() => selectAnalysisMode("evolution")}>Évolution</button><button type="button" className={analysisMode === "multilateral" ? "is-active" : ""} onClick={() => selectAnalysisMode("multilateral")}>Multilatéral</button></div>{analysisMode === "conflict" && <small><a href="https://ucdp.uu.se/downloads/" target="_blank" rel="noreferrer">UCDP GED v26.1</a> · {UCDP_GED_PERIOD} · agrégation de cellules de 0,5° selon les décès estimés.</small>}{analysisMode === "evolution" && <div className="evolution-window"><label>DE <input type="number" min="1858" max={evolutionEnd} value={evolutionStart} onChange={(event) => setEvolutionStart(Number(event.target.value))} /></label><span>→</span><label>À <input type="number" min={evolutionStart} max="2025" value={evolutionEnd} onChange={(event) => setEvolutionEnd(Number(event.target.value))} /></label></div>}{selectedZone && <button type="button" className="zone-clear" onClick={() => { setSelectedZone(null); setActiveRegion("all"); }}>Zone : {ANALYSIS_ZONES.find((zone) => zone.region === selectedZone)?.label} <X size={12} /></button>}</section>

          <section className="world-filter-panel intro-animate delay-1" aria-label="Filtres d’indicateurs"><div className="world-filter-title"><Filter size={15} aria-hidden="true" /><span>INDICATEURS</span></div><div className="filter-group"><p>PÉRIODE STATISTIQUE</p><div className="filter-pills">{INDICATOR_YEARS.map((year) => <button key={year} type="button" className={indicatorYear === year ? "is-selected" : ""} onClick={() => setIndicatorYear(year)}>{year}</button>)}</div></div><div className="filter-group"><p>RÉGION</p><div className="filter-pills region-pills">{REGION_FILTERS.map((region) => <button key={region.id} type="button" className={activeRegion === region.id ? "is-selected" : ""} onClick={() => { setActiveRegion(region.id); setSelectedCountry(null); }}>{region.label}</button>)}</div></div><p className="filter-status">{isLoading ? "Lecture des données…" : `${filteredCount} pays disponibles`}</p></section>

          <section className="world-layer-panel intro-animate delay-2" aria-label="Calques et relations"><div className="layer-panel-heading"><Layers3 size={15} aria-hidden="true" /><span>CALQUES ACTIFS</span><b>{String(visibleIndicatorCount).padStart(2, "0")}</b></div>{INDICATORS.map((indicator) => <button key={indicator.id} data-layer={indicator.compact} className={`world-layer-button ${visibleLayers[indicator.id] ? "is-active" : ""}`} type="button" onClick={() => toggleLayer(indicator.id)} aria-pressed={visibleLayers[indicator.id]}><span className="world-layer-dot" style={{ backgroundColor: `rgb(${indicator.color.slice(0, 3).join(" ")})` }} aria-hidden="true" /><span><b>{indicator.label}</b><small>{indicator.sourceLabel}</small></span>{visibleLayers[indicator.id] && <Check size={14} aria-hidden="true" />}</button>)}<button type="button" className={`heatmap-toggle ${showConflictHeat ? "is-active" : ""}`} onClick={() => setShowConflictHeat((value) => !value)}><span /> Conflits UCDP GED <em>{UCDP_GED_PERIOD}</em></button><div className="relation-filter-heading"><Activity size={14} aria-hidden="true" /><span>TYPOLOGIES / {activeRelations.length}</span></div><div className="relation-type-grid relation-type-grid-expanded">{RELATION_TYPES.map((type) => <button key={type.id} data-relation={type.short} type="button" onClick={() => selectRelationType(type.id)} className={visibleRelationTypes[type.id] ? "is-active" : ""} aria-pressed={visibleRelationTypes[type.id]}><i style={{ backgroundColor: `rgb(${type.color.join(" ")})` }} /><span>{type.label}</span><em>{visibleRelationTypes[type.id] ? "actif" : ""}</em></button>)}</div></section>

          <section className="relation-timeline" aria-label="Timeline des relations"><div><Clock3 size={15} aria-hidden="true" /><span>TIMELINE</span></div><button type="button" onClick={() => stepTimeline(-1)} aria-label="Année précédente"><ChevronLeft size={16} /></button><div className="timeline-slider-wrap"><input type="range" min="1858" max="2025" value={timelineYear} onChange={(event) => setTimelineYear(Number(event.target.value))} onPointerMove={(event) => { const rect = event.currentTarget.getBoundingClientRect(); setTimelinePreviewYear(Math.round(1858 + ((event.clientX - rect.left) / rect.width) * (2025 - 1858))); }} onPointerLeave={() => setTimelinePreviewYear(null)} aria-label="Année des relations" />{timelinePreviewYear !== null && <div className="timeline-preview"><b>{timelinePreviewYear}</b><span>{RELATIONS.filter((relation) => relation.start <= timelinePreviewYear && (relation.end === undefined || relation.end >= timelinePreviewYear)).length} liens du corpus</span></div>}</div><button type="button" onClick={() => stepTimeline(1)} aria-label="Année suivante"><ChevronRight size={16} /></button><strong>{timelineYear}</strong><p>{activeRelations.length} liens actifs</p></section>

          <aside className={`world-detail-panel ${selectedCountry || selectedOrganization ? "is-open" : ""}`} aria-live="polite" aria-label="Fiche acteur"><button className="detail-close" type="button" onClick={() => { setSelectedCountry(null); setSelectedActorId(null); }} aria-label="Fermer la fiche"><X size={17} /></button>{selectedCountry && <><p className="eyebrow"><MapPin size={14} aria-hidden="true" /> FICHE PAYS / {selectedCountry.iso3}</p><h2>{selectedCountry.name}</h2><p className="country-capital">{selectedCountry.capital ? `Capitale : ${selectedCountry.capital}` : "Capitale non renseignée"}</p><div className="country-metrics">{INDICATORS.map((indicator) => <div key={indicator.id}><span style={{ backgroundColor: `rgb(${indicator.color.slice(0, 3).join(" ")})` }} /><p>{indicator.compact}</p><strong>{formatMetric(indicator.id, selectedCountry.indicators[indicator.id][indicatorYear])}</strong></div>)}</div><p className="country-note">{activeRelations.length} relation{activeRelations.length > 1 ? "s" : ""} visible{activeRelations.length > 1 ? "s" : ""} à la date sélectionnée, parmi le corpus de classification.</p><div className="actor-source-links"><a className="detail-link" href={countryWikipediaUrl(selectedCountry.name)} target="_blank" rel="noreferrer"><BookOpen size={14} aria-hidden="true" /> Wikipédia — {selectedCountry.name} <ExternalLink size={14} aria-hidden="true" /></a><a className="detail-link" href={`https://data.worldbank.org/country/${selectedCountry.iso2.toLowerCase()}`} target="_blank" rel="noreferrer">Banque mondiale <ExternalLink size={14} aria-hidden="true" /></a></div></>}{selectedOrganization && (() => { const reference = ORGANIZATION_REFERENCES[selectedOrganization.id]; return <><p className="eyebrow"><Building2 size={14} aria-hidden="true" /> ORGANISATION</p><h2>{selectedOrganization.acronym}</h2><p className="country-capital">{selectedOrganization.name}</p><div className="organization-stat"><strong>{activeRelations.length}</strong><span>liens actifs<br />dans le corpus</span></div><p className="country-note">{selectedOrganization.description}</p><div className="actor-source-links"><a className="detail-link" href={reference.wikipedia} target="_blank" rel="noreferrer"><BookOpen size={14} aria-hidden="true" /> Wikipédia <ExternalLink size={14} aria-hidden="true" /></a><a className="detail-link" href={reference.official} target="_blank" rel="noreferrer">Site officiel <ExternalLink size={14} aria-hidden="true" /></a></div></>; })()}</aside>

          <aside className={`world-relation-panel ${selectedRelation ? "is-open" : ""}`} aria-live="polite" aria-label="Détail de la relation"><button className="detail-close" type="button" onClick={() => setSelectedRelation(null)} aria-label="Fermer le détail"><X size={17} /></button>{selectedRelation && (() => { const reference = relationReference(selectedRelation); return <><p className="eyebrow"><Activity size={14} aria-hidden="true" /> RELATION {selectedRelation.type.toUpperCase()}</p><h3>{selectedRelation.source.name}<span>→</span>{selectedRelation.target.name}</h3><p className="relation-period">{selectedRelation.start}{selectedRelation.end ? ` — ${selectedRelation.end}` : " — aujourd’hui"}</p><h4>{selectedRelation.title}</h4><p>{selectedRelation.detail}</p><a className="relation-source-link" href={reference.url} target="_blank" rel="noreferrer"><BookOpen size={14} /> {reference.label} <ExternalLink size={14} /></a><small>Provenance de classement : {selectedRelation.provenance ?? "Système de classification transmis"}</small></>; })()}</aside>

          <aside className={`bilateral-comparator ${isComparatorOpen ? "is-open" : ""}`} aria-label="Comparateur bilatéral"><button className="detail-close" type="button" onClick={() => setIsComparatorOpen(false)} aria-label="Fermer le comparateur"><X size={17} /></button><p className="eyebrow"><GitCompareArrows size={14} aria-hidden="true" /> COMPARATEUR BILATÉRAL</p><h3>Deux pays,<br /><i>une relation</i>.</h3><div className="comparator-selects"><label><span>PAYS A</span><select value={compareLeftId} onChange={(event) => setCompareLeftId(event.target.value)}>{countries.map((country) => <option key={country.iso3} value={country.iso3}>{country.name}</option>)}</select></label><span className="compare-arrow">↔</span><label><span>PAYS B</span><select value={compareRightId} onChange={(event) => setCompareRightId(event.target.value)}>{countries.map((country) => <option key={country.iso3} value={country.iso3}>{country.name}</option>)}</select></label></div><section className="comparison-history" aria-label="Évolution historique des relations"><div className="comparison-history-heading"><Activity size={14} /><span>ÉVOLUTION HISTORIQUE</span><b>{historyStart} — 2025</b></div>{bilateralHistory.length ? <div className="history-lines">{bilateralHistory.map((relation) => <div className="history-line" key={relation.id}><span>{relation.type}</span><div className="history-track"><i style={{ left: `${((relation.start - historyStart) / Math.max(1, 2025 - historyStart)) * 100}%`, width: `${(((relation.end ?? 2025) - relation.start) / Math.max(1, 2025 - historyStart)) * 100}%`, backgroundColor: `rgb(${relationColor(relation.type).join(" ")})` }} /><em style={{ left: `${((timelineYear - historyStart) / Math.max(1, 2025 - historyStart)) * 100}%` }} /></div></div>)}</div> : <div className="comparison-empty">Aucune évolution relationnelle renseignée dans ce corpus pour cette paire.</div>}</section><div className="comparison-summary"><p>{compareLeft?.name ?? "Pays A"}<span>↔</span>{compareRight?.name ?? "Pays B"}</p>{bilateralRelations.length > 0 ? bilateralRelations.map((relation) => { const reference = relationReference(relation); return <article key={relation.id}><i style={{ backgroundColor: `rgb(${relationColor(relation.type).join(" ")})` }} /><div><b>{relation.title}</b><small>{relation.type} · {relation.start}{relation.end ? `–${relation.end}` : "–aujourd’hui"}</small><span>{relation.detail}</span><a href={reference.url} target="_blank" rel="noreferrer">{reference.label} <ExternalLink size={12} /></a></div></article>; }) : <div className="comparison-empty">Aucune relation active de ce corpus pour la période sélectionnée.</div>}</div><div className="comparison-exports"><button type="button" onClick={downloadComparisonCsv}><FileSpreadsheet size={14} /> CSV</button><button type="button" onClick={downloadComparisonPdf}><FileText size={14} /> Rapport PDF</button></div><button className="comparison-focus" type="button" onClick={() => { if (compareLeft && compareRight) { setSelectedActorId(null); setFocusView({ longitude: (compareLeft.position[0] + compareRight.position[0]) / 2, latitude: (compareLeft.position[1] + compareRight.position[1]) / 2, zoom: displayMode === "globe" ? 0.65 : 2.2 }); setViewKey((key) => key + 1); } }}><LocateFixed size={14} /> Cadrer les deux pays</button></aside>

          <div className="world-map-actions"><Button className="instrument-button" variant="outline" onClick={resetView}><LocateFixed size={16} aria-hidden="true" /> Vue monde</Button><Button className="instrument-button compare-trigger" variant="outline" onClick={() => setIsComparatorOpen(true)}><GitCompareArrows size={16} aria-hidden="true" /> Comparer</Button><Button className="instrument-button snapshot-trigger" variant="outline" onClick={downloadScenarioSnapshot}><FileText size={16} aria-hidden="true" /> Snapshot</Button><p><Activity size={13} aria-hidden="true" /> {displayMode === "globe" ? "Globe 3D" : displayMode === "tactical" ? "Tactique 3D" : selectedViewConfig.label} · {timelineYear}</p></div>{dataError && <p className="map-data-error" role="status">Les indicateurs mondiaux n’ont pas pu être chargés. Veuillez réessayer plus tard.</p>}
        </section>
      </main>

      <section className="world-brief" aria-labelledby="world-brief-title"><div className="world-brief-index"><span>02</span><p>LECTURE<br />DES LIENS</p></div><div className="world-brief-copy"><p className="eyebrow"><UsersRound size={14} aria-hidden="true" /> CORPUS EXPLORATOIRE</p><h2 id="world-brief-title">Des relations pour <i>interroger</i> les rapports de force.</h2><p>Les arcs visibles illustrent les types de relations, périodes et échelles définis dans votre système de classification. Le corpus initial sert à tester l’exploration et doit être enrichi de sources vérifiables avant toute analyse approfondie.</p><a href="https://www.naturalearthdata.com/" target="_blank" rel="noreferrer">Fond géographique Natural Earth <ArrowUpRight size={15} aria-hidden="true" /></a></div><div className="world-method"><article><strong>{RELATIONS.length}</strong><span>relations<br />classifiées</span></article><article><strong>04</strong><span>types de<br />liens</span></article><article><strong>01</strong><span>mode globe<br />interactif</span></article></div></section>

      <footer className="atlas-footer"><div><Crosshair size={16} aria-hidden="true" /> <span>ATLAS FLUX / RELATIONS</span></div><p>Corpus : système de classification fourni · Pays : Banque mondiale · Frontières : Natural Earth</p><img src="/manus-storage/atlas-flux-route_f9e9cd02.png" alt="Aperçu cartographique décoratif" /></footer>
    </div>
  );
}

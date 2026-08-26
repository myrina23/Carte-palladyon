/* Atlas Flux Monde — observatoire géopolitique : cartographie éditoriale sombre, relations temporelles et lecture multi-échelle. */
import DeckGL from "@deck.gl/react";
import { _GlobeView as GlobeView } from "@deck.gl/core";
import { ArcLayer, GeoJsonLayer, ScatterplotLayer } from "@deck.gl/layers";
import { Button } from "@/components/ui/button";
import Map, { NavigationControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import "./world.css";
import "./relations.css";
import {
  Activity,
  ArrowUpRight,
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Crosshair,
  Database,
  ExternalLink,
  Filter,
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

type IndicatorId = "gdp" | "population" | "defense";
type RegionId = "all" | "europe" | "americas" | "africa" | "asia" | "mena";
type ViewId = "world" | "europe" | "americas" | "indoPacific" | "africaMena";
type DisplayMode = "map" | "globe";
type RelationType = "geopolitique" | "militaire" | "economique" | "historique";

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
};

type ViewConfig = { id: ViewId; label: string; short: string; longitude: number; latitude: number; zoom: number };
type SearchEntry = { id: string; label: string; kind: "Pays" | "Organisation"; position: [number, number]; country?: CountryDatum; organization?: Organization };

const INDICATOR_YEARS = [2024, 2023, 2022] as const;
const VECTOR_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
const WORLD_BANK_API = "https://api.worldbank.org/v2";
const WORLD_BOUNDARIES = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson";

const INDICATORS: Array<{ id: IndicatorId; label: string; compact: string; sourceLabel: string; apiCode: string; color: [number, number, number, number] }> = [
  { id: "gdp", label: "Puissance économique", compact: "PIB", sourceLabel: "PIB, dollars courants", apiCode: "NY.GDP.MKTP.CD", color: [255, 107, 53, 226] },
  { id: "population", label: "Démographie", compact: "POP", sourceLabel: "Population totale", apiCode: "SP.POP.TOTL", color: [73, 180, 169, 220] },
  { id: "defense", label: "Effort de défense", compact: "DEF", sourceLabel: "Dépenses militaires (% PIB)", apiCode: "MS.MIL.XPND.GD.ZS", color: [242, 194, 78, 230] },
];

const RELATION_TYPES: Array<{ id: RelationType; label: string; color: [number, number, number] }> = [
  { id: "geopolitique", label: "Géopolitique", color: [255, 107, 53] },
  { id: "militaire", label: "Militaire", color: [239, 86, 78] },
  { id: "economique", label: "Économique", color: [242, 194, 78] },
  { id: "historique", label: "Historique", color: [165, 117, 236] },
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

const ORGANIZATIONS: Organization[] = [
  { id: "NATO", name: "Organisation du traité de l’Atlantique nord", acronym: "OTAN", position: [4.3517, 50.8503], description: "Organisation intergouvernementale de défense collective, siège à Bruxelles." },
  { id: "EU", name: "Union européenne", acronym: "UE", position: [4.3517, 50.8503], description: "Union politique et économique européenne, institutions principales à Bruxelles." },
  { id: "AU", name: "Union africaine", acronym: "UA", position: [38.7578, 8.9806], description: "Organisation continentale africaine, siège à Addis-Abeba." },
  { id: "OPEC", name: "Organisation des pays exportateurs de pétrole", acronym: "OPEP", position: [16.3738, 48.2082], description: "Organisation intergouvernementale des pays exportateurs de pétrole, siège à Vienne." },
];

/* Corpus initial : exemples du document de classification transmis, conçus pour tester les filtres de type et de période. */
const RELATIONS: Relation[] = [
  { id: "uk-india-history", source: { id: "GBR", name: "Royaume-Uni", position: [-0.1278, 51.5074] }, target: { id: "IND", name: "Inde", position: [77.209, 28.6139] }, type: "historique", title: "Empire britannique", start: 1858, end: 1947, detail: "Relation historique citée dans le système de classification : période de l’Empire britannique en Inde." },
  { id: "india-pakistan-kashmir", source: { id: "IND", name: "Inde", position: [77.209, 28.6139] }, target: { id: "PAK", name: "Pakistan", position: [73.0479, 33.6844] }, type: "geopolitique", title: "Conflit du Cachemire", start: 1947, detail: "Relation géopolitique citée dans le système de classification, associée au conflit du Cachemire." },
  { id: "pakistan-china-cpec", source: { id: "PAK", name: "Pakistan", position: [73.0479, 33.6844] }, target: { id: "CHN", name: "Chine", position: [116.4074, 39.9042] }, type: "militaire", title: "CPEC / coopération stratégique", start: 2015, detail: "Relation militaire et stratégique citée dans le système de classification, avec référence au CPEC." },
  { id: "russia-syria-base", source: { id: "RUS", name: "Russie", position: [37.6173, 55.7558] }, target: { id: "SYR", name: "Syrie", position: [36.2765, 33.5138] }, type: "militaire", title: "Base navale et soutien", start: 2015, detail: "Relation militaire citée dans le système de classification : base navale et soutien au régime syrien." },
  { id: "china-african-union", source: { id: "CHN", name: "Chine", position: [116.4074, 39.9042] }, target: { id: "AU", name: "Union africaine", position: [38.7578, 8.9806] }, type: "economique", title: "Nouvelles routes de la soie", start: 2010, detail: "Relation économique illustrant l’exemple Chine–Afrique fourni dans le système de classification." },
  { id: "turkey-azerbaijan-alliance", source: { id: "TUR", name: "Turquie", position: [32.8597, 39.9334] }, target: { id: "AZE", name: "Azerbaïdjan", position: [49.8671, 40.4093] }, type: "militaire", title: "Alliance militaire", start: 1992, detail: "Relation militaire figurant dans le scénario de sélection de la Turquie du document de classification." },
  { id: "turkey-greece-tensions", source: { id: "TUR", name: "Turquie", position: [32.8597, 39.9334] }, target: { id: "GRC", name: "Grèce", position: [23.7275, 37.9838] }, type: "geopolitique", title: "Tensions régionales", start: 1974, detail: "Relation géopolitique figurant dans le scénario de sélection de la Turquie du document de classification." },
  { id: "turkey-nato", source: { id: "TUR", name: "Turquie", position: [32.8597, 39.9334] }, target: { id: "NATO", name: "OTAN", position: [4.3517, 50.8503] }, type: "militaire", title: "Relations OTAN", start: 1952, detail: "Relation multilatérale associée à l’OTAN, intégrée pour représenter les organisations dans l’outil interactif." },
];

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

export default function Home() {
  const [countries, setCountries] = useState<CountryDatum[]>([]);
  const [boundaries, setBoundaries] = useState<any>(null);
  const [activeView, setActiveView] = useState<ViewId>("world");
  const [focusView, setFocusView] = useState<Pick<ViewConfig, "longitude" | "latitude" | "zoom"> | null>(null);
  const [displayMode, setDisplayMode] = useState<DisplayMode>(() => new URLSearchParams(window.location.search).get("mode") === "globe" ? "globe" : "map");
  const [indicatorYear, setIndicatorYear] = useState<number>(2024);
  const [timelineYear, setTimelineYear] = useState<number>(2024);
  const [activeRegion, setActiveRegion] = useState<RegionId>("all");
  const [visibleLayers, setVisibleLayers] = useState<Record<IndicatorId, boolean>>({ gdp: true, population: false, defense: false });
  const [visibleRelationTypes, setVisibleRelationTypes] = useState<Record<RelationType, boolean>>({ geopolitique: true, militaire: true, economique: true, historique: true });
  const [selectedCountry, setSelectedCountry] = useState<CountryDatum | null>(null);
  const [selectedActorId, setSelectedActorId] = useState<string | null>(null);
  const [selectedRelation, setSelectedRelation] = useState<Relation | null>(null);
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

  const activeRelations = useMemo(() => RELATIONS.filter((relation) => relation.start <= timelineYear && (relation.end === undefined || relation.end >= timelineYear) && visibleRelationTypes[relation.type]).filter((relation) => !selectedActorId || relation.source.id === selectedActorId || relation.target.id === selectedActorId), [timelineYear, visibleRelationTypes, selectedActorId]);
  const selectedOrganization = ORGANIZATIONS.find((organization) => organization.id === selectedActorId) ?? null;

  const searchResults = useMemo<SearchEntry[]>(() => {
    const query = searchQuery.trim().toLocaleLowerCase("fr");
    if (!query) return [];
    const countryEntries = countries.filter((country) => country.name.toLocaleLowerCase("fr").includes(query) || country.iso3.toLocaleLowerCase("fr").includes(query)).map((country) => ({ id: country.iso3, label: country.name, kind: "Pays" as const, position: country.position, country }));
    const organizationEntries = ORGANIZATIONS.filter((organization) => organization.name.toLocaleLowerCase("fr").includes(query) || organization.acronym.toLocaleLowerCase("fr").includes(query)).map((organization) => ({ id: organization.id, label: organization.name, kind: "Organisation" as const, position: organization.position, organization }));
    return [...countryEntries, ...organizationEntries].slice(0, 7);
  }, [countries, searchQuery]);

  const layers = useMemo(() => {
    const indicatorLayers = INDICATORS.filter((indicator) => visibleLayers[indicator.id]).map((indicator) => new ScatterplotLayer<CountryDatum>({
      id: `world-${indicator.id}-${viewKey}`,
      data: filteredCountries.filter((country) => country.indicators[indicator.id][indicatorYear] !== undefined),
      getPosition: (country) => country.position,
      getRadius: (country) => pointSize(indicator.id, country.indicators[indicator.id][indicatorYear] ?? 0),
      radiusUnits: "pixels",
      getFillColor: indicator.color,
      getLineColor: (country) => country.iso3 === selectedActorId ? [255, 245, 215, 255] : [248, 243, 232, 190],
      getLineWidth: (country) => country.iso3 === selectedActorId ? 2.5 : 1,
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
    return [...(boundaryLayer ? [boundaryLayer] : []), ...indicatorLayers, relationLayer, organizationLayer];
  }, [activeRelations, animationPhase, boundaries, displayMode, filteredCountries, indicatorYear, selectedActorId, viewKey, visibleLayers]);

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

  function tooltipFor(object: unknown, layerId?: string) {
    if (layerId?.startsWith("geopolitical-arcs")) {
      const relation = object as Relation;
      return `${relation.source.name} → ${relation.target.name}\n${relation.title} · ${relation.start}${relation.end ? `–${relation.end}` : "–aujourd’hui"}`;
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
    <div className={`atlas-shell atlas-world-shell ${displayMode === "globe" ? "is-globe-mode" : ""}`}>
      <header className="atlas-header" aria-label="Navigation principale">
        <a className="atlas-brand" href="#observatoire" aria-label="Atlas Flux — observatoire mondial"><img className="atlas-mark" src="/manus-storage/atlas-flux-mark_3ba6f503.png" alt="" /><span>ATLAS <em>FLUX</em></span></a>
        <div className="atlas-header-meta"><span className="live-dot" /><span>MONDE / RELATIONS</span><span className="header-rule" /><span>CARTOGRAPHIE INTERACTIVE</span></div>
        <a className="source-link" href="https://data.worldbank.org/" target="_blank" rel="noreferrer">Sources ouvertes <ArrowUpRight size={15} aria-hidden="true" /></a>
      </header>

      <main id="observatoire" className="world-observatory">
        <aside className="world-view-rail" aria-label="Vues cartographiques">
          <div className="world-rail-heading"><Globe2 size={16} aria-hidden="true" /><span>VUES</span></div>
          <div className="display-mode-switch" aria-label="Mode de projection"><button type="button" className={displayMode === "map" ? "is-active" : ""} onClick={() => toggleDisplayMode("map")}>2D</button><button type="button" className={displayMode === "globe" ? "is-active" : ""} onClick={() => toggleDisplayMode("globe")}>3D</button></div>
          <div className="world-view-list">
            {VIEWS.map((view) => <button key={view.id} className={activeView === view.id && !focusView ? "is-active" : ""} type="button" onClick={() => selectView(view)} aria-pressed={activeView === view.id && !focusView}><span>{view.short}</span><i>{view.label}</i></button>)}
          </div>
          <div className="world-view-source"><Database size={15} aria-hidden="true" /><span>ATLAS /<br />CORPUS</span></div>
        </aside>

        <section className="world-map-stage" aria-label="Carte mondiale des relations géopolitiques">
          <DeckGL
            key={`${viewKey}-${displayMode}`}
            views={globeView}
            initialViewState={{ longitude: selectedView.longitude, latitude: selectedView.latitude, zoom: selectedView.zoom }}
            controller
            layers={layers}
            getCursor={({ isDragging, isHovering }) => isDragging ? "grabbing" : isHovering ? "pointer" : "grab"}
            getTooltip={(info) => info.object ? { text: tooltipFor(info.object, info.layer?.id) } : null}
            onClick={(info) => {
              if (!info.object || !info.layer) return;
              if (info.layer.id.startsWith("geopolitical-arcs")) { setSelectedRelation(info.object as Relation); setSelectedCountry(null); return; }
              if (info.layer.id.startsWith("world-organizations")) { const organization = info.object as Organization; selectSearchEntry({ id: organization.id, label: organization.name, kind: "Organisation", position: organization.position, organization }); return; }
              const country = info.object as CountryDatum;
              if (country.iso3) { setSelectedCountry(country); setSelectedActorId(country.iso3); setSelectedRelation(null); }
            }}
          >
            {displayMode === "map" && <Map initialViewState={{ longitude: selectedView.longitude, latitude: selectedView.latitude, zoom: selectedView.zoom, pitch: 0, bearing: 0 }} mapStyle={VECTOR_STYLE} attributionControl={false} reuseMaps style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}><NavigationControl position="bottom-right" showCompass={false} /></Map>}
          </DeckGL>

          <div className="world-grid-labels" aria-hidden="true"><span>180° O</span><span>{displayMode === "globe" ? "GLOBE 3D" : "0°"}</span><span>180° E</span><small>ATLAS / RELATIONS MONDIALES</small></div>

          <div className="world-intro intro-animate"><p className="eyebrow"><Radar size={14} aria-hidden="true" /> {displayMode === "globe" ? "GLOBE DES INTERDÉPENDANCES" : "OBSERVATOIRE GÉOPOLITIQUE"}</p><h1>Relier les<br /><i>forces</i> en présence.</h1><p>Explorez les liens géopolitiques du corpus, filtrez leur période et sélectionnez un acteur pour faire apparaître son réseau.</p></div>

          <section className="world-search" aria-label="Rechercher un acteur"><Search size={16} aria-hidden="true" /><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Rechercher un pays ou une organisation" aria-label="Rechercher un pays ou une organisation" />{searchQuery && <button type="button" onClick={() => setSearchQuery("")} aria-label="Effacer la recherche"><X size={15} /></button>}{searchResults.length > 0 && <div className="search-results">{searchResults.map((entry) => <button key={entry.id} type="button" onClick={() => selectSearchEntry(entry)}><span className={entry.kind === "Organisation" ? "search-kind is-organization" : "search-kind"}>{entry.kind === "Organisation" ? <Building2 size={13} /> : <MapPin size={13} />}</span><span><b>{entry.label}</b><small>{entry.kind}</small></span></button>)}</div>}</section>

          <section className="world-filter-panel intro-animate delay-1" aria-label="Filtres d’indicateurs"><div className="world-filter-title"><Filter size={15} aria-hidden="true" /><span>INDICATEURS</span></div><div className="filter-group"><p>PÉRIODE STATISTIQUE</p><div className="filter-pills">{INDICATOR_YEARS.map((year) => <button key={year} type="button" className={indicatorYear === year ? "is-selected" : ""} onClick={() => setIndicatorYear(year)}>{year}</button>)}</div></div><div className="filter-group"><p>RÉGION</p><div className="filter-pills region-pills">{REGION_FILTERS.map((region) => <button key={region.id} type="button" className={activeRegion === region.id ? "is-selected" : ""} onClick={() => { setActiveRegion(region.id); setSelectedCountry(null); }}>{region.label}</button>)}</div></div><p className="filter-status">{isLoading ? "Lecture des données…" : `${filteredCount} pays disponibles`}</p></section>

          <section className="world-layer-panel intro-animate delay-2" aria-label="Calques et relations"><div className="layer-panel-heading"><Layers3 size={15} aria-hidden="true" /><span>CALQUES ACTIFS</span><b>{String(visibleIndicatorCount).padStart(2, "0")}</b></div>{INDICATORS.map((indicator) => <button key={indicator.id} data-layer={indicator.compact} className={`world-layer-button ${visibleLayers[indicator.id] ? "is-active" : ""}`} type="button" onClick={() => toggleLayer(indicator.id)} aria-pressed={visibleLayers[indicator.id]}><span className="world-layer-dot" style={{ backgroundColor: `rgb(${indicator.color.slice(0, 3).join(" ")})` }} aria-hidden="true" /><span><b>{indicator.label}</b><small>{indicator.sourceLabel}</small></span>{visibleLayers[indicator.id] && <Check size={14} aria-hidden="true" />}</button>)}<div className="relation-filter-heading"><Activity size={14} aria-hidden="true" /><span>RELATIONS / {activeRelations.length}</span></div><div className="relation-type-grid">{RELATION_TYPES.map((type) => <button key={type.id} type="button" onClick={() => toggleRelationType(type.id)} className={visibleRelationTypes[type.id] ? "is-active" : ""} aria-pressed={visibleRelationTypes[type.id]}><i style={{ backgroundColor: `rgb(${type.color.join(" ")})` }} /><span>{type.label}</span></button>)}</div></section>

          <section className="relation-timeline" aria-label="Timeline des relations"><div><Clock3 size={15} aria-hidden="true" /><span>TIMELINE</span></div><button type="button" onClick={() => stepTimeline(-1)} aria-label="Année précédente"><ChevronLeft size={16} /></button><input type="range" min="1858" max="2025" value={timelineYear} onChange={(event) => setTimelineYear(Number(event.target.value))} aria-label="Année des relations" /><button type="button" onClick={() => stepTimeline(1)} aria-label="Année suivante"><ChevronRight size={16} /></button><strong>{timelineYear}</strong><p>{activeRelations.length} liens actifs</p></section>

          <aside className={`world-detail-panel ${selectedCountry || selectedOrganization ? "is-open" : ""}`} aria-live="polite" aria-label="Fiche acteur"><button className="detail-close" type="button" onClick={() => { setSelectedCountry(null); setSelectedActorId(null); }} aria-label="Fermer la fiche"><X size={17} /></button>{selectedCountry && <><p className="eyebrow"><MapPin size={14} aria-hidden="true" /> FICHE PAYS / {selectedCountry.iso3}</p><h2>{selectedCountry.name}</h2><p className="country-capital">{selectedCountry.capital ? `Capitale : ${selectedCountry.capital}` : "Capitale non renseignée"}</p><div className="country-metrics">{INDICATORS.map((indicator) => <div key={indicator.id}><span style={{ backgroundColor: `rgb(${indicator.color.slice(0, 3).join(" ")})` }} /><p>{indicator.compact}</p><strong>{formatMetric(indicator.id, selectedCountry.indicators[indicator.id][indicatorYear])}</strong></div>)}</div><p className="country-note">{activeRelations.length} relation{activeRelations.length > 1 ? "s" : ""} visible{activeRelations.length > 1 ? "s" : ""} à la date sélectionnée, parmi le corpus de classification.</p><a className="detail-link" href={`https://data.worldbank.org/country/${selectedCountry.iso2.toLowerCase()}`} target="_blank" rel="noreferrer">Voir la fiche Banque mondiale <ExternalLink size={14} aria-hidden="true" /></a></>}{selectedOrganization && <><p className="eyebrow"><Building2 size={14} aria-hidden="true" /> ORGANISATION</p><h2>{selectedOrganization.acronym}</h2><p className="country-capital">{selectedOrganization.name}</p><div className="organization-stat"><strong>{activeRelations.length}</strong><span>liens actifs<br />dans le corpus</span></div><p className="country-note">{selectedOrganization.description}</p></>}</aside>

          <aside className={`world-relation-panel ${selectedRelation ? "is-open" : ""}`} aria-live="polite" aria-label="Détail de la relation"><button className="detail-close" type="button" onClick={() => setSelectedRelation(null)} aria-label="Fermer le détail"><X size={17} /></button>{selectedRelation && <><p className="eyebrow"><Activity size={14} aria-hidden="true" /> RELATION {selectedRelation.type.toUpperCase()}</p><h3>{selectedRelation.source.name}<span>→</span>{selectedRelation.target.name}</h3><p className="relation-period">{selectedRelation.start}{selectedRelation.end ? ` — ${selectedRelation.end}` : " — aujourd’hui"}</p><h4>{selectedRelation.title}</h4><p>{selectedRelation.detail}</p><small>Provenance : système de classification transmis.</small></>}</aside>

          <div className="world-map-actions"><Button className="instrument-button" variant="outline" onClick={resetView}><LocateFixed size={16} aria-hidden="true" /> Vue monde</Button><p><Activity size={13} aria-hidden="true" /> {displayMode === "globe" ? "Globe 3D" : selectedViewConfig.label} · {timelineYear}</p></div>{dataError && <p className="map-data-error" role="status">Les indicateurs mondiaux n’ont pas pu être chargés. Veuillez réessayer plus tard.</p>}
        </section>
      </main>

      <section className="world-brief" aria-labelledby="world-brief-title"><div className="world-brief-index"><span>02</span><p>LECTURE<br />DES LIENS</p></div><div className="world-brief-copy"><p className="eyebrow"><UsersRound size={14} aria-hidden="true" /> CORPUS EXPLORATOIRE</p><h2 id="world-brief-title">Des relations pour <i>interroger</i> les rapports de force.</h2><p>Les arcs visibles illustrent les types de relations, périodes et échelles définis dans votre système de classification. Le corpus initial sert à tester l’exploration et doit être enrichi de sources vérifiables avant toute analyse approfondie.</p><a href="https://www.naturalearthdata.com/" target="_blank" rel="noreferrer">Fond géographique Natural Earth <ArrowUpRight size={15} aria-hidden="true" /></a></div><div className="world-method"><article><strong>{RELATIONS.length}</strong><span>relations<br />classifiées</span></article><article><strong>04</strong><span>types de<br />liens</span></article><article><strong>01</strong><span>mode globe<br />interactif</span></article></div></section>

      <footer className="atlas-footer"><div><Crosshair size={16} aria-hidden="true" /> <span>ATLAS FLUX / RELATIONS</span></div><p>Corpus : système de classification fourni · Pays : Banque mondiale · Frontières : Natural Earth</p><img src="/manus-storage/atlas-flux-route_f9e9cd02.png" alt="Aperçu cartographique décoratif" /></footer>
    </div>
  );
}

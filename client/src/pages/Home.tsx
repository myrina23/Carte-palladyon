/* Atlas Flux Monde — observatoire géopolitique : visibilité par couches, repères mondiaux et filtres lisibles sur fond cartographique minéral. */
import DeckGL from "@deck.gl/react";
import { ScatterplotLayer } from "@deck.gl/layers";
import { Button } from "@/components/ui/button";
import Map, { NavigationControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import "./world.css";
import {
  Activity,
  ArrowUpRight,
  Check,
  Crosshair,
  Database,
  ExternalLink,
  Filter,
  Globe2,
  Layers3,
  LocateFixed,
  MapPin,
  Radar,
  UsersRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type IndicatorId = "gdp" | "population" | "defense";
type RegionId = "all" | "europe" | "americas" | "africa" | "asia" | "mena";
type ViewId = "world" | "europe" | "americas" | "indoPacific" | "africaMena";

type CountryApiRecord = {
  id: string;
  iso2Code: string;
  name: string;
  region: { id: string; value: string };
  capitalCity: string;
  longitude: string;
  latitude: string;
};

type IndicatorApiRecord = {
  countryiso3code: string;
  date: string;
  value: number | null;
};

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

type ViewConfig = {
  id: ViewId;
  label: string;
  short: string;
  longitude: number;
  latitude: number;
  zoom: number;
};

const YEARS = [2024, 2023, 2022] as const;
const VECTOR_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
const WORLD_BANK_API = "https://api.worldbank.org/v2";

const INDICATORS: Array<{
  id: IndicatorId;
  label: string;
  compact: string;
  sourceLabel: string;
  apiCode: string;
  color: [number, number, number, number];
  description: string;
}> = [
  {
    id: "gdp",
    label: "Puissance économique",
    compact: "PIB",
    sourceLabel: "PIB, dollars courants",
    apiCode: "NY.GDP.MKTP.CD",
    color: [255, 107, 53, 226],
    description: "Produit intérieur brut, dollars courants.",
  },
  {
    id: "population",
    label: "Démographie",
    compact: "POP",
    sourceLabel: "Population totale",
    apiCode: "SP.POP.TOTL",
    color: [73, 180, 169, 220],
    description: "Population totale estimée.",
  },
  {
    id: "defense",
    label: "Effort de défense",
    compact: "DEF",
    sourceLabel: "Dépenses militaires (% PIB)",
    apiCode: "MS.MIL.XPND.GD.ZS",
    color: [242, 194, 78, 230],
    description: "Dépenses militaires en part du PIB, source SIPRI via Banque mondiale.",
  },
];

const VIEWS: ViewConfig[] = [
  { id: "world", label: "Vue monde", short: "MONDE", longitude: 9, latitude: 22, zoom: 1.15 },
  { id: "europe", label: "Europe", short: "EUROPE", longitude: 14, latitude: 51, zoom: 3.05 },
  { id: "americas", label: "Amériques", short: "AMÉRIQUES", longitude: -82, latitude: 14, zoom: 2.05 },
  { id: "indoPacific", label: "Indo-Pacifique", short: "INDO-PAC", longitude: 118, latitude: 18, zoom: 2.15 },
  { id: "africaMena", label: "Afrique–M.-Orient", short: "AFR. / M.-O.", longitude: 29, latitude: 20, zoom: 2.15 },
];

const REGION_FILTERS: Array<{ id: RegionId; label: string }> = [
  { id: "all", label: "Tous" },
  { id: "europe", label: "Europe" },
  { id: "americas", label: "Amériques" },
  { id: "africa", label: "Afrique" },
  { id: "asia", label: "Asie-Pac." },
  { id: "mena", label: "M.-Orient" },
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

export default function Home() {
  const [countries, setCountries] = useState<CountryDatum[]>([]);
  const [activeView, setActiveView] = useState<ViewId>("world");
  const [activeYear, setActiveYear] = useState<number>(2024);
  const [activeRegion, setActiveRegion] = useState<RegionId>("all");
  const [visibleLayers, setVisibleLayers] = useState<Record<IndicatorId, boolean>>({ gdp: true, population: false, defense: false });
  const [selectedCountry, setSelectedCountry] = useState<CountryDatum | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dataError, setDataError] = useState(false);
  const [viewKey, setViewKey] = useState(0);

  const selectedView = VIEWS.find((view) => view.id === activeView) ?? VIEWS[0];

  useEffect(() => {
    let isMounted = true;

    async function loadWorldData() {
      try {
        const countryRequest = fetch(`${WORLD_BANK_API}/country?format=json&per_page=400`);
        const indicatorRequests = INDICATORS.map((indicator) =>
          fetch(`${WORLD_BANK_API}/country/all/indicator/${indicator.apiCode}?date=2022:2024&format=json&per_page=1000`),
        );
        const responses = await Promise.all([countryRequest, ...indicatorRequests]);
        if (responses.some((response) => !response.ok)) throw new Error("Source indisponible");

        const payloads = await Promise.all(responses.map((response) => response.json()));
        const countryPayload = payloads[0] as WorldBankResponse<CountryApiRecord>;
        const indicatorPayloads = payloads.slice(1) as WorldBankResponse<IndicatorApiRecord>[];
        const countryRecords = countryPayload[1] ?? [];
        const entries = new globalThis.Map<string, CountryDatum>();

        countryRecords.forEach((country) => {
          const longitude = Number(country.longitude);
          const latitude = Number(country.latitude);
          if (country.region.id === "NA" || !Number.isFinite(longitude) || !Number.isFinite(latitude) || !country.id) return;
          entries.set(country.id, {
            iso3: country.id,
            iso2: country.iso2Code,
            name: country.name,
            capital: country.capitalCity,
            region: normalizeRegion(country.region.value),
            position: [longitude, latitude],
            indicators: { gdp: {}, population: {}, defense: {} },
          });
        });

        INDICATORS.forEach((indicator, index) => {
          const records = indicatorPayloads[index][1] ?? [];
          records.forEach((record) => {
            const country = entries.get(record.countryiso3code);
            const year = Number(record.date);
            if (country && record.value !== null && YEARS.includes(year as (typeof YEARS)[number])) {
              country.indicators[indicator.id][year] = record.value;
            }
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

  const filteredCountries = useMemo(
    () => countries.filter((country) => activeRegion === "all" || country.region === activeRegion),
    [countries, activeRegion],
  );

  const visibleIndicatorCount = INDICATORS.filter((indicator) => visibleLayers[indicator.id]).length;
  const filteredCount = filteredCountries.filter((country) => INDICATORS.some((indicator) => visibleLayers[indicator.id] && country.indicators[indicator.id][activeYear] !== undefined)).length;

  const layers = useMemo(
    () => INDICATORS.filter((indicator) => visibleLayers[indicator.id]).map((indicator) => new ScatterplotLayer<CountryDatum>({
      id: `world-${indicator.id}`,
      data: filteredCountries.filter((country) => country.indicators[indicator.id][activeYear] !== undefined),
      getPosition: (country) => country.position,
      getRadius: (country) => pointSize(indicator.id, country.indicators[indicator.id][activeYear] ?? 0),
      radiusUnits: "pixels",
      getFillColor: indicator.color,
      getLineColor: [248, 243, 232, 200],
      getLineWidth: 1,
      lineWidthUnits: "pixels",
      stroked: true,
      pickable: true,
      autoHighlight: true,
      highlightColor: [255, 237, 186, 180],
      updateTriggers: { getRadius: activeYear },
    })),
    [activeYear, filteredCountries, visibleLayers, viewKey],
  );

  function selectView(view: ViewConfig) {
    setActiveView(view.id);
    setViewKey((key) => key + 1);
  }

  function toggleLayer(id: IndicatorId) {
    setVisibleLayers((current) => ({ ...current, [id]: !current[id] }));
  }

  function resetView() {
    setActiveView("world");
    setViewKey((key) => key + 1);
  }

  function getTooltip(country: CountryDatum) {
    const activeIndicator = INDICATORS.find((indicator) => visibleLayers[indicator.id] && country.indicators[indicator.id][activeYear] !== undefined);
    if (!activeIndicator) return country.name;
    return `${country.name}\n${activeIndicator.compact} · ${formatMetric(activeIndicator.id, country.indicators[activeIndicator.id][activeYear])}`;
  }

  return (
    <div className="atlas-shell atlas-world-shell">
      <header className="atlas-header" aria-label="Navigation principale">
        <a className="atlas-brand" href="#observatoire" aria-label="Atlas Flux — observatoire mondial">
          <img className="atlas-mark" src="/manus-storage/atlas-flux-mark_3ba6f503.png" alt="" />
          <span>ATLAS <em>FLUX</em></span>
        </a>
        <div className="atlas-header-meta" aria-label="Contexte des données">
          <span className="live-dot" />
          <span>MONDE / INDICATEURS</span>
          <span className="header-rule" />
          <span>BANQUE MONDIALE / DIRECT</span>
        </div>
        <a className="source-link" href="https://data.worldbank.org/" target="_blank" rel="noreferrer">
          Sources ouvertes <ArrowUpRight size={15} aria-hidden="true" />
        </a>
      </header>

      <main id="observatoire" className="world-observatory">
        <aside className="world-view-rail" aria-label="Vues cartographiques">
          <div className="world-rail-heading"><Globe2 size={16} aria-hidden="true" /><span>VUES</span></div>
          <div className="world-view-list">
            {VIEWS.map((view) => (
              <button key={view.id} className={activeView === view.id ? "is-active" : ""} type="button" onClick={() => selectView(view)} aria-pressed={activeView === view.id}>
                <span>{view.short}</span><i>{view.label}</i>
              </button>
            ))}
          </div>
          <div className="world-view-source"><Database size={15} aria-hidden="true" /><span>API V2<br />SANS CLÉ</span></div>
        </aside>

        <section className="world-map-stage" aria-label="Carte mondiale des indicateurs géopolitiques">
          <DeckGL
            key={viewKey}
            initialViewState={{ ...selectedView, pitch: 0, bearing: 0 }}
            controller
            layers={layers}
            getCursor={({ isDragging, isHovering }) => (isDragging ? "grabbing" : isHovering ? "pointer" : "grab")}
            getTooltip={({ object }) => object ? { text: getTooltip(object as CountryDatum) } : null}
            onClick={(info) => {
              const country = info.object as CountryDatum | undefined;
              if (country?.iso3) setSelectedCountry(country);
            }}
          >
            <Map initialViewState={{ ...selectedView, pitch: 0, bearing: 0 }} mapStyle={VECTOR_STYLE} attributionControl={false} reuseMaps style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
              <NavigationControl position="bottom-right" showCompass={false} />
            </Map>
          </DeckGL>

          <div className="world-grid-labels" aria-hidden="true"><span>180° O</span><span>0°</span><span>180° E</span><small>ATLAS / ÉCHELLE MONDIALE</small></div>

          <div className="world-intro intro-animate">
            <p className="eyebrow"><Radar size={14} aria-hidden="true" /> OBSERVATOIRE GÉOPOLITIQUE</p>
            <h1>Lire les<br /><i>rapports</i> de force.</h1>
            <p>Comparez des indicateurs publics à l’échelle des États. Activez les calques, filtrez la période et ciblez une région.</p>
          </div>

          <section className="world-filter-panel intro-animate delay-1" aria-label="Filtres des indicateurs mondiaux">
            <div className="world-filter-title"><Filter size={15} aria-hidden="true" /><span>FILTRES</span></div>
            <div className="filter-group">
              <p>PÉRIODE</p>
              <div className="filter-pills">
                {YEARS.map((year) => <button key={year} type="button" className={activeYear === year ? "is-selected" : ""} onClick={() => setActiveYear(year)}>{year}</button>)}
              </div>
            </div>
            <div className="filter-group">
              <p>RÉGION</p>
              <div className="filter-pills region-pills">
                {REGION_FILTERS.map((region) => <button key={region.id} type="button" className={activeRegion === region.id ? "is-selected" : ""} onClick={() => { setActiveRegion(region.id); setSelectedCountry(null); }}>{region.label}</button>)}
              </div>
            </div>
            <p className="filter-status">{isLoading ? "Lecture des données…" : `${filteredCount} pays disponibles`}</p>
          </section>

          <section className="world-layer-panel intro-animate delay-2" aria-label="Calques d’indicateurs">
            <div className="layer-panel-heading"><Layers3 size={15} aria-hidden="true" /><span>CALQUES ACTIFS</span><b>{String(visibleIndicatorCount).padStart(2, "0")}</b></div>
            {INDICATORS.map((indicator) => (
              <button key={indicator.id} data-layer={indicator.compact} className={`world-layer-button ${visibleLayers[indicator.id] ? "is-active" : ""}`} type="button" onClick={() => toggleLayer(indicator.id)} aria-pressed={visibleLayers[indicator.id]}>
                <span className="world-layer-dot" style={{ backgroundColor: `rgb(${indicator.color.slice(0, 3).join(" ")})` }} aria-hidden="true" />
                <span><b>{indicator.label}</b><small>{indicator.sourceLabel}</small></span>
                {visibleLayers[indicator.id] && <Check size={14} aria-hidden="true" />}
              </button>
            ))}
          </section>

          <aside className={`world-detail-panel ${selectedCountry ? "is-open" : ""}`} aria-live="polite" aria-label="Fiche pays">
            <button className="detail-close" type="button" onClick={() => setSelectedCountry(null)} aria-label="Fermer la fiche pays"><X size={17} /></button>
            {selectedCountry && (
              <>
                <p className="eyebrow"><MapPin size={14} aria-hidden="true" /> FICHE PAYS / {selectedCountry.iso3}</p>
                <h2>{selectedCountry.name}</h2>
                <p className="country-capital">{selectedCountry.capital ? `Capitale : ${selectedCountry.capital}` : "Capitale non renseignée"}</p>
                <div className="country-metrics">
                  {INDICATORS.map((indicator) => <div key={indicator.id}><span style={{ backgroundColor: `rgb(${indicator.color.slice(0, 3).join(" ")})` }} /><p>{indicator.compact}</p><strong>{formatMetric(indicator.id, selectedCountry.indicators[indicator.id][activeYear])}</strong></div>)}
                </div>
                <p className="country-note">Valeurs disponibles pour {activeYear}. Les séries peuvent être mises à jour selon le calendrier de chaque source statistique.</p>
                <a className="detail-link" href={`https://data.worldbank.org/country/${selectedCountry.iso2.toLowerCase()}`} target="_blank" rel="noreferrer">Voir la fiche Banque mondiale <ExternalLink size={14} aria-hidden="true" /></a>
              </>
            )}
          </aside>

          <div className="world-map-actions">
            <Button className="instrument-button" variant="outline" onClick={resetView}><LocateFixed size={16} aria-hidden="true" /> Vue monde</Button>
            <p><Activity size={13} aria-hidden="true" /> {selectedView.label} · {activeYear}</p>
          </div>
          {dataError && <p className="map-data-error" role="status">Les indicateurs mondiaux n’ont pas pu être chargés. Veuillez réessayer plus tard.</p>}
        </section>
      </main>

      <section className="world-brief" aria-labelledby="world-brief-title">
        <div className="world-brief-index"><span>01</span><p>LECTURE<br />MONDIALE</p></div>
        <div className="world-brief-copy">
          <p className="eyebrow"><UsersRound size={14} aria-hidden="true" /> CADRE DE LECTURE</p>
          <h2 id="world-brief-title">Des calques pour <i>questionner</i>, jamais pour prédire.</h2>
          <p>Atlas Flux présente des indicateurs économiques, démographiques et d’effort de défense issus de sources publiques. Ils servent à comparer des ordres de grandeur, non à produire un classement géopolitique ou une prévision de conflit.</p>
          <a href="https://datahelpdesk.worldbank.org/knowledgebase/articles/889392-about-the-indicators-api-documentation" target="_blank" rel="noreferrer">Documentation de la source <ArrowUpRight size={15} aria-hidden="true" /></a>
        </div>
        <div className="world-method">
          <article><strong>03</strong><span>calques<br />thématiques</span></article>
          <article><strong>05</strong><span>vues<br />régionales</span></article>
          <article><strong>03</strong><span>années<br />comparables</span></article>
        </div>
      </section>

      <footer className="atlas-footer">
        <div><Crosshair size={16} aria-hidden="true" /> <span>ATLAS FLUX / MONDE</span></div>
        <p>Données : Banque mondiale · SIPRI via Banque mondiale</p>
        <img src="/manus-storage/atlas-flux-route_f9e9cd02.png" alt="Aperçu cartographique décoratif" />
      </footer>
    </div>
  );
}

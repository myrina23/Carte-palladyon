/* Atlas Flux — console cartographique éditoriale : strates d’information, tonalités minérales et orange Méridien réservé au signal. */
import DeckGL from "@deck.gl/react";
import { GeoJsonLayer } from "@deck.gl/layers";
import { Button } from "@/components/ui/button";
import Map, { NavigationControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  Activity,
  ArrowUpRight,
  CalendarDays,
  Check,
  Crosshair,
  Database,
  ExternalLink,
  Layers3,
  LocateFixed,
  MapPin,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Coordinate = [number, number];

type ParisProject = {
  titre_descriptif: string;
  corps_descriptif?: string | null;
  categorie?: string | null;
  sous_categorie?: string | null;
  adresse?: string | null;
  code_postal?: string | null;
  date_liv: string;
  url_parisfr?: string | null;
  url_pj?: string | null;
  geo_shape?: {
    type: "Feature";
    geometry?: { type: "Point"; coordinates?: Coordinate };
  };
};

type ParisFeature = {
  type: "Feature";
  geometry: { type: "Point"; coordinates: Coordinate };
  properties: ParisProject;
};

type ParisApiResponse = { results?: ParisProject[] };

const INITIAL_VIEW = {
  longitude: 2.3499,
  latitude: 48.8566,
  zoom: 11.25,
  pitch: 32,
  bearing: -8,
};

const PARIS_DATA_URL =
  "https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/parissetransforme/records?limit=100&where=date_liv%20is%20not%20null&order_by=date_liv%20desc";

const VECTOR_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

function categoryColor(category?: string | null): [number, number, number, number] {
  if (category?.includes("Nature") || category?.includes("Espace")) return [73, 180, 169, 220];
  if (category?.includes("Logement")) return [242, 194, 78, 225];
  if (category?.includes("Culture") || category?.includes("Sport")) return [186, 137, 210, 220];
  return [255, 107, 53, 230];
}

function formatProjectDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value}T12:00:00`));
}

function projectYear(project: ParisProject) {
  return new Date(`${project.date_liv}T12:00:00`).getFullYear();
}

export default function Home() {
  const [projects, setProjects] = useState<ParisProject[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | "all">("all");
  const [selectedProject, setSelectedProject] = useState<ParisProject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dataError, setDataError] = useState(false);
  const [projectsVisible, setProjectsVisible] = useState(true);
  const [viewKey, setViewKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadProjects() {
      try {
        const pageRequests = Array.from({ length: 6 }, (_, page) =>
          fetch(`${PARIS_DATA_URL}&offset=${page * 100}`),
        );
        const responses = await Promise.all(pageRequests);
        if (responses.some((response) => !response.ok)) throw new Error("La source Paris Data est indisponible.");
        const pages = (await Promise.all(responses.map((response) => response.json()))) as ParisApiResponse[];
        const usableProjects = pages.flatMap((page) => page.results ?? []).filter((project) => {
          const coordinates = project.geo_shape?.geometry?.coordinates;
          return Array.isArray(coordinates) && coordinates.length === 2;
        });
        if (isMounted) {
          setProjects(usableProjects);
          const latestYear = Math.max(...usableProjects.map(projectYear));
          if (Number.isFinite(latestYear)) setSelectedYear(latestYear);
        }
      } catch {
        if (isMounted) setDataError(true);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadProjects();
    return () => { isMounted = false; };
  }, []);

  const availableYears = useMemo(
    () => Array.from(new Set(projects.map(projectYear))).sort((a, b) => b - a),
    [projects],
  );

  const filteredProjects = useMemo(
    () => projects.filter((project) => selectedYear === "all" || projectYear(project) === selectedYear),
    [projects, selectedYear],
  );

  const projectFeatures = useMemo<ParisFeature[]>(
    () => filteredProjects.flatMap((project) => {
      const coordinates = project.geo_shape?.geometry?.coordinates;
      return coordinates ? [{ type: "Feature", geometry: { type: "Point", coordinates }, properties: project }] : [];
    }),
    [filteredProjects],
  );

  const layers = useMemo(() => {
    if (!projectsVisible) return [];
    return [
      new GeoJsonLayer<ParisProject>({
        id: "paris-projects",
        data: projectFeatures,
        pointType: "circle",
        filled: true,
        stroked: true,
        getPointRadius: (feature) => (feature.properties.titre_descriptif === selectedProject?.titre_descriptif ? 155 : 96),
        getFillColor: (feature) => categoryColor(feature.properties.categorie),
        getLineColor: [250, 246, 235, 210],
        getLineWidth: 2,
        pointRadiusMinPixels: 5,
        pointRadiusMaxPixels: 18,
        lineWidthMinPixels: 1,
        pickable: true,
        autoHighlight: true,
        highlightColor: [255, 237, 186, 160],
        updateTriggers: { getPointRadius: selectedProject?.titre_descriptif },
      }),
    ];
  }, [projectFeatures, projectsVisible, selectedProject?.titre_descriptif]);

  function resetView() {
    setViewKey((value) => value + 1);
  }

  function selectYear(year: number | "all") {
    setSelectedYear(year);
    setSelectedProject(null);
  }

  const yearLabel = selectedYear === "all" ? "Toutes les livraisons" : `Livraisons ${selectedYear}`;

  return (
    <div className="atlas-shell">
      <header className="atlas-header" aria-label="Navigation principale">
        <a className="atlas-brand" href="#observatoire" aria-label="Atlas Flux — observatoire">
          <img className="atlas-mark" src="/manus-storage/atlas-flux-mark_3ba6f503.png" alt="" />
          <span>ATLAS <em>FLUX</em></span>
        </a>
        <div className="atlas-header-meta" aria-label="Contexte des données">
          <span className="live-dot" />
          <span>PARIS DATA / DIRECT</span>
          <span className="header-rule" />
          <span>PARIS / 48.8566° N</span>
        </div>
        <a className="source-link" href="https://deck.gl/" target="_blank" rel="noreferrer">
          Propulsé par deck.gl <ArrowUpRight size={15} aria-hidden="true" />
        </a>
      </header>

      <main id="observatoire" className="atlas-observatory atlas-observatory-live">
        <section className="atlas-map-stage" aria-label="Carte interactive des réalisations parisiennes">
          <div className="map-atmosphere" aria-hidden="true" />
          <DeckGL
            key={viewKey}
            initialViewState={INITIAL_VIEW}
            controller
            layers={layers}
            getCursor={({ isDragging, isHovering }) => (isDragging ? "grabbing" : isHovering ? "pointer" : "grab")}
            onClick={(info) => {
              const feature = info.object as ParisFeature | undefined;
              if (feature?.properties?.titre_descriptif) setSelectedProject(feature.properties);
            }}
            getTooltip={({ object }) => {
              const feature = object as ParisFeature | undefined;
              if (!feature?.properties?.titre_descriptif) return null;
              return { text: `${feature.properties.titre_descriptif}\nLivré le ${formatProjectDate(feature.properties.date_liv)}` };
            }}
          >
            <Map initialViewState={INITIAL_VIEW} mapStyle={VECTOR_STYLE} attributionControl={false} reuseMaps style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
              <NavigationControl position="bottom-right" showCompass={false} />
            </Map>
          </DeckGL>

          <div className="coordinate-corners" aria-hidden="true">
            <span>48° 58′ N</span><span>02° 20′ E</span><span>PARIS DATA / PST</span><span>FOND VECTORIEL</span>
          </div>

          <div className="map-intro intro-animate">
            <p className="eyebrow"><Activity size={14} aria-hidden="true" /> OBSERVATOIRE / 01</p>
            <h1>Les projets<br /><i>dessinent</i> la ville.</h1>
            <p>Explorez les réalisations géolocalisées de Paris Data. Choisissez une période, puis sélectionnez un point pour ouvrir son relevé.</p>
          </div>

          <div className="time-filter intro-animate delay-1" aria-label="Filtrer les réalisations par année de livraison">
            <div className="time-filter-heading"><CalendarDays size={15} aria-hidden="true" /><span>PÉRIODE DE LIVRAISON</span></div>
            <div className="time-filter-buttons">
              <button className={selectedYear === "all" ? "is-selected" : ""} type="button" onClick={() => selectYear("all")}>Toutes</button>
              {availableYears.map((year) => (
                <button key={year} className={selectedYear === year ? "is-selected" : ""} type="button" onClick={() => selectYear(year)}>{year}</button>
              ))}
            </div>
            <p>{isLoading ? "Chargement de la source…" : `${projectFeatures.length} réalisations visibles`}</p>
          </div>

          <aside className={`node-detail-panel ${selectedProject ? "is-open" : ""}`} aria-live="polite" aria-label="Détails de la réalisation sélectionnée">
            <button className="detail-close" type="button" onClick={() => setSelectedProject(null)} aria-label="Fermer le panneau de détail"><X size={17} /></button>
            {selectedProject ? (
              <>
                <p className="eyebrow"><MapPin size={14} aria-hidden="true" /> NŒUD SÉLECTIONNÉ</p>
                <h2>{selectedProject.titre_descriptif}</h2>
                <div className="detail-category"><span style={{ backgroundColor: `rgb(${categoryColor(selectedProject.categorie).slice(0, 3).join(" ")})` }} /><span>{selectedProject.categorie ?? "Réalisation"}</span></div>
                <dl className="detail-list">
                  <div><dt>Livraison</dt><dd>{formatProjectDate(selectedProject.date_liv)}</dd></div>
                  <div><dt>Adresse</dt><dd>{selectedProject.adresse ?? "Adresse non renseignée"}{selectedProject.code_postal ? `, ${selectedProject.code_postal}` : ""}</dd></div>
                  {selectedProject.sous_categorie && <div><dt>Type</dt><dd>{selectedProject.sous_categorie}</dd></div>}
                </dl>
                {selectedProject.corps_descriptif && <p className="detail-description">{selectedProject.corps_descriptif}</p>}
                {selectedProject.url_parisfr && <a className="detail-link" href={selectedProject.url_parisfr} target="_blank" rel="noreferrer">Voir la fiche Paris.fr <ExternalLink size={14} aria-hidden="true" /></a>}
              </>
            ) : null}
          </aside>

          <div className="map-actions intro-animate delay-2">
            <Button className="instrument-button" variant="outline" onClick={resetView}>
              <LocateFixed size={16} aria-hidden="true" /> Recentrer la vue
            </Button>
            <p><MapPin size={13} aria-hidden="true" /> Paris, France</p>
          </div>

          {dataError && <p className="map-data-error" role="status">La source Paris Data n’a pas pu être chargée. Veuillez réessayer plus tard.</p>}
        </section>

        <aside className="atlas-control-rail intro-animate delay-1" aria-label="Calques et source cartographiques">
          <div className="rail-heading">
            <p className="eyebrow"><Layers3 size={14} aria-hidden="true" /> COUCHES</p>
            <span>02</span>
          </div>
          <button className={`layer-control ${projectsVisible ? "is-active" : ""}`} type="button" onClick={() => setProjectsVisible((visible) => !visible)} aria-pressed={projectsVisible}>
            <span className="layer-indicator" aria-hidden="true" />
            <span className="layer-copy"><b>Réalisations</b><small>{isLoading ? "lecture…" : `${projects.length} enregistrements`}</small></span>
            {projectsVisible && <Check size={14} aria-hidden="true" />}
          </button>
          <div className="base-layer-note"><span className="base-swatch" aria-hidden="true" /><span><b>Fond vectoriel</b><small>CARTO / Dark Matter</small></span></div>
          <div className="rail-divider" />
          <div className="data-source-note">
            <Database size={15} aria-hidden="true" />
            <div><p>SOURCE DES DONNÉES</p><a href="https://opendata.paris.fr/explore/dataset/parissetransforme/" target="_blank" rel="noreferrer">Paris Data · Paris se transforme <ArrowUpRight size={13} /></a></div>
          </div>
          <div className="rail-divider compact" />
          <p className="rail-status"><span /> {yearLabel}</p>
        </aside>
      </main>

      <section className="atlas-brief" aria-labelledby="brief-title">
        <div className="brief-index"><span>02</span><p>NOTE DE<br />TERRAIN</p></div>
        <div className="brief-copy">
          <p className="eyebrow"><Sparkles size={14} aria-hidden="true" /> LECTURE RAPIDE</p>
          <h2 id="brief-title">Une carte conçue pour <i>interroger</i> le réel.</h2>
          <p className="serif-text">Les points affichés proviennent du jeu public « Paris se transforme ». Chaque réalisation comporte une localisation, une catégorie et, lorsqu’elle est renseignée, une date de livraison qui alimente les filtres temporels de la carte.</p>
          <a href="https://opendata.paris.fr/explore/dataset/parissetransforme/" target="_blank" rel="noreferrer">Consulter la source des données <ArrowUpRight size={15} aria-hidden="true" /></a>
        </div>
        <div className="brief-visual" aria-hidden="true">
          <img src="/manus-storage/atlas-flux-terrain_c2d818b9.png" alt="" />
          <div className="visual-caption"><span>COUCHE / PARIS DATA</span><span>GEOJSON</span></div>
        </div>
        <div className="brief-metrics">
          <article><strong>{String(projectFeatures.length).padStart(2, "0")}</strong><span>réalisations<br />filtrées</span></article>
          <article><strong>{String(availableYears.length).padStart(2, "0")}</strong><span>années de<br />livraison</span></article>
          <article><strong>01</strong><span>source GeoJSON<br />publique</span></article>
        </div>
      </section>

      <footer className="atlas-footer">
        <div><Crosshair size={16} aria-hidden="true" /> <span>ATLAS FLUX / OBSERVATOIRE</span></div>
        <p>Données : Ville de Paris · « Paris se transforme »</p>
        <img src="/manus-storage/atlas-flux-route_f9e9cd02.png" alt="Aperçu cartographique décoratif" />
      </footer>
    </div>
  );
}

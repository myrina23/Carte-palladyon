/* Atlas Flux — console cartographique éditoriale : strates d’information, tonalités minérales et orange Méridien réservé au signal. */
import DeckGL from "@deck.gl/react";
import { ArcLayer, PathLayer, ScatterplotLayer } from "@deck.gl/layers";
import { Button } from "@/components/ui/button";
import {
  Activity,
  ArrowUpRight,
  Crosshair,
  Layers3,
  LocateFixed,
  MapPin,
  Route,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";

type Coordinate = [number, number];

type RouteDatum = {
  id: string;
  name: string;
  source: Coordinate;
  target: Coordinate;
  volume: string;
  color: [number, number, number, number];
};

type HubDatum = {
  id: string;
  name: string;
  position: Coordinate;
  size: number;
  color: [number, number, number, number];
};

type SurveyPath = {
  id: string;
  path: Coordinate[];
};

const INITIAL_VIEW = {
  longitude: 2.3499,
  latitude: 48.8566,
  zoom: 10.55,
  pitch: 38,
  bearing: -14,
};

const ROUTES: RouteDatum[] = [
  {
    id: "r-01",
    name: "Nord → Centre",
    source: [2.312, 48.942],
    target: [2.3499, 48.8566],
    volume: "4 820 passages",
    color: [255, 107, 53, 238],
  },
  {
    id: "r-02",
    name: "Est → Centre",
    source: [2.486, 48.863],
    target: [2.3499, 48.8566],
    volume: "3 146 passages",
    color: [242, 194, 78, 212],
  },
  {
    id: "r-03",
    name: "Sud → Centre",
    source: [2.371, 48.776],
    target: [2.3499, 48.8566],
    volume: "2 674 passages",
    color: [73, 180, 169, 205],
  },
];

const HUBS: HubDatum[] = [
  { id: "h-01", name: "Nœud Nord", position: [2.312, 48.942], size: 900, color: [255, 107, 53, 250] },
  { id: "h-02", name: "Nœud Est", position: [2.486, 48.863], size: 780, color: [242, 194, 78, 245] },
  { id: "h-03", name: "Nœud Sud", position: [2.371, 48.776], size: 720, color: [73, 180, 169, 240] },
  { id: "h-04", name: "Centre", position: [2.3499, 48.8566], size: 1160, color: [255, 107, 53, 255] },
];

const SURVEY_PATHS: SurveyPath[] = [
  { id: "p-01", path: [[2.29, 48.92], [2.34, 48.9], [2.39, 48.87], [2.42, 48.82]] },
  { id: "p-02", path: [[2.28, 48.81], [2.34, 48.83], [2.4, 48.85], [2.46, 48.89]] },
];

const LAYER_OPTIONS = [
  { id: "routes", label: "Trajectoires", note: "03 actifs" },
  { id: "hubs", label: "Nœuds", note: "04 relevés" },
  { id: "survey", label: "Axes d’enquête", note: "02 tracés" },
] as const;

type LayerId = (typeof LAYER_OPTIONS)[number]["id"];

export default function Home() {
  const [visibleLayers, setVisibleLayers] = useState<Record<LayerId, boolean>>({
    routes: true,
    hubs: true,
    survey: true,
  });
  const [selectedRoute, setSelectedRoute] = useState<RouteDatum>(ROUTES[0]);
  const [viewKey, setViewKey] = useState(0);

  const layers = useMemo(() => {
    const activeLayers = [];

    if (visibleLayers.survey) {
      activeLayers.push(
        new PathLayer<SurveyPath>({
          id: "survey-paths",
          data: SURVEY_PATHS,
          getPath: (datum) => datum.path,
          getColor: [187, 205, 196, 82],
          getWidth: 2,
          widthMinPixels: 1,
          widthMaxPixels: 3,
          jointRounded: true,
          capRounded: true,
        }),
      );
    }

    if (visibleLayers.routes) {
      activeLayers.push(
        new ArcLayer<RouteDatum>({
          id: "flow-routes",
          data: ROUTES,
          getSourcePosition: (datum) => datum.source,
          getTargetPosition: (datum) => datum.target,
          getSourceColor: (datum) => datum.color,
          getTargetColor: [255, 107, 53, 32],
          getWidth: (datum) => (datum.id === selectedRoute.id ? 7 : 4),
          widthMinPixels: 2,
          widthMaxPixels: 9,
          greatCircle: true,
          pickable: true,
          updateTriggers: { getWidth: selectedRoute.id },
        }),
      );
    }

    if (visibleLayers.hubs) {
      activeLayers.push(
        new ScatterplotLayer<HubDatum>({
          id: "activity-hubs",
          data: HUBS,
          getPosition: (datum) => datum.position,
          getRadius: (datum) => datum.size,
          getFillColor: (datum) => datum.color,
          radiusMinPixels: 4,
          radiusMaxPixels: 20,
          stroked: true,
          getLineColor: [253, 246, 232, 175],
          lineWidthMinPixels: 1,
          pickable: true,
        }),
      );
    }

    return activeLayers;
  }, [selectedRoute.id, visibleLayers]);

  function toggleLayer(id: LayerId) {
    setVisibleLayers((current) => ({ ...current, [id]: !current[id] }));
  }

  function resetView() {
    setViewKey((value) => value + 1);
  }

  return (
    <div className="atlas-shell">
      <header className="atlas-header" aria-label="Navigation principale">
        <a className="atlas-brand" href="#observatoire" aria-label="Atlas Flux — observatoire">
          <img className="atlas-mark" src="/manus-storage/atlas-flux-mark_3ba6f503.png" alt="" />
          <span>ATLAS <em>FLUX</em></span>
        </a>
        <div className="atlas-header-meta" aria-label="Contexte des données">
          <span className="live-dot" />
          <span>RELEVÉ SYNTHÉTIQUE</span>
          <span className="header-rule" />
          <span>PARIS / 48.8566° N</span>
        </div>
        <a className="source-link" href="https://deck.gl/" target="_blank" rel="noreferrer">
          Propulsé par deck.gl <ArrowUpRight size={15} aria-hidden="true" />
        </a>
      </header>

      <main id="observatoire" className="atlas-observatory">
        <section className="atlas-map-stage" aria-label="Carte interactive des flux urbains">
          <div className="map-atmosphere" aria-hidden="true" />
          <DeckGL
            key={viewKey}
            initialViewState={INITIAL_VIEW}
            controller
            layers={layers}
            getCursor={({ isDragging, isHovering }) => (isDragging ? "grabbing" : isHovering ? "pointer" : "grab")}
            onClick={(info) => {
              const route = info.object as RouteDatum | undefined;
              if (route?.id?.startsWith("r-")) setSelectedRoute(route);
            }}
            getTooltip={({ object }) => {
              const route = object as RouteDatum | undefined;
              return route?.volume ? { text: `${route.name} · ${route.volume}` } : null;
            }}
          />

          <div className="coordinate-corners" aria-hidden="true">
            <span>48° 58′ N</span><span>02° 20′ E</span><span>SECTEUR 01</span><span>ÉCHELLE VARIABLE</span>
          </div>

          <div className="map-intro intro-animate">
            <p className="eyebrow"><Activity size={14} aria-hidden="true" /> OBSERVATOIRE / 01</p>
            <h1>Les flux<br /><i>dessinent</i> la ville.</h1>
            <p>Explorez une lecture instrumentale des mouvements urbains, rendue dans le navigateur par GPU.</p>
          </div>

          <aside className="selected-route-card intro-animate delay-1" aria-live="polite">
            <p className="eyebrow"><Route size={14} aria-hidden="true" /> TRAJECTOIRE ACTIVE</p>
            <div className="route-card-main">
              <div>
                <h2>{selectedRoute.name}</h2>
                <p>Observation consolidée</p>
              </div>
              <strong>{selectedRoute.volume.split(" ")[0]}<small> K</small></strong>
            </div>
            <div className="route-progress"><span /></div>
            <p className="route-card-foot"><span>Intensité</span><b>Élevée</b></p>
          </aside>

          <div className="map-actions intro-animate delay-2">
            <Button className="instrument-button" variant="outline" onClick={resetView}>
              <LocateFixed size={16} aria-hidden="true" /> Recentrer la vue
            </Button>
            <p><MapPin size={13} aria-hidden="true" /> Paris, France</p>
          </div>
        </section>

        <aside className="atlas-control-rail intro-animate delay-1" aria-label="Calques cartographiques">
          <div className="rail-heading">
            <p className="eyebrow"><Layers3 size={14} aria-hidden="true" /> CALQUES</p>
            <span>03</span>
          </div>
          <div className="layer-list">
            {LAYER_OPTIONS.map((layer) => (
              <button
                key={layer.id}
                className={`layer-control ${visibleLayers[layer.id] ? "is-active" : ""}`}
                type="button"
                onClick={() => toggleLayer(layer.id)}
                aria-pressed={visibleLayers[layer.id]}
              >
                <span className="layer-indicator" aria-hidden="true" />
                <span className="layer-copy"><b>{layer.label}</b><small>{layer.note}</small></span>
              </button>
            ))}
          </div>
          <div className="rail-divider" />
          <div className="map-legend" aria-label="Légende d’intensité">
            <p>INTENSITÉ</p>
            <div><span /><span /><span /><span /><span /></div>
            <small>faible <i>→</i> élevée</small>
          </div>
        </aside>
      </main>

      <section className="atlas-brief" aria-labelledby="brief-title">
        <div className="brief-index"><span>02</span><p>NOTE DE<br />TERRAIN</p></div>
        <div className="brief-copy">
          <p className="eyebrow"><Sparkles size={14} aria-hidden="true" /> LECTURE RAPIDE</p>
          <h2 id="brief-title">Une carte conçue pour <i>isoler</i> le signal.</h2>
          <p className="serif-text">Cette démonstration emploie des données illustratives afin de présenter trois capacités centrales : la composition de calques, la sélection d’une trajectoire et l’exploration fluide d’un jeu de positions géographiques.</p>
          <a href="https://github.com/visgl/deck.gl" target="_blank" rel="noreferrer">Voir le dépôt officiel <ArrowUpRight size={15} aria-hidden="true" /></a>
        </div>
        <div className="brief-visual" aria-hidden="true">
          <img src="/manus-storage/atlas-flux-terrain_c2d818b9.png" alt="" />
          <div className="visual-caption"><span>COUCHE / TOPO</span><span>01:24000</span></div>
        </div>
        <div className="brief-metrics">
          <article><strong>03</strong><span>trajectoires<br />analysées</span></article>
          <article><strong>04</strong><span>nœuds<br />d’activité</span></article>
          <article><strong>60</strong><span>ips de rendu<br />ciblées</span></article>
        </div>
      </section>

      <footer className="atlas-footer">
        <div><Crosshair size={16} aria-hidden="true" /> <span>ATLAS FLUX / DÉMONSTRATEUR</span></div>
        <p>Données illustratives · Interface de démonstration</p>
        <img src="/manus-storage/atlas-flux-route_f9e9cd02.png" alt="Aperçu cartographique décoratif" />
      </footer>
    </div>
  );
}

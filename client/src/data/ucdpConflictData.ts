/**
 * Atlas Flux — données de conflit datées, pour le calque de chaleur.
 * Source : UCDP Georeferenced Event Dataset (GED) Global v26.1, CC BY 4.0.
 * Méthode : top 6 cellules de 0,5° par année selon les décès estimés (« best »).
 * Cette série est un extrait de visualisation, non une mesure exhaustive de conflit mondial.
 */
export type UcdpConflictCell = {
  year: number;
  position: [number, number];
  fatalities: number;
  events: number;
};

export const UCDP_GED_SOURCE = "UCDP Georeferenced Event Dataset (GED) Global v26.1 · CC BY 4.0";
export const UCDP_GED_PERIOD = "2020–2025";

export const UCDP_CONFLICT_CELLS: UcdpConflictCell[] = [
  { year: 2020, position: [39.5, 13.5], fatalities: 19283, events: 10 },
  { year: 2020, position: [46.5, 40], fatalities: 5404, events: 5 },
  { year: 2020, position: [-101, 21], fatalities: 3365, events: 17 },
  { year: 2020, position: [-117, 32.5], fatalities: 1962, events: 368 },
  { year: 2020, position: [47, 40], fatalities: 1933, events: 75 },
  { year: 2020, position: [65, 33], fatalities: 1908, events: 10 },
  { year: 2021, position: [39, 13], fatalities: 113405, events: 12 },
  { year: 2021, position: [45.5, 15.5], fatalities: 14098, events: 88 },
  { year: 2021, position: [45, 15.5], fatalities: 3468, events: 118 },
  { year: 2021, position: [39, 13.5], fatalities: 2670, events: 21 },
  { year: 2021, position: [65.5, 31.5], fatalities: 2112, events: 236 },
  { year: 2021, position: [64.5, 31.5], fatalities: 1703, events: 98 },
  { year: 2022, position: [39, 13], fatalities: 157226, events: 9 },
  { year: 2022, position: [32, 49], fatalities: 28785, events: 428 },
  { year: 2022, position: [37.5, 47], fatalities: 27663, events: 194 },
  { year: 2022, position: [38, 48.5], fatalities: 8863, events: 923 },
  { year: 2022, position: [38.5, 48.5], fatalities: 4457, events: 255 },
  { year: 2022, position: [38.5, 48], fatalities: 4450, events: 339 },
  { year: 2023, position: [34.5, 31.5], fatalities: 24805, events: 1095 },
  { year: 2023, position: [32, 49], fatalities: 23412, events: 525 },
  { year: 2023, position: [38, 48.5], fatalities: 17321, events: 1885 },
  { year: 2023, position: [37.5, 48], fatalities: 11544, events: 1458 },
  { year: 2023, position: [22.5, 13.5], fatalities: 8159, events: 34 },
  { year: 2023, position: [38.5, 48.5], fatalities: 4075, events: 100 },
  { year: 2024, position: [32, 49], fatalities: 52923, events: 163 },
  { year: 2024, position: [34.5, 31.5], fatalities: 19185, events: 2455 },
  { year: 2024, position: [37.5, 48], fatalities: 18601, events: 2455 },
  { year: 2024, position: [35.5, 51], fatalities: 6633, events: 98 },
  { year: 2024, position: [38, 48.5], fatalities: 2971, events: 1124 },
  { year: 2024, position: [38, 49], fatalities: 2946, events: 961 },
  { year: 2025, position: [25.5, 13.5], fatalities: 63525, events: 218 },
  { year: 2025, position: [32, 49], fatalities: 63481, events: 266 },
  { year: 2025, position: [34.5, 31.5], fatalities: 13441, events: 2852 },
  { year: 2025, position: [37, 48.5], fatalities: 8612, events: 334 },
  { year: 2025, position: [29, -1.5], fatalities: 3496, events: 107 },
  { year: 2025, position: [37, 48], fatalities: 3141, events: 951 },
];

/**
 * Atlas Flux — relations résolues depuis l’export SPARQL Wikidata transmis.
 * P47 : partage une frontière, terrestre ou maritime ; P463 : membre d’une organisation.
 * L’export ne livre pas les qualificateurs temporels de chaque énoncé : ces relations sont
 * donc structurelles, et ne doivent pas être interprétées comme datées.
 */
export type WikidataActor = { id: string; qid: string; name: string; position: [number, number] };
export type WikidataResolvedRelation = {
  id: string;
  source: WikidataActor;
  target: WikidataActor;
  property: "P47" | "P463";
  type: "geopolitique" | "juridique";
  title: string;
  detail: string;
  temporalScope: "structural";
};

const ACTORS = {
  turkey: { id: "TUR", qid: "Q43", name: "Turquie", position: [32.8597, 39.9334] },
  unitedStates: { id: "USA", qid: "Q30", name: "États-Unis", position: [-77.0369, 38.9072] },
  bulgaria: { id: "BGR", qid: "Q219", name: "Bulgarie", position: [23.3219, 42.6977] },
  japan: { id: "JPN", qid: "Q17", name: "Japon", position: [139.6917, 35.6895] },
  vietnam: { id: "VNM", qid: "Q881", name: "Vietnam", position: [105.8342, 21.0278] },
  southKorea: { id: "KOR", qid: "Q884", name: "Corée du Sud", position: [126.978, 37.5665] },
  india: { id: "IND", qid: "Q668", name: "Inde", position: [77.209, 28.6139] },
  syria: { id: "SYR", qid: "Q858", name: "Syrie", position: [36.2765, 33.5138] },
  greece: { id: "GRC", qid: "Q41", name: "Grèce", position: [23.7275, 37.9838] },
  azerbaijan: { id: "AZE", qid: "Q227", name: "Azerbaïdjan", position: [49.8671, 40.4093] },
  georgia: { id: "GEO", qid: "Q230", name: "Géorgie", position: [44.8015, 41.7151] },
  armenia: { id: "ARM", qid: "Q399", name: "Arménie", position: [44.5152, 40.1872] },
  iran: { id: "IRN", qid: "Q794", name: "Iran", position: [51.389, 35.6892] },
  iraq: { id: "IRQ", qid: "Q796", name: "Irak", position: [44.3661, 33.3152] },
  canada: { id: "CAN", qid: "Q16", name: "Canada", position: [-75.6972, 45.4215] },
  mexico: { id: "MEX", qid: "Q96", name: "Mexique", position: [-99.1332, 19.4326] },
  romania: { id: "ROU", qid: "Q218", name: "Roumanie", position: [26.1025, 44.4268] },
  northMacedonia: { id: "MKD", qid: "Q221", name: "Macédoine du Nord", position: [21.4316, 42] },
  serbia: { id: "SRB", qid: "Q403", name: "Serbie", position: [20.4489, 44.7866] },
  china: { id: "CHN", qid: "Q148", name: "Chine", position: [116.4074, 39.9042] },
  russia: { id: "RUS", qid: "Q159", name: "Russie", position: [37.6173, 55.7558] },
  taiwan: { id: "TWN", qid: "Q865", name: "Taïwan", position: [121.5654, 25.033] },
  philippines: { id: "PHL", qid: "Q928", name: "Philippines", position: [120.9842, 14.5995] },
  cambodia: { id: "KHM", qid: "Q424", name: "Cambodge", position: [104.9282, 11.5564] },
  laos: { id: "LAO", qid: "Q819", name: "Laos", position: [102.6331, 17.9757] },
  northKorea: { id: "PRK", qid: "Q423", name: "Corée du Nord", position: [125.7625, 39.0392] },
  indonesia: { id: "IDN", qid: "Q252", name: "Indonésie", position: [106.8456, -6.2088] },
  myanmar: { id: "MMR", qid: "Q836", name: "Birmanie", position: [96.1951, 16.8661] },
  nepal: { id: "NPL", qid: "Q837", name: "Népal", position: [85.324, 27.7172] },
  pakistan: { id: "PAK", qid: "Q843", name: "Pakistan", position: [73.0479, 33.6844] },
  sriLanka: { id: "LKA", qid: "Q854", name: "Sri Lanka", position: [79.8612, 6.9271] },
  afghanistan: { id: "AFG", qid: "Q889", name: "Afghanistan", position: [69.2075, 34.5553] },
  bangladesh: { id: "BGD", qid: "Q902", name: "Bangladesh", position: [90.4125, 23.8103] },
  bhutan: { id: "BTN", qid: "Q917", name: "Bhoutan", position: [89.639, 27.4728] },
  unitedNations: { id: "UN", qid: "Q1065", name: "Organisation des Nations unies", position: [-74.006, 40.7128] },
  unesco: { id: "UNESCO", qid: "Q7809", name: "UNESCO", position: [2.3522, 48.8566] },
  who: { id: "WHO", qid: "Q7817", name: "Organisation mondiale de la Santé", position: [6.1432, 46.2044] },
  worldTradeOrganization: { id: "WTO", qid: "Q7825", name: "Organisation mondiale du commerce", position: [6.1432, 46.2044] },
  interpol: { id: "INTERPOL", qid: "Q8475", name: "Interpol", position: [4.8357, 45.764] },
  oecd: { id: "OECD", qid: "Q41550", name: "Organisation de coopération et de développement économiques", position: [2.3522, 48.8566] },
  apec: { id: "APEC", qid: "Q170481", name: "Coopération économique pour l’Asie-Pacifique", position: [103.8198, 1.3521] },
  iea: { id: "IEA", qid: "Q826700", name: "Agence internationale de l’énergie", position: [2.3522, 48.8566] },
  opcw: { id: "OPCW", qid: "Q842490", name: "Organisation pour l’interdiction des armes chimiques", position: [4.3007, 52.0705] },
} satisfies Record<string, WikidataActor>;

export const WIKIDATA_ORGANIZATIONS = [ACTORS.unesco, ACTORS.who, ACTORS.interpol, ACTORS.oecd, ACTORS.apec, ACTORS.iea, ACTORS.opcw];

function border(id: string, source: WikidataActor, target: WikidataActor): WikidataResolvedRelation {
  return { id, source, target, property: "P47", type: "geopolitique", temporalScope: "structural", title: `Frontière ${source.name}–${target.name}`, detail: `Relation de voisinage géographique (P47) résolue depuis l’export Wikidata fourni. Cette propriété peut couvrir une frontière terrestre ou maritime ; aucune période n’est fournie dans l’export.` };
}

function membership(id: string, source: WikidataActor, target: WikidataActor): WikidataResolvedRelation {
  return { id, source, target, property: "P463", type: "juridique", temporalScope: "structural", title: `Membre de ${target.name}`, detail: `Appartenance organisationnelle (P463) résolue depuis l’export Wikidata fourni. L’export ne contient pas de qualificateur de début ou de fin pour cette appartenance.` };
}

export const WIKIDATA_RESOLVED_RELATIONS: WikidataResolvedRelation[] = [
  border("wd-tur-greece-border", ACTORS.turkey, ACTORS.greece), border("wd-tur-bulgaria-border", ACTORS.turkey, ACTORS.bulgaria), border("wd-tur-azerbaijan-border", ACTORS.turkey, ACTORS.azerbaijan), border("wd-tur-georgia-border", ACTORS.turkey, ACTORS.georgia), border("wd-tur-armenia-border", ACTORS.turkey, ACTORS.armenia), border("wd-tur-iran-border", ACTORS.turkey, ACTORS.iran), border("wd-tur-iraq-border", ACTORS.turkey, ACTORS.iraq), border("wd-tur-syria-border", ACTORS.turkey, ACTORS.syria),
  border("wd-usa-canada-border", ACTORS.unitedStates, ACTORS.canada), border("wd-usa-mexico-border", ACTORS.unitedStates, ACTORS.mexico),
  border("wd-bgr-greece-border", ACTORS.bulgaria, ACTORS.greece), border("wd-bgr-romania-border", ACTORS.bulgaria, ACTORS.romania), border("wd-bgr-macedonia-border", ACTORS.bulgaria, ACTORS.northMacedonia), border("wd-bgr-serbia-border", ACTORS.bulgaria, ACTORS.serbia),
  border("wd-jpn-usa-border", ACTORS.japan, ACTORS.unitedStates), border("wd-jpn-china-border", ACTORS.japan, ACTORS.china), border("wd-jpn-russia-border", ACTORS.japan, ACTORS.russia), border("wd-jpn-taiwan-border", ACTORS.japan, ACTORS.taiwan), border("wd-jpn-korea-border", ACTORS.japan, ACTORS.southKorea), border("wd-jpn-philippines-border", ACTORS.japan, ACTORS.philippines),
  border("wd-vnm-china-border", ACTORS.vietnam, ACTORS.china), border("wd-vnm-cambodia-border", ACTORS.vietnam, ACTORS.cambodia), border("wd-vnm-laos-border", ACTORS.vietnam, ACTORS.laos), border("wd-kor-prk-border", ACTORS.southKorea, ACTORS.northKorea),
  border("wd-ind-china-border", ACTORS.india, ACTORS.china), border("wd-ind-indonesia-border", ACTORS.india, ACTORS.indonesia), border("wd-ind-myanmar-border", ACTORS.india, ACTORS.myanmar), border("wd-ind-nepal-border", ACTORS.india, ACTORS.nepal), border("wd-ind-pakistan-border", ACTORS.india, ACTORS.pakistan), border("wd-ind-srilanka-border", ACTORS.india, ACTORS.sriLanka), border("wd-ind-afghanistan-border", ACTORS.india, ACTORS.afghanistan), border("wd-ind-bangladesh-border", ACTORS.india, ACTORS.bangladesh), border("wd-ind-bhutan-border", ACTORS.india, ACTORS.bhutan),
  membership("wd-tur-un", ACTORS.turkey, ACTORS.unitedNations), membership("wd-tur-who", ACTORS.turkey, ACTORS.who), membership("wd-tur-opcw", ACTORS.turkey, ACTORS.opcw),
  membership("wd-usa-un", ACTORS.unitedStates, ACTORS.unitedNations), membership("wd-usa-wto", ACTORS.unitedStates, ACTORS.worldTradeOrganization), membership("wd-usa-oecd", ACTORS.unitedStates, ACTORS.oecd), membership("wd-usa-apec", ACTORS.unitedStates, ACTORS.apec), membership("wd-usa-iea", ACTORS.unitedStates, ACTORS.iea), membership("wd-usa-opcw", ACTORS.unitedStates, ACTORS.opcw),
  membership("wd-bgr-un", ACTORS.bulgaria, ACTORS.unitedNations), membership("wd-bgr-wto", ACTORS.bulgaria, ACTORS.worldTradeOrganization), membership("wd-bgr-who", ACTORS.bulgaria, ACTORS.who), membership("wd-bgr-opcw", ACTORS.bulgaria, ACTORS.opcw),
  membership("wd-jpn-un", ACTORS.japan, ACTORS.unitedNations), membership("wd-jpn-wto", ACTORS.japan, ACTORS.worldTradeOrganization), membership("wd-jpn-oecd", ACTORS.japan, ACTORS.oecd), membership("wd-jpn-apec", ACTORS.japan, ACTORS.apec), membership("wd-jpn-iea", ACTORS.japan, ACTORS.iea), membership("wd-jpn-opcw", ACTORS.japan, ACTORS.opcw),
  membership("wd-vnm-un", ACTORS.vietnam, ACTORS.unitedNations), membership("wd-vnm-wto", ACTORS.vietnam, ACTORS.worldTradeOrganization), membership("wd-vnm-who", ACTORS.vietnam, ACTORS.who), membership("wd-vnm-apec", ACTORS.vietnam, ACTORS.apec), membership("wd-vnm-opcw", ACTORS.vietnam, ACTORS.opcw),
  membership("wd-kor-un", ACTORS.southKorea, ACTORS.unitedNations), membership("wd-kor-wto", ACTORS.southKorea, ACTORS.worldTradeOrganization), membership("wd-kor-oecd", ACTORS.southKorea, ACTORS.oecd), membership("wd-kor-apec", ACTORS.southKorea, ACTORS.apec), membership("wd-kor-iea", ACTORS.southKorea, ACTORS.iea), membership("wd-kor-opcw", ACTORS.southKorea, ACTORS.opcw),
  membership("wd-ind-un", ACTORS.india, ACTORS.unitedNations), membership("wd-ind-wto", ACTORS.india, ACTORS.worldTradeOrganization), membership("wd-ind-opcw", ACTORS.india, ACTORS.opcw),
  membership("wd-syr-un", ACTORS.syria, ACTORS.unitedNations), membership("wd-syr-who", ACTORS.syria, ACTORS.who), membership("wd-syr-opcw", ACTORS.syria, ACTORS.opcw),
];

export function wikidataUrl(qid: string) {
  return `https://www.wikidata.org/wiki/${qid}`;
}

export function wikidataPropertyUrl(property: "P47" | "P463") {
  return `https://www.wikidata.org/wiki/Property:${property}`;
}

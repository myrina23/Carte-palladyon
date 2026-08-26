/**
 * Atlas Flux — relations résolues depuis l’export SPARQL Wikidata transmis.
 * P47 : partage une frontière, terrestre ou maritime ; P463 : membre d’une organisation.
 * L’export initial ne livrait pas les qualificateurs temporels. Les relations pour lesquelles
 * l’API Wikidata retourne P580 (début) ou P582 (fin) sont désormais datées et reliées à leur énoncé.
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
  temporalScope?: "structural";
  start?: number;
  end?: number;
  statementId?: string;
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

type MembershipQualifier = { start?: number; end?: number; statementId: string };

const MEMBERSHIP_QUALIFIERS: Record<string, MembershipQualifier> = {
  "wd-tur-un": { start: 1945, statementId: "q43$306AF85F-67DB-4223-B48F-B3ECB162C5C7" },
  "wd-tur-opcw": { start: 1997, statementId: "Q43$91A0F7BB-C35A-40DD-9F25-57790DA93D3F" },
  "wd-tur-interpol": { start: 1956, statementId: "Q43$3494F3B0-0122-49B6-B952-93F9FC2C3D6A" },
  "wd-tur-unesco": { start: 1946, statementId: "Q43$e52059b7-49e3-094c-de9f-fc8db85c0078" },
  "wd-usa-un": { start: 1945, statementId: "q30$736C3B3B-65D3-49B2-BAAF-770662D90C7B" },
  "wd-usa-apec": { start: 1989, statementId: "q30$69E94D1D-37AE-4791-A2BD-429BFC6C023D" },
  "wd-usa-opcw": { start: 1997, statementId: "q30$DEFEF6E5-FDF9-4819-BE70-3D44B81EE778" },
  "wd-usa-interpol": { start: 1923, statementId: "Q30$F2175F4D-3E51-4377-95C6-900B1B34A651" },
  "wd-usa-unesco-1": { start: 1946, end: 1984, statementId: "Q30$ffcd86ff-4e66-a822-79e0-2a404627972e" },
  "wd-usa-unesco-2": { start: 2003, end: 2018, statementId: "Q30$0D0DA1D7-FA1E-4B78-B107-E4E6C63B5626" },
  "wd-usa-unesco-3": { start: 2023, statementId: "Q30$c235421e-43a0-090e-0574-295eafda9f7d" },
  "wd-bgr-un": { start: 1955, statementId: "q219$201AF854-1B5D-4AD1-BFE3-8A35FA657195" },
  "wd-bgr-wto": { start: 1996, statementId: "q219$DC3192EE-5DB0-4297-BCBF-B4983B08B330" },
  "wd-bgr-opcw": { start: 1997, statementId: "q219$03A15A0E-BD19-418E-BAB3-4AFFB345478A" },
  "wd-bgr-interpol": { start: 1989, statementId: "Q219$5DC56E07-3FB1-46F4-99F7-C30B6E769315" },
  "wd-bgr-unesco": { start: 1956, statementId: "Q219$12732483-4eef-20f3-00b2-aae4a2040a25" },
  "wd-jpn-un": { start: 1956, statementId: "q17$5A768085-CC53-4C1A-9D3E-6252A5079513" },
  "wd-jpn-wto": { start: 1995, statementId: "q17$88143F8E-F0CD-43A1-89AA-B07E36AE0470" },
  "wd-jpn-apec": { start: 1989, statementId: "q17$D4A44A32-D35A-4BA8-88E6-B0BDE8897706" },
  "wd-jpn-opcw": { start: 1997, statementId: "q17$FB42E364-1D55-4CEF-823C-82ACDDCA8160" },
  "wd-jpn-interpol": { start: 1956, statementId: "Q17$C7135D8F-9943-43C9-8A05-7530BB754DDB" },
  "wd-jpn-unesco": { start: 1951, statementId: "Q17$33d5c312-41f4-e5d2-3fe8-a9a46682cc6e" },
  "wd-vnm-un": { start: 1977, statementId: "q881$E4758C3C-BFB8-4B83-96FD-04FF06D62949" },
  "wd-vnm-wto": { start: 2007, statementId: "q881$6B6F56C7-8644-4F5E-9648-82A9FD4F1A05" },
  "wd-vnm-apec": { start: 1998, statementId: "q881$FDD41BDE-8AE8-496D-9363-530158BF6A11" },
  "wd-vnm-opcw": { start: 1998, statementId: "Q881$A9B52F99-B09B-40FC-9D7F-7F8117213AE5" },
  "wd-vnm-interpol": { start: 1991, statementId: "Q881$95D7F3FD-4584-4376-8BBC-4C08E09D242E" },
  "wd-vnm-unesco": { start: 1951, statementId: "Q881$bbcc5690-487d-45d7-e4fb-22e3c669a97a" },
  "wd-kor-un": { start: 1991, statementId: "q884$0447AD6F-2FA8-4DD9-8D54-432DE8A8FEA7" },
  "wd-kor-wto": { start: 1995, statementId: "q884$8A7D1892-5392-4E1F-9B0F-3E32FBE17C3C" },
  "wd-kor-oecd": { start: 1996, statementId: "q884$6BC7E4FE-709F-4741-A34F-A5F2588050EF" },
  "wd-kor-apec": { start: 1989, statementId: "q884$6EC32C9A-2843-40A2-880A-90CA67D11D66" },
  "wd-kor-opcw": { start: 1997, statementId: "q884$9018A71D-6225-45E5-8969-54A78F73D8A2" },
  "wd-kor-interpol": { start: 1964, statementId: "Q884$c697bcff-47eb-b740-2cf9-0f6469947e2f" },
  "wd-kor-unesco": { start: 1950, statementId: "Q884$3dc14817-4819-a408-3b62-e8310fc86874" },
  "wd-ind-un": { start: 1945, statementId: "q668$AA06ADE0-D225-4AE2-815A-4CAEA9413FB7" },
  "wd-ind-wto": { start: 1995, statementId: "q668$A7B7F11B-C005-4486-BB87-3EB66EA43FD8" },
  "wd-ind-opcw": { start: 1997, statementId: "q668$99A6DE8E-4BAE-46E1-ADC1-CBDBF1C63906" },
  "wd-ind-interpol": { start: 1949, statementId: "Q668$586A5C46-1B34-4A3B-B5E8-1530FA6D1902" },
  "wd-ind-unesco": { start: 1946, statementId: "Q668$bedb0c53-459b-59fa-e70a-711789f345aa" },
  "wd-syr-un": { start: 1945, statementId: "q858$F2CD820A-1A88-4554-A23E-A6822F62EC54" },
  "wd-syr-opcw": { start: 2013, statementId: "q858$90937E15-CA27-453C-A46F-2FC5180BD357" },
  "wd-syr-interpol": { start: 1953, statementId: "Q858$B35690B5-8FCB-4262-ABE7-03AD9C9651B3" },
  "wd-syr-unesco": { start: 1946, statementId: "Q858$60a13136-46aa-d371-57c5-a8af970745a2" },
};

function membership(id: string, source: WikidataActor, target: WikidataActor): WikidataResolvedRelation {
  const qualifier = MEMBERSHIP_QUALIFIERS[id];
  const period = qualifier ? `${qualifier.start ?? "date inconnue"}${qualifier.end ? `–${qualifier.end}` : "–aujourd’hui"}` : "date non fournie";
  return { id, source, target, property: "P463", type: "juridique", temporalScope: qualifier ? undefined : "structural", start: qualifier?.start, end: qualifier?.end, statementId: qualifier?.statementId, title: `Membre de ${target.name}`, detail: `Appartenance organisationnelle (P463) résolue depuis Wikidata. Période qualifiée : ${period}.` };
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
  membership("wd-tur-interpol", ACTORS.turkey, ACTORS.interpol), membership("wd-tur-unesco", ACTORS.turkey, ACTORS.unesco),
  membership("wd-usa-interpol", ACTORS.unitedStates, ACTORS.interpol), membership("wd-usa-unesco-1", ACTORS.unitedStates, ACTORS.unesco), membership("wd-usa-unesco-2", ACTORS.unitedStates, ACTORS.unesco), membership("wd-usa-unesco-3", ACTORS.unitedStates, ACTORS.unesco),
  membership("wd-bgr-interpol", ACTORS.bulgaria, ACTORS.interpol), membership("wd-bgr-unesco", ACTORS.bulgaria, ACTORS.unesco),
  membership("wd-jpn-interpol", ACTORS.japan, ACTORS.interpol), membership("wd-jpn-unesco", ACTORS.japan, ACTORS.unesco),
  membership("wd-vnm-interpol", ACTORS.vietnam, ACTORS.interpol), membership("wd-vnm-unesco", ACTORS.vietnam, ACTORS.unesco),
  membership("wd-kor-interpol", ACTORS.southKorea, ACTORS.interpol), membership("wd-kor-unesco", ACTORS.southKorea, ACTORS.unesco),
  membership("wd-ind-interpol", ACTORS.india, ACTORS.interpol), membership("wd-ind-unesco", ACTORS.india, ACTORS.unesco),
  membership("wd-syr-interpol", ACTORS.syria, ACTORS.interpol), membership("wd-syr-unesco", ACTORS.syria, ACTORS.unesco),
];

export function wikidataUrl(qid: string) {
  return `https://www.wikidata.org/wiki/${qid}`;
}

export function wikidataPropertyUrl(property: "P47" | "P463") {
  return `https://www.wikidata.org/wiki/Property:${property}`;
}

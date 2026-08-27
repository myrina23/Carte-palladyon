# Atlas Flux — état de maturité et passage à l’enrichissement de données

**Objet.** Ce document fait un point de situation franc après la consolidation des consignes. Il différencie le **socle applicatif réellement construit**, les éléments **fonctionnels mais alimentés par des jeux de données partiels**, et les chantiers qui restent à conduire avant de qualifier Atlas Flux comme un observatoire factuel complet.

> **Conclusion courte :** le projet n’est pas à 10 %. Son **socle produit** est bien avancé ; son **corpus factuel et son dispositif de maintenance de données** sont encore à construire. C’est précisément le bon moment pour passer à l’enrichissement, d’abord par un pilote vérifiable, puis par des imports versionnés.

## 1. Mesure de maturité — estimation transparente

L’estimation suivante n’est pas une mesure contractuelle. Elle sépare volontairement l’interface et les interactions, déjà travaillées, de la couverture factuelle, qui demeure le principal enjeu.

| Domaine pondéré | Poids | État estimé | Justification |
| --- | ---: | ---: | --- |
| Interface, navigation et design | 25 % | 90 % | Carte nocturne, panneaux, Dock, recherche, filtres, fiches et comportement mobile sont implémentés et vérifiés visuellement. |
| Interactions cartographiques | 20 % | 90 % | Sélection, focus, couches, relations, 2D/Globe/Tac, comparaison et Timeline sont fonctionnels dans le périmètre de test. |
| Modèle de données et fonctions d’analyse | 15 % | 70 % | La structure d’acteurs, relations, périodes, exports, collections et propositions est en place, mais le modèle doit être éprouvé sur un volume factuel supérieur. |
| Couverture de données factuelles | 20 % | 35 % | UCDP, Wikidata, Natural Earth et indicateurs contextuels sont présents par extraits ou sous-ensembles ; le réseau complet de relations sourcées n’est pas encore constitué. |
| Mise à jour, contrôle qualité et traçabilité | 10 % | 15 % | Les sources et millésimes sont identifiés, mais l’import automatisé, les règles de validation et le versionnage de production restent à faire. |
| Recette métier et exploitation | 10 % | 70 % | Tests TypeScript/Vitest, contrôles bureau/mobile et exports existent ; une recette analyste sur de vrais cas n’a pas encore été menée. |
| **Maturité globale pondérée** | **100 %** | **≈ 66,5 %** | Le calcul reflète un produit déjà structuré, mais non encore enrichi à l’échelle factuelle attendue. |

## 2. Ce qui est terminé ou très proche d’un état fini

Les éléments suivants ont été décidés, implémentés puis contrôlés. Ils constituent le socle à ne plus redéfinir pendant l’enrichissement, sauf retour d’usage précis.

| Bloc | État | Ce qui est effectivement en place |
| --- | --- | --- |
| Carte mondiale | Terminé pour le socle | Deck.gl et MapLibre, fond Natural Earth, cartes 2D, Globe et Tactique, flux, nœuds, chaleur de conflit et mise en évidence d’acteurs. |
| Direction visuelle | Terminé pour le socle | Thème bleu ardoise nocturne, flux cyan, couleurs sémantiques, verre dépoli et thème clair/sombre. |
| Commandes | Terminé pour le socle | Filtres à gauche, recherche prédictive centrée, œil indépendant, toggles Apple, Dock d’actions et contrôles de projection. |
| Recherche et acteurs | Terminé pour le socle | Pays, territoires, organisations, zones, synonymes multilingues et drapeaux ou marqueurs territoriaux. |
| Temporalité | Terminé pour le socle | Plage DE/À, dates JJ/MM/AAAA, calendrier, molettes, deux poignées, Timeline compacte et mode plein écran. |
| Fiches | Terminé pour le socle | Fiches pays, organisations et relations ; sources intégrées à la fiche, compteur de sources, liens Wikipédia/officiels lorsque disponibles. |
| Comparaison | Terminé pour le socle | Sélection directe de deux acteurs, comparaison bilatérale, historique, vue temporelle A/B et drapeaux. |
| Exports et relevés | Terminé pour le socle | PDF/CSV de fiches, rapports, instantané de carte, relevés, collections privées ou partagées et partage. |
| Contribution | Terminé pour le socle | Proposition d’une relation sourcée et workflow de validation administrateur. |
| Qualité technique | Validé au périmètre actuel | Compilation TypeScript et **17 tests Vitest** ; contrôles bureau/mobile, dont Timeline plein écran. |

## 3. Ce qui est fonctionnel mais encore partiel

Ces éléments ne sont pas des échecs. Ils constituent les parties de l’application prêtes à recevoir les vraies données, mais leur couverture doit maintenant être étendue et contrôlée.

| Bloc | État actuel | Ce qui manque pour le considérer abouti |
| --- | --- | --- |
| Relations géopolitiques | Sous-ensemble Wikidata et corpus démonstratif explicitement distingué | Construire un catalogue factuel de relations, avec source, type, acteurs, date de début, date de fin, précision et statut éditorial. |
| Conflits | Extrait UCDP GED 2020–2025 et filtres de gravité | Importer un millésime complet ciblé, mapper les identifiants d’acteurs et agréger les événements sans perdre la source et la date. |
| Acteurs et territoires | Couverture géographique et recherche prêtes | Vérifier et compléter les QID, codes, aliases, drapeaux, sources officielles et coordonnées pour les unités retenues. |
| Indicateurs de fiche | Contexte économique disponible dans le modèle | Définir pour chaque indicateur la source, le millésime, la fréquence, le champ et le comportement en cas de donnée absente. |
| Sources dans les fiches | Présentation et compteur en place | Normaliser les métadonnées de citation : éditeur, titre, URL, date de consultation, licence, périmètre et niveau de confiance. |
| Validation administrateur | Interface et procédures prévues | Définir une grille éditoriale, un statut de revue, une journalisation des décisions et une procédure de correction. |

## 4. Ce qui reste à engager

Le travail restant n’est plus principalement du design. Il concerne la **qualité, la couverture et l’exploitation fiable des données**.

| Priorité | Chantier | Résultat attendu |
| --- | --- | --- |
| Haute | Référentiel de relations factuelles | Chaque relation affichée possède acteurs normalisés, typologie, source primaire ou institutionnelle, URL, période, niveau de confiance et statut de revue. |
| Haute | Pipeline d’import et versionnage | Les imports UCDP, Wikidata et indicateurs produisent un lot daté, réversible et documenté, sans écraser silencieusement le précédent. |
| Haute | Tests de données | Contrôles d’identifiants, doublons, périodes invalides, URLs, typologies, sources obligatoires et cohérence géographique. |
| Haute | Recette analyste | Une liste de cas d’usage métier valide recherche, filtre, carte, fiche, comparaison et export sur des données factuelles. |
| Moyenne | Sources homogènes partout | Étendre le registre de sources intégré au comparateur, aux relevés et aux collections. |
| Moyenne | Fraîcheur des données | Définir fréquence, responsable, méthode de rafraîchissement et message de millésime visible dans les fiches et exports. |
| Basse | Accélérateurs d’usage | Raccourcis Dock, favoris, presets de filtres et configuration personnelle. |

## 5. Passage recommandé à l’enrichissement réel : un pilote plutôt qu’un import massif

Il est déconseillé d’importer immédiatement toutes les relations disponibles. L’interface est prête, mais il faut d’abord valider le **contrat de données** sur un échantillon professionnel. Ce pilote doit permettre de prouver de bout en bout : import, normalisation, affichage cartographique, filtre, fiche, source, comparaison et export.

### Lot pilote 1 — conflits et relations vérifiables

| Étape | Contenu | Critère de réussite |
| --- | --- | --- |
| 1. Choisir un périmètre | Sélectionner 8 à 12 acteurs et 3 à 5 organisations, avec 3 à 4 typologies prioritaires. | Périmètre validé, sans ambiguïté d’acteur ou de territoire. |
| 2. Importer UCDP | Charger un lot UCDP GED millésimé pour les zones retenues, en conservant identifiants, dates, coordonnées, fatalités et provenance. | Les événements s’affichent avec période et gravité correctes. |
| 3. Enrichir Wikidata | Résoudre QID, aliases, organisations, frontières ou appartenances pertinentes et qualificateurs temporels lorsque disponibles. | Les acteurs sont dédupliqués et recherchables dans les langues prévues. |
| 4. Ajouter des relations éditoriales | Insérer des relations factuelles sélectionnées, chacune accompagnée d’une source vérifiable et d’un statut de revue. | La fiche et l’export présentent des sources correctes et cliquables. |
| 5. Recette complète | Tester recherche → focus → typologie → Timeline → fiche → comparaison → PDF/CSV. | Aucun acteur, lien ou export ne présente une source absente ou une période incohérente. |

La source UCDP propose des versions téléchargeables, des codebooks et un accès API ; GED est le bon point de départ pour les événements géocodés à l’échelle du jour et du lieu.[1] Wikidata dispose d’un service SPARQL approprié pour enrichir des identifiants et déclarations structurées, mais les résultats doivent être validés au regard de leurs sources.[2] Natural Earth demeure adapté au fond géographique et existe à plusieurs niveaux de détail.[3]

### Choix de périmètre à trancher avant l’import

Pour que l’enrichissement soit réellement utile, la prochaine décision doit porter sur **le premier dossier géopolitique**, et non sur la technologie. Trois options cohérentes sont possibles :

| Option | Périmètre | Intérêt pour le pilote |
| --- | --- | --- |
| A. Conflits et zones chaudes | UCDP, conflits récents, acteurs étatiques et non étatiques | Valide la chaleur, la gravité, la Timeline et la carte tactique. |
| B. Relations européennes | États européens, UE, OTAN, organisations régionales | Valide les relations institutionnelles, les organisations et la comparaison. |
| C. Relations stratégiques mondiales | 8–12 grandes puissances et organisations multilatérales | Valide les typologies militaire, économique, diplomatique et technologique à l’échelle monde. |

## 6. Décision recommandée

Le plus rationnel est de commencer par **l’option A**, complétée par quelques relations interétatiques et institutionnelles de l’option C. Cette combinaison éprouve immédiatement la carte de chaleur, le filtre de gravité, les dates et les sources — c’est-à-dire les zones où les données réelles apportent le plus de valeur par rapport à l’interface déjà construite.

Une fois ce pilote validé, l’import peut être étendu par lots, en conservant à chaque étape un millésime, un journal de transformation et une recette exportable.

## Références

[1]: https://ucdp.uu.se/downloads/ "UCDP Dataset Download Center"
[2]: https://query.wikidata.org/ "Wikidata Query Service"
[3]: https://www.naturalearthdata.com/downloads/ "Natural Earth Downloads"

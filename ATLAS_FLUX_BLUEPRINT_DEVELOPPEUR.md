# Atlas Flux — Blueprint de mise en œuvre pour développeur

**Version de passation :** 2026-08-27  
**Projet :** Atlas Flux, observatoire géopolitique mondial  
**Objet :** fournir un plan technique actionnable pour passer d’un socle cartographique riche à un produit alimenté par des données factuelles, traçables et maintenables.

> **Principe directeur.** Ne pas réinventer l’interface ni remplacer les parcours déjà validés. Le chantier prioritaire est la **donnée factuelle**, sa qualité, son cycle de vie et sa restitution fiable dans les fonctions existantes.

## 1. Périmètre et résultat attendu

Atlas Flux doit permettre l’exploration mondiale des relations géopolitiques entre pays, territoires, organisations et zones. L’utilisateur cherche ou sélectionne un acteur, filtre des typologies de liens, utilise la période DE/À, visualise les flux et conflits, lit une fiche sourcée, compare deux acteurs ou deux périodes, puis exporte sa lecture.

Le résultat attendu n’est pas un simple import massif. Chaque élément affiché doit être **reproductible** : acteur normalisé, relation typée, période, source, millésime du lot, statut éditorial et test de cohérence.

| En place à préserver | À mettre en œuvre |
| --- | --- |
| React 19, TypeScript, Vite, deck.gl, MapLibre, tRPC, Drizzle/MySQL, Manus OAuth | Référentiel d’acteurs et relations factuelles versionné |
| 2D, Globe, Tac, chaleur UCDP, recherche multilingue, filtres et Timeline | Import/staging/validation/normalisation de sources |
| Fiches, comparaison, exports PDF/CSV, collections et contribution | API de lecture de données réelles, tests qualité et recette métier |
| Dock, Switch, Slider, Popover, MorphingPopover, ScrollArea issus de l’intégration Palladyon | Fraîcheur, provenance homogène, observabilité et publication de lots |

## 2. Contraintes non négociables

### 2.1 Décisions UX/UI à ne pas annuler

| Sujet | Règle à conserver |
| --- | --- |
| Carte | Échelle monde avec pays, territoires, îles, dépendances et organisations. |
| Vues | Trois commandes dans Filtres principaux : **2D**, **Globe**, **Tac**. Aucune barre latérale de vues. |
| Recherche | Centrée ; prédictive, sans limite arbitraire de résultats, synonymes multilingues, drapeaux ou marqueurs territoriaux. |
| Filtres | Panneau à gauche, œil indépendant, régions + organisations + typologies dans un même panneau. Choix multiples. |
| Typologies | Couleur cohérente du trait, de la flèche, de l’infobulle et de la fiche. L’état est porté par un toggle/opacité, jamais par « actif ». |
| Temporalité | Une piste continue DE/À à deux poignées. Clic Timeline = calendrier et molettes. Mode plein écran sur petit écran. |
| Fiches | Une seule fiche visible. Les sources et leur compteur sont dans la fiche, sans encart flottant externe. |
| Comparaison | Deux clics d’acteurs sélectionnent A/B ; un troisième clic conduit à B/C. La comparaison temporelle A/B est un autre parcours. |
| Style | Bleu ardoise nocturne, surfaces verre dépoli, Cyan `#20C4D9` pour données/liens, Teal `#008C95` pour activation, Corail `#D95D4E` pour risque/conflit uniquement. |
| Accessibilité | Focus visible, navigation clavier, intitulés accessibles, contrastes vérifiés, cibles tactiles mobiles. |

### 2.2 Contraintes de code et d’infrastructure

Le frontend est prioritaire. Ne pas modifier `server/_core`. Toute évolution de base suit l’ordre : **schéma Drizzle → migration générée → SQL appliqué → helper DB → procédure tRPC → UI → test Vitest**. Les fichiers de médias ne vont pas dans `client/public` ni `client/src/assets`. Le dernier checkpoint est la référence du ZIP téléchargeable.

| Commande | Usage |
| --- | --- |
| `pnpm check` | Compilation TypeScript sans émission. |
| `pnpm test` | Suite Vitest à exécuter à chaque lot. |
| `pnpm drizzle-kit generate` | Générer la migration après modification de `drizzle/schema.ts`. |
| `pnpm db:push` | À éviter pour les lots critiques si une migration SQL contrôlée est requise ; privilégier la migration générée et appliquée explicitement. |

## 3. Architecture actuelle et extension cible

### 3.1 Architecture existante

```text
client/src/pages/Home.tsx         Carte, état d’exploration, couches deck.gl, fiches, Timeline, exports
client/src/pages/*.css            Scène cartographique et surcharges Palladyon
client/src/components/ui          Primitives Radix/Palladyon adaptées
client/src/components/palladyon   Dock et MorphingPopover Atlas Flux
client/src/data                   Corpus locaux Wikidata/UCDP actuels
client/src/lib/atlasExports.ts    Exports cartographiques et rapports
drizzle/schema.ts                 Utilisateurs, propositions et collections
server/db.ts                      Helpers Drizzle
server/routers.ts                 Contrats tRPC
server/*.test.ts                  Tests métier et structure UI
```

Le composant `Home.tsx` est aujourd’hui un composant d’orchestration dense. Ne pas le réécrire intégralement pendant le premier import. Extraire progressivement les accès aux données et les panneaux dans des modules ciblés, après couverture de test.

### 3.2 Architecture cible recommandée

```text
sources officielles
  ├─ UCDP GED / conflict-year / actor data
  ├─ Wikidata Query Service (QID, aliases, qualifications)
  ├─ Natural Earth (géométrie et unités)
  └─ indicateurs institutionnels choisis
          ↓
scripts/imports/*.mjs (téléchargement contrôlé, staging, hash, journal)
          ↓
tables dataImportBatches + staging + tables publiées
          ↓
server/db/atlas*.ts (requêtes optimisées)
          ↓
server/routers/atlas.ts (tRPC public/protected/admin)
          ↓
client/src/features/atlas/* (adaptateurs de données pour DeckGL et fiches)
          ↓
Home.tsx (composition et interactions déjà validées)
```

## 4. Modèle de données cible

Les tables actuelles `relationProposals`, `snapshotCollections` et `snapshotCollectionItems` sont à conserver. Elles gèrent la contribution et les relevés, mais ne doivent pas devenir le référentiel publié de données factuelles.

### 4.1 Tables publiées

| Table | Colonnes minimales | Rôle |
| --- | --- | --- |
| `actors` | `id`, `canonicalName`, `actorType`, `iso2`, `iso3`, `wikidataQid`, `latitude`, `longitude`, `geometryRef`, `isActive`, timestamps | Identité canonique des États, territoires, organisations et zones. |
| `actorAliases` | `id`, `actorId`, `label`, `languageCode`, `normalizedLabel`, `aliasType` | Recherche multilingue et synonymes. Indexer `normalizedLabel`. |
| `relations` | `id`, `sourceActorId`, `targetActorId`, `relationType`, `title`, `summary`, `startDate`, `endDate`, `precision`, `confidence`, `editorialStatus`, `isDirectional`, timestamps | Relation publiable et visualisable. |
| `relationSources` | `id`, `relationId`, `sourcePublisher`, `sourceTitle`, `sourceUrl`, `publicationDate`, `accessedAt`, `license`, `excerpt`, `sourceTier` | Provenance des relations. Une relation publiée doit posséder au moins une ligne. |
| `conflictEvents` | `id`, `externalEventId`, `batchId`, `eventDate`, `latitude`, `longitude`, `countryActorId`, `sideAActorId`, `sideBActorId`, `fatalitiesBest`, `eventType`, `sourceUrl`, `rawHash` | Événements UCDP géocodés. |
| `conflictAggregates` | `id`, `batchId`, `actorId`, `periodStart`, `periodEnd`, `eventCount`, `fatalitiesBest`, `geometryCell`, `methodVersion` | Lectures rapides pour carte de chaleur et fiches. |
| `actorIndicators` | `id`, `actorId`, `indicatorCode`, `value`, `unit`, `periodDate`, `sourceUrl`, `batchId` | Indicateurs de fiche, non destinés à devenir des calques principaux. |
| `dataImportBatches` | `id`, `dataset`, `datasetVersion`, `sourceUrl`, `downloadedAt`, `publishedAt`, `license`, `checksum`, `transformVersion`, `status`, `notes` | Traçabilité, reprise et rollback logique des imports. |
| `dataValidationIssues` | `id`, `batchId`, `severity`, `entityType`, `entityKey`, `ruleCode`, `message`, `resolvedAt`, `resolvedBy` | Journal des erreurs de qualité à traiter avant publication. |

### 4.2 Contraintes d’intégrité indispensables

| Règle | Implémentation |
| --- | --- |
| Déduplication d’acteurs | Unicité `wikidataQid` lorsque renseigné ; unicité contrôlée sur `(actorType, iso3)` pour les États/territoires ; revue manuelle des autres cas. |
| Déduplication de relations | Clé fonctionnelle `(sourceActorId, targetActorId, relationType, startDate, endDate, title normalisé)` ; pour une relation non directionnelle, trier les deux identifiants avant comparaison. |
| Dates | `startDate <= endDate` lorsque `endDate` existe ; stocker une précision `day|month|year|unknown` pour ne jamais inventer une date. |
| Source obligatoire | `editorialStatus = published` interdit sans `relationSources`. |
| Liens | URL HTTPS valide ; domaine/publisher et date de consultation exigés pour les sources externes. |
| Contrat de type | `relationType` est un enum partagé avec les typologies front-end. Toute nouvelle valeur implique couleur, libellé, filtre, légende, export et test. |
| Imports | Aucun import ne modifie silencieusement un batch publié : créer un nouveau lot, valider, puis changer le lot actif. |

### 4.3 États éditoriaux recommandés

```text
draft → pending_review → approved → published → superseded / archived
```

Les propositions des utilisateurs restent dans `relationProposals`. Lorsqu’un administrateur approuve une proposition, créer ou mettre à jour une relation dans le référentiel publié avec une journalisation de la décision. Ne pas lier directement l’interface publique à des propositions `pending`.

## 5. Pipeline d’import et de publication

### 5.1 Convention de dossiers

```text
scripts/
  imports/
    download-ucdp.mjs
    import-ucdp-ged.mjs
    import-wikidata-actors.mjs
    import-wikidata-relations.mjs
    validate-atlas-batch.mjs
    publish-atlas-batch.mjs
  fixtures/
    atlas-pilot/*.json
docs/
  data-contracts.md
  mapping-decisions.md
```

Les scripts doivent être en `.mjs`, ne doivent jamais contenir de secret et doivent accepter `--batch`, `--dry-run`, `--input` et `--limit` lorsque cela a du sens. Chaque script écrit un journal lisible et retourne un code non nul si une règle bloquante échoue.

### 5.2 Cycle de vie d’un lot

| Étape | Action | Sortie obligatoire |
| --- | --- | --- |
| Acquisition | Télécharger uniquement depuis une URL officielle et conserver l’URL, la version et le checksum. | Ligne `dataImportBatches` au statut `staging`. |
| Staging | Parser le fichier sans publication ; conserver les champs bruts indispensables et un hash de ligne. | Comptage de lignes, erreurs de parsing, échantillon de contrôle. |
| Normalisation | Résoudre QID/ISO/alias, types, dates, géométrie, unités et source. | Enregistrements canoniques et rapports de correspondance ambiguë. |
| Validation | Exécuter les règles bloquantes et les règles d’alerte. | Lignes `dataValidationIssues` et rapport par gravité. |
| Revue | Un administrateur vérifie les ambiguïtés, les sources et l’échantillon cartographique. | Décision tracée et batch approuvé ou rejeté. |
| Publication | Déclarer le batch actif dans une transaction, invalider les caches, créer un checkpoint. | Version affichable dans l’interface et les exports. |
| Repli | Revenir au batch actif précédent sans suppression de l’historique. | Date, motif et opérateur enregistrés. |

### 5.3 Imports prioritaires

1. **UCDP GED piloté.** Utiliser GED pour les événements géocodés, leurs dates et les fatalités ; charger d’abord un périmètre limité et conserver le codebook/millésime.[1]
2. **Wikidata acteurs/aliases.** Résoudre QID, noms, aliases, appartenance organisationnelle et qualifications temporelles. Ne publier que des relations dont le sens analytique a été contrôlé.[2]
3. **Natural Earth.** Maintenir un millésime explicite pour les contours et unités, avec une table de correspondance entre identifiants Natural Earth, ISO et QID.[3]
4. **Indicateurs.** N’ajouter les indicateurs économiques ou démographiques qu’après définition du fournisseur, de la fréquence et de la licence.

## 6. API tRPC et cache de lecture

Créer des sous-routeurs plutôt que d’augmenter indéfiniment `server/routers.ts` : `server/routers/atlasActors.ts`, `atlasRelations.ts`, `atlasConflicts.ts`, `atlasDataAdmin.ts`.

| Procédure | Entrée | Sortie / règle |
| --- | --- | --- |
| `atlas.searchActors` | `query`, `locale`, filtres de type | Acteurs, aliases correspondants, drapeau/marker, coordonnées et score. |
| `atlas.getActorDetail` | `actorId`, période | Fiche, indicateurs versionnés, relations agrégées, sources et millésime. |
| `atlas.getRelations` | acteurs/régions/types/période | Relations publiées, géométries utiles à deck.gl, source count et flags de précision. |
| `atlas.getConflictHeat` | bbox, période, gravité, niveau d’agrégation | Agrégats UCDP, pas les lignes brutes inutiles pour la vue. |
| `atlas.getComparison` | `actorA`, `actorB`, période A/B | Relations, chronologie, indicateurs et sources de comparaison. |
| `atlas.getDataVersion` | aucun | Millésimes actifs, date d’import et avertissement de fraîcheur. |
| `atlasAdmin.stageImport` | lot et options | Admin uniquement ; aucun accès public aux données de staging. |
| `atlasAdmin.validateBatch` | `batchId` | Rapport de contrôle qualité. |
| `atlasAdmin.publishBatch` | `batchId` | Admin uniquement ; transaction de publication et journal d’audit. |

Les procédures de carte doivent accepter une période et une boîte englobante. Les payloads Deck.gl ne doivent pas renvoyer de texte de source détaillé pour chaque arc : transmettre un identifiant et charger le détail seulement au clic ou au survol persistant.

## 7. Lots de travail, dépendances et critères d’acceptation

### Lot 0 — Gel du contrat UX et des tests existants

**Objectif :** sécuriser la non-régression de la carte et des parcours actuels.

| À faire | Critère d’acceptation |
| --- | --- |
| Relever les règles du référentiel dans `docs/data-contracts.md`. | Les choix supprimés sont explicitement listés : pas de sidebar de vues, pas de fiche externe, pas de sources hors fiche. |
| Séparer les adaptateurs de données de `Home.tsx` sans réécrire l’interface. | Le rendu actuel reste identique avec les corpus locaux. |
| Ajouter tests de contrat autour des selectors et des types d’API. | `pnpm check` et `pnpm test` restent verts avant tout import. |

### Lot 1 — Schéma, migrations et référentiel minimal

**Objectif :** pouvoir stocker et lire les données factuelles de façon versionnée.

| À faire | Critère d’acceptation |
| --- | --- |
| Ajouter les tables `actors`, `actorAliases`, `relations`, `relationSources`, `dataImportBatches`, `dataValidationIssues`. | Migration générée, lue, appliquée ; aucune table existante cassée. |
| Mettre en place contraintes, index de recherche et index de période. | Requêtes sur acteur/type/période sans scan non maîtrisé sur le lot pilote. |
| Créer helpers Drizzle et procédures tRPC de lecture. | Un acteur et une relation publiés sont retournés avec leurs sources et le millésime. |
| Écrire fixtures factuelles minimales et tests. | Relation sans source ou période invalide refusée. |

### Lot 2 — Pilote UCDP, chaleur et Timeline

**Objectif :** démontrer que la donnée événementielle réelle alimente la carte sans perdre la provenance.

| À faire | Critère d’acceptation |
| --- | --- |
| Importer un lot UCDP GED limité, daté et documenté. | Chaque événement stocke ID externe, lot, date, coordonnées, fatalités et URL/source. |
| Produire les agrégats de chaleur par période et cellule. | Le filtre de gravité modifie réellement les cellules/cartes de chaleur. |
| Connecter la Timeline aux requêtes UCDP. | Modifier DE/À actualise les événements et les chiffres de fiche. |
| Tester les limites de période et l’absence de données. | Les états vides sont explicitement rendus sans erreur ni données inventées. |

### Lot 3 — Acteurs, aliases et relations Wikidata revues

**Objectif :** rendre les acteurs recherchables et les relations factuelles éditables.

| À faire | Critère d’acceptation |
| --- | --- |
| Importer acteurs, QID, aliases et propriétés nécessaires depuis Wikidata. | Recherche multilingue retrouve un acteur par nom canonique ou alias prévu. |
| Définir la table de mapping propriété Wikidata → typologie Atlas Flux. | Aucune propriété ne devient relation publique sans mapping approuvé. |
| Ajouter les qualifications temporelles disponibles. | La période est affichée avec son niveau de précision. |
| Réconcilier les ambiguïtés dans un fichier de décisions versionné. | Les choix de mapping sont rejouables et documentés. |

### Lot 4 — Sources, éditorial et contribution

**Objectif :** rendre toute relation lisible et révisable.

| À faire | Critère d’acceptation |
| --- | --- |
| Normaliser les `relationSources`. | La fiche, le comparateur et les exports affichent publisher, titre, URL et millésime. |
| Convertir les propositions approuvées en relations éditoriales. | Aucune proposition `pending` n’apparaît publiquement. |
| Créer une grille de revue et journaliser les décisions. | Relecteur, date, note et statut sont retrouvables. |

### Lot 5 — Comparateur, exports et collections sur données réelles

**Objectif :** garantir que les outils analytiques ne continuent pas à exporter un mélange ambigu de démonstration et de réel.

| À faire | Critère d’acceptation |
| --- | --- |
| Adapter comparateur et A/B aux nouvelles API. | Les deux périodes et deux acteurs affichent leurs millésimes et sources. |
| Mettre le millésime du lot dans PDF/CSV/snapshot. | Tout export cite données, période, filtres et date de génération. |
| Ajouter source register dans collections/relevés. | Restaurer un relevé reconstitue le contexte et le millésime utilisé. |

### Lot 6 — Performance, recette et publication

**Objectif :** livrer un produit exploitable au-delà du pilote.

| À faire | Critère d’acceptation |
| --- | --- |
| Paginer/agréger les requêtes lourdes et protéger les plages très vastes. | Pas de gel perceptible lors d’un changement de filtre sur le périmètre pilote. |
| Ajouter logs métier sur import/publication. | Un échec est diagnostiquable sans lire un dump complet. |
| Réaliser recette d’analyste avec cas documentés. | Recherche, focus, filtre, Timeline, fiche, comparaison, PDF/CSV et collection validés. |
| Créer checkpoint et contrôler le ZIP. | L’archive contient `EXPORT_MANIFEST.md`, le code courant et pas l’ancienne maquette. |

## 8. Plan de tests obligatoire

| Niveau | Tests minimaux |
| --- | --- |
| Unitaires | Normalisation d’alias, mapping de typologie, règles de dates, déduplication, URLs, calcul d’agrégat et formatage des citations. |
| Intégration DB | Import staging, publication atomique, rollback de batch, relations sans source refusées, droits admin. |
| API tRPC | Filtres acteurs/types/période, recherche multilingue, source count, pagination, erreur d’autorisation. |
| UI structure | Panneau filtres, Timeline DE/À, une fiche unique, sources dans la fiche, Dock, switch/slider/popover/scrollarea. |
| Parcours navigateur | Recherche → sélection → Timeline → relation → sources → export ; comparaison A/B ; mobile Timeline plein écran. |
| Données | Taux de QID manquants, doublons, relations sans source, dates incohérentes, événements sans coordonnées, acteurs sans géométrie. |

Le seuil de publication doit inclure : TypeScript sans erreur, Vitest vert, zéro erreur bloquante de validation de batch, revue manuelle d’un échantillon cartographique et génération PDF/CSV à partir de données réelles.

## 9. Définition de « terminé »

Une typologie, un acteur ou une relation ne peut être considérée comme terminée que si les conditions ci-dessous sont toutes vraies.

| Élément | Définition de terminé |
| --- | --- |
| Acteur | Identifiant canonique, type, nom, aliases nécessaires, coordonnées/géométrie, source et millésime. |
| Relation | Deux acteurs valides, type Atlas Flux, source(s), période/précision, direction si applicable, statut publié et test. |
| Conflit | Événement/agrégat UCDP versionné, coordonnées, période, fatalités, méthode d’agrégation et source. |
| Fiche | Sources intégrées, compteur exact, contraste lisible, liens cliquables et export cohérent. |
| Export | Carte visible réellement capturée ; filtres, période, sources et millésime présents. |
| Import | Batch traçable, règles validées, erreurs journalisées, revue effectuée, publication réversible. |

## 10. Premier sprint recommandé

Ne pas engager plusieurs sources à la fois. Commencer par un **pilote UCDP GED + 8 à 12 acteurs normalisés + 3 à 5 organisations + 3 à 4 typologies**. Le périmètre final doit être choisi par la maîtrise d’ouvrage parmi : conflits/zones chaudes, relations européennes ou relations stratégiques mondiales.

Le premier sprint doit se terminer par une démonstration complète : sélectionner un acteur, filtrer une relation, choisir une période, afficher les événements/couches, ouvrir une fiche avec sources, comparer deux acteurs et exporter une lecture avec le millésime du lot. Tant que cette démonstration n’est pas fiable, ne pas importer l’ensemble du monde.

## 11. Références de données

Le développeur doit conserver les licences, millésimes, codebooks et liens de téléchargement dans chaque `dataImportBatches` et export final.

[1]: https://ucdp.uu.se/downloads/ "UCDP Dataset Download Center"
[2]: https://query.wikidata.org/ "Wikidata Query Service"
[3]: https://www.naturalearthdata.com/downloads/ "Natural Earth Downloads"

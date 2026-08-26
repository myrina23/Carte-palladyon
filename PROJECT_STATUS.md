# Atlas Flux — bilan d’avancement

## État du projet

Atlas Flux est désormais un **observatoire géopolitique mondial interactif** construit en React, deck.gl et MapLibre. La version active privilégie une carte nocturne bleu ardoise, des flux lumineux et des surfaces de type verre dépoli. Le dernier point de contrôle inclut un manifeste d’export afin d’identifier clairement le projet dans tout ZIP téléchargé.

## Réalisations fonctionnelles

| Domaine | Livré | État |
| --- | --- | --- |
| Cartographie | Carte mondiale Natural Earth, base MapLibre dédiée, relations deck.gl, vues 2D, Globe et Tactique | Opérationnel |
| Exploration | Recherche prédictive multilingue, drapeaux, territoires, organisations, focus cartographique et sélection par clic | Opérationnel |
| Filtres | Régions, organisations, typologies multi-sélection, gravité UCDP, panneau masquable et couleurs sémantiques | Opérationnel |
| Temporalité | Période DE/À, calendrier, molettes, Slider à deux poignées et mode Timeline plein écran | Opérationnel |
| Fiches | Pays, territoires, organisations et relations ; compteur de sources et références intégrées à la fiche | Opérationnel |
| Comparaison | Sélection de deux acteurs, historique bilatéral, vue A/B synchronisée et exports | Opérationnel |
| Exports | Instantané cartographique PDF, fiches PDF/CSV et rapport bilatéral PDF/CSV | Opérationnel |
| Collections | Relevés nommés, collections privées ou partagées, restauration et suppression propriétaire | Opérationnel |
| Contribution | Proposition de relation sourcée avec workflow de revue administrateur | Opérationnel |

## Données et provenance

| Jeu de données | Usage actuel | Point de vigilance |
| --- | --- | --- |
| Wikidata P47 / P463 | Relations structurelles, URI d’acteurs et qualificatifs temporels quand disponibles | Étendre progressivement le corpus vérifié par source éditoriale |
| UCDP GED 2020–2025 | Cellules de conflit, intensité, gravité et contexte des fiches | Conserver la date et le périmètre de chaque extraction |
| Natural Earth | Contours, territoires et repères mondiaux | Actualiser lors d’un changement de millésime géographique |
| Banque mondiale | Indicateurs contextuels des fiches pays | Prévoir des états de repli si la source n’est pas disponible |

## Interface et accessibilité

La navigation n’utilise plus une barre d’actions classique : un **Dock Palladyon** regroupe les actions globales. Les relations s’ouvrent dans une fiche unique avec animation MorphingPopover et les listes de sources sont limitées par un ScrollArea vitré. Les éléments de contrôle conservent un libellé accessible, des cibles tactiles mobiles et un contraste renforcé entre texte principal, secondaire et fond bleu-verre.

## Validations réalisées

La compilation TypeScript est validée. La suite Vitest compte **17 tests** couvrant les exports, les collections, les propositions, les structures UI et les primitives Palladyon. Les vues bureau et mobile ont été contrôlées, y compris l’ouverture et la fermeture automatisées de la Timeline plein écran. L’archive source locale contient `EXPORT_MANIFEST.md`, `Home.tsx`, les données Wikidata et les données UCDP, sans ancienne maquette Atlas Connect / `carte-deckgl`.

## Chantiers à poursuivre

| Priorité | Suite recommandée | Motif |
| --- | --- | --- |
| Haute | Remplacer le corpus démonstratif résiduel par un référentiel relationnel entièrement sourcé et revu | Passer de l’exploration de prototype à l’analyse factuelle | 
| Haute | Mettre en place une politique de rafraîchissement et de versionnage des données UCDP, Wikidata et Banque mondiale | Maintenir la fraîcheur et la traçabilité | 
| Moyenne | Faire une recette utilisateur des interactions carte, fiches, Timeline et exports sur des cas d’usage métier | Identifier les parcours à simplifier avant élargissement | 
| Moyenne | Étendre les listes de sources intégrées au comparateur et aux collections partagées | Rendre la provenance homogène dans tous les parcours | 
| Basse | Ajouter des raccourcis clavier configurables au Dock et une sélection de favoris | Accélérer les usages récurrents des analystes | 

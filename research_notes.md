# Notes de référence — deck.gl

Consultation effectuée le 26 août 2026.

| Source | Constat utile pour l’intégration |
| --- | --- |
| [Documentation deck.gl](https://deck.gl/) | deck.gl est un framework de visualisation de données géospatiales à grande échelle accéléré par GPU. Son modèle repose sur la composition de calques et il propose une interface adaptée à React. |
| [Dépôt visgl/deck.gl](https://github.com/visgl/deck.gl) | Le dépôt officiel expose les guides React, les exemples de démarrage et les paquets de calques. |

## Décision d’implémentation

Le site utilisera **`@deck.gl/react`** pour le composant de rendu et **`@deck.gl/layers`** pour les calques de données. La première démonstration restera volontairement autonome, sans dépendance à un fournisseur de fond de carte : cette configuration est explicitement prise en charge par deck.gl et évite l’utilisation d’une clé tierce. Les données affichées sont une petite série de trajectoires illustratives, étiquetées comme telles dans l’interface.

## Mise à jour — sources pour les données et le fond vectoriel

| Source | Point confirmé | Décision |
| --- | --- | --- |
| [Paris Data — Paris se transforme](https://opendata.paris.fr/explore/dataset/parissetransforme/) | Le jeu officiel recense des réalisations de la Ville de Paris avec des informations d’adresse et de catégorie. | Utiliser cette source pour remplacer les nœuds illustratifs. |
| [API Open Data Paris — enregistrements datés](https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/parissetransforme/records?limit=5&where=date_liv%20is%20not%20null) | L’API fournit une géométrie ponctuelle, un libellé, une catégorie, une adresse et `date_liv`. La requête identifie 593 enregistrements avec une date de livraison. | Charger ces enregistrements à la demande et filtrer leurs années de livraison dans le navigateur. |
| [visgl/react-map-gl](https://github.com/visgl/react-map-gl) | Le dépôt officiel indique l’installation de `react-map-gl` et `maplibre-gl` pour l’adaptateur MapLibre. | Ajouter ces paquets et afficher un style vectoriel public sans clé en arrière-plan. |

L’application présentera explicitement les données comme issues de **Paris Data**, avec un lien vers la fiche du jeu. Aucun indicateur de volume ne sera présenté comme une mesure de fréquentation : les métriques du panneau seront dérivées uniquement de propriétés disponibles, notamment la date de livraison et la catégorie.

## Refonte géopolitique mondiale — sources et périmètre

| Calque | Indicateur | Source publique | Traitement dans Atlas Flux |
| --- | --- | --- | --- |
| Puissance économique | PIB en dollars courants (`NY.GDP.MKTP.CD`) | [Banque mondiale](https://data.worldbank.org/indicator/NY.GDP.MKTP.CD) | Taille des marqueurs proportionnelle sur une échelle logarithmique. |
| Démographie | Population totale (`SP.POP.TOTL`) | [Banque mondiale](https://data.worldbank.org/indicator/SP.POP.TOTL) | Taille et intensité des marqueurs comparables par pays. |
| Effort de défense | Dépenses militaires, part du PIB (`MS.MIL.XPND.GD.ZS`) | [Banque mondiale / SIPRI](https://data.worldbank.org/indicator/MS.MIL.XPND.GD.ZS) | Couche spécifique, présentée comme un pourcentage du PIB et non comme un niveau de dépenses. |

La [documentation de l’API des indicateurs](https://datahelpdesk.worldbank.org/knowledgebase/articles/889392-about-the-indicators-api-documentation) confirme l’accès programmatique sans clé et l’utilisation de l’API V2. L’application chargera les données nationales et leurs coordonnées de capitales depuis cette API. Les vues initiales seront **Monde**, **Europe**, **Amériques**, **Indo-Pacifique** et **Afrique–Moyen-Orient** ; les filtres seront **année** et **région**. Ces données sont des indicateurs descriptifs et ne constituent pas une évaluation du risque ou une prévision géopolitique.

## Documents fonctionnels transmis — 26 août 2026

| Document | Exigences à retenir pour Atlas Flux |
| --- | --- |
| **Système de classification** | La structure cible doit permettre de naviguer par échelle spatiale, typologie de lien, période et statut international. Un pays sélectionné doit conduire à un panneau contextuel ; les relations devront représenter leur type, direction et temporalité. |
| **Calques et filtre carte** | Le MVP visuel recommandé associe une vue mondiale, un fond sombre, des pays cliquables, des liens représentés par arcs et des icônes. Le document prévoit ensuite une timeline GPU, des calques de relations, des organisations et un mécanisme de contribution lorsqu’une relation est absente. |

Le correctif immédiat porte uniquement sur l’initialisation de la couche de points. Les capacités de relations typées, d’organisations et de contribution seront des évolutions distinctes, afin de ne pas présenter de liens non sourcés comme des faits.

### Diagnostic du correctif deck.gl

L’assertion levée dans l’initialisation de `ScatterplotLayer` vérifie qu’une instance de calque n’a pas déjà été initialisée. La carte était recréée lors du changement de vue, mais le mémo React pouvait lui transmettre les mêmes instances de calques. La dépendance de mémoïsation inclut désormais la clé de vue : chaque recréation de carte reçoit donc de nouvelles instances de `ScatterplotLayer`.

## Vue globe et relations — sources et structure initiale

| Élément | Source ou base | Décision d’intégration |
| --- | --- | --- |
| Limites des pays | [Natural Earth](https://www.naturalearthdata.com/) via [geo-countries](https://github.com/datasets/geo-countries) | Utiliser le GeoJSON public de pays dans une `GeoJsonLayer` pour matérialiser les continents en vue globe. |
| Relations | Système de classification transmis | Représenter un premier corpus de relations explicitement issu des exemples du document, avec son type, sa période et une mention de provenance. |
| Recherche | Référentiel Banque mondiale et organisations du corpus | Chercher les pays et organisations disponibles ; une sélection mettra l’acteur et ses liens en avant. |

Le mode globe doit être compris comme une visualisation exploratoire des relations structurées dans le corpus fourni. Chaque relation conserve une date de début, une date de fin éventuelle et un type pour le filtrage ; elle n’est pas présentée comme une assertion exhaustive sur les relations internationales.

## Audit de couverture des documents — état actuel

| Exigence des documents | État | Commentaire |
| --- | --- | --- |
| Carte 2D, globe 3D, pays cliquables, panneaux contextuels | **Livré** | Les vues 2D/3D, le survol, la sélection et les fiches acteurs sont disponibles. |
| Organisations, recherche par acteur, timeline | **Livré** | Le corpus comporte des organisations, la recherche identifie pays et organisations, et la timeline filtre les relations. |
| Arcs typés, colorés et filtrables | **Livré** | Les arcs sont animés, filtrables par couleur/type et donnent accès à une fiche relationnelle. |
| Comparaison bilatérale | **Livré** | Deux pays peuvent être sélectionnés afin de lister les relations actives du corpus. |
| Sources cliquables et export | **En cours** | Les sources sont identifiées dans les données ; liens cliquables, CSV et rapport PDF sont ajoutés dans l’itération actuelle. |
| Toutes les typologies de lien, échelles fines et statuts internationaux | **À structurer** | Le corpus n’implémente actuellement que quatre types de lien et une granularité régionale simplifiée. |
| Ajout de relation, validation éditoriale, JSON scénarisé, veille RSS | **À concevoir** | Ces fonctions exigent un back-office, une base de données et une gouvernance de contenu. |
| OrbitView, FirstPersonView, comparaison en écran scindé, extensions GPU avancées | **À planifier** | Ces modules ne font pas partie du MVP actuel ; ils sont pertinents pour des jeux de données substantiels et des scénarios spécialisés. |

Le constat est donc : les **fondations cartographiques et exploratoires** demandées sont en place, mais les fonctions de contribution, d’édition, de validation documentaire et certains modes spécialisés restent à mettre en œuvre avant de pouvoir considérer l’ensemble des deux documents comme couvert.

## Source de chaleur de conflit — décision de représentation

| Élément | Constat vérifié | Décision |
| --- | --- | --- |
| [UCDP GED](https://ucdp.uu.se/downloads/) | Le jeu d’événements géoréférencés UCDP est disponible au téléchargement sous licence CC BY 4.0 ; la page liste un codebook et plusieurs formats. | UCDP est la source de référence prévue pour un calque d’intensité fondé sur des événements et non sur une estimation décorative. |
| [API UCDP](https://ucdp.uu.se/apidocs/) | L’API expose les événements GED et prévoit des filtres de date et de géographie, mais l’accès automatisé requiert un jeton approuvé. | Ne pas intégrer un appel API non authentifié en production. Préparer l’interface et n’afficher une intensité que pour un extrait UCDP explicitement sourcé et daté. |

Le calque sera étiqueté **« signaux de conflit du corpus »** tant qu’un extrait UCDP complet, versionné et approprié n’aura pas été ajouté. Il ne devra pas être présenté comme une mesure exhaustive ou actualisée de l’intensité de guerre mondiale.

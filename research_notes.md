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

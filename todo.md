# Mise à jour Atlas Flux

## Fiches détaillées, sélections multiples et relevé fiable

- [x] Remplacer la réglette latérale par trois boutons explicites : 2D, Globe et Tac.
- [x] Ajouter des fiches pays à onglets Infos, Relations et Organisations selon l’exemple fourni.
- [x] Ajouter une fiche relation structurée : type, période, échelle, intensité, résumé, historique, source et PDF.
- [x] Rendre les régions et typologies sélectionnables en choix multiples avec état lisible.
- [x] Finaliser la période avec affichage garanti JJ/MM/AAAA et un vrai sélecteur complémentaire de type molette/défilement ou équivalent conforme à la demande utilisateur.
- [x] Implémenter ou prouver une transition de focus fluide en mode globe, puis revalider les parcours régionaux en 2D/globe/tactique.
- [x] Faire progresser la comparaison automatiquement de A→B vers B→C au troisième clic pays.
- [x] Corriger le relevé PDF pour capturer la carte visible et les filtres actifs de l’instant T.
- [x] Ajouter un filtre Organisation avec le même focus que les régions et typologies.
- [x] Permettre de nommer et enregistrer localement un relevé filtré pour le retrouver dans la session.
- [x] Ajouter une légende UCDP détaillant les seuils de gravité et leur lecture.
- [x] Revalider explicitement les exports et interactions bureau/mobile après preuve navigateur de l’export PDF cartographique réel.

## Contrôles, recherche et contexte relationnel

- [x] Éliminer le doublon d’infobulles lors du survol d’une relation.
- [x] Ajouter un contrôle œil pour afficher ou masquer les filtres cartographiques.
- [x] Rendre la recherche prédictive et exhaustive pour tous les résultats correspondants.
- [x] Assigner une couleur de base distincte et lisible à chaque typologie de relation.
- [x] Permettre de désélectionner un pays en cliquant à nouveau sur lui.
- [x] Empêcher l’ouverture automatique de la légende contextuelle lors du choix d’une typologie.
- [x] Intégrer le nouveau signe de logo fourni dans l’identité Atlas Flux.
- [x] Ajouter un basculement accessible clair/sombre avec icône lune.
- [x] Enrichir les fiches pays, organisations et relations à partir des données UCDP et Wikidata disponibles.
- [x] Animer avec fluidité les changements de période par molette.
- [x] Permettre de partager les relevés enregistrés via un lien unique et via l’API de partage du navigateur.
- [x] Tester les parcours desktop et mobile, la recherche, les tooltips, les thèmes et le partage.

## Corpus d’exploration, exports et collections

- [x] Créer un corpus démonstratif étiqueté, couvrant quatre pays et les typologies de relation, sans le confondre avec les données UCDP/Wikidata.
- [x] Préparer le modèle de collections partagées pour organiser les relevés enregistrés.
- [x] Vérifier un territoire ou une dépendance via la recherche multilingue et consigner ce cas de couverture.
- [x] Exporter les fiches pays, organisations et relations en PDF ou CSV contextualisés.
- [x] Vérifier la suppression propriétaire, la lecture partagée et la création d’une collection par tests de procédure couvrant leur cycle complet.
- [x] Vérifier les exports PDF/CSV de fiche dans le navigateur et documenter la vérification des collections authentifiées.

## Ajustements visuels annotés

- [x] Adapter aussi le fond cartographique, les calques et les contrôles au mode clair.
- [x] Déplacer les commandes de vue 2D/Globe/Tac dans l’encadré Filtres principaux, sans le libellé « Vue ».
- [x] Déplacer le bouton de visibilité des filtres dans l’encadré Filtres principaux.
- [x] Intégrer la période à molettes dans le panneau de filtres et supprimer sa duplication latérale.
- [x] Placer les actions secondaires sous la carte, conserver Comparer à gauche et placer partage/impression sous forme d’icônes à droite.
- [x] Recréer le logo sous forme vectorielle transparente, sans fond matriciel.
- [x] Vérifier les nouveaux rendus sombre et clair sur bureau et mobile.

## Cohérence relationnelle et filtres modernes

- [x] Assurer que chaque arc, étiquette et fiche utilise exactement la couleur définie pour sa typologie.
- [x] Réinstaller l’œil de visibilité dans une commande séparée, toujours accessible lorsque les filtres sont masqués.
- [x] Réintroduire le choix d’organisations dans le panneau de filtres visible.
- [x] Supprimer la sous-section de période à molettes redondante et conserver la période de lecture.
- [x] Rendre la recherche prédictive par anticipation et hiérarchiser les suggestions utiles dès la saisie.
- [x] Afficher le drapeau ou marqueur territorial à côté de chaque résultat pays dans la recherche.
- [x] Ajouter un drapeau ou marqueur territorial cohérent dans les sélecteurs d’acteurs, notamment le comparateur A/B.
- [x] Étendre le langage translucide, superposé et moderne aux composants cartographiques : recherche, panneaux, toggles et sliders.
- [x] Vérifier au rendu mobile la recherche drapeautée et l’ouverture du comparateur A/B avec drapeaux, puis consigner une preuve observable.

## Panneaux verre fumé

- [x] Transformer les panneaux de filtres, recherche, fiches et comparateur en surfaces plus translucides avec flou de fond discret.
- [x] Réduire les bordures, alléger les séparateurs et augmenter la respiration entre sections.
- [x] Préserver le contraste des textes et des actions sur carte sombre et claire.
- [x] Vérifier explicitement le repli et la réapparition du panneau de filtres avec le nouveau style verre fumé dans une session mobile responsive.

## Refonte nocturne Apple-style

- [x] Personnaliser la scène cartographique Atlas Flux au-delà du style Carto générique : fond MapLibre dédié, continents Natural Earth et repères rendus par deck.gl.
- [x] Ajouter un halo cyan focalisé derrière les arcs et nœuds tout en conservant le trait sémantique par typologie.
- [x] Réduire les surfaces massives et adopter des panneaux compacts, très floutés et translucides inspirés du langage Apple.
- [x] Ajuster la densité, les rayons, les ombres et les contrôles pour une interface cartographique plus contemporaine.
- [x] Documenter explicitement la correspondance de la scène bureau/mobile avec les attributs observables de la référence, sans perdre les affordances existantes.

## Charte utilisateur, filtres fusionnés et cohérence 3D

- [x] Achever l’audit source des accents orange/corail hérités et conserver uniquement les usages d’alerte légitimes.
- [x] Vérifier que chaque signal coloré conserve un libellé, une icône ou une valeur lisible.
- [x] Fusionner les panneaux Filtres principaux et Typologies dans un seul espace de filtre.
- [x] Consolider la preuve d’export du relevé PDF pour une combinaison active région, typologie et vue.
- [x] Confirmer la vue A/B en écran scindé pour deux périodes distinctes.
- [x] Rendre le focus régional identique en carte 2D, globe et vue tactique 3D.
- [x] Revalider les vues, les exports et les rendus bureau/mobile après les dernières preuves de charte et d’export.

## Focus unifié des filtres principaux

- [x] Retirer le panneau Analyse guidée et ses contrôles devenus redondants.
- [x] Appliquer un focus cartographique à chaque filtre régional.
- [x] Appliquer un focus cartographique à chaque typologie de relation.
- [x] Prévoir un contrat de focus réutilisable pour les futurs filtres principaux.
- [x] Synchroniser les filtres principaux région et typologie dans des états URL partageables.
- [x] Tester les états URL des nouveaux focus principaux sur bureau et mobile avant publication.
- [x] Vérifier les vues, les états URL et le rendu bureau/mobile avant publication.

## Carte centrée acteur, comparaison directe et publication éditoriale

- [x] Retirer les calques d’indicateurs de la carte et les consolider dans les fiches pays et organisations.
- [x] Ajouter à chaque fiche organisation les informations de contexte qui remplacent les anciens calques d’indicateurs.
- [x] Étendre le référentiel aux territoires, dépendances et nations constitutives disponibles dans les données de référence.
- [x] Déplacer la typologie dans l’espace de filtres comme filtre principal, avec légende contextuelle associée.
- [x] Permettre de comparer deux acteurs par deux clics directs sur la carte.
- [x] Créer une vue A/B en écran scindé synchronisée pour comparer deux périodes.
- [x] Ajouter l’impression cartographique instantanée et des rapports PDF analytiques sourcés.
- [x] Mettre en place un workflow de contribution et validation éditoriale des relations.
- [x] Vérifier les parcours, les exports et les vues bureau/mobile.
- [x] Tester explicitement les exports CSV/PDF (impression cartographique, rapport analytique et comparateur) et consigner les cas vérifiés.
- [x] Extraire et tester les helpers réels d’impression cartographique, de rapport analytique et d’export CSV bilatéral.
- [x] Consigner les cas d’export vérifiés dans les notes de recherche et le suivi.

## Légendes contextuelles, évolution A→B et extension Wikidata

- [x] Définir une légende contextuelle détaillée pour chaque typologie et son code visuel.
- [x] Ajouter l’accès progressif à la légende depuis les filtres et les détails de relation.
- [x] Construire une comparaison temporelle A→B avec une lecture cartographique des changements.
- [x] Étendre le sous-ensemble Wikidata avec de nouvelles relations résolues, typées et sourcées.
- [x] Vérifier la traçabilité des sources, les états URL et les rendus bureau/mobile.

## Charte UX et palette sémantique permanente

- [x] Documenter les règles d’affordance, de modèle mental et de divulgation progressive.
- [x] Formaliser l’usage sémantique de l’encre, du papier, du teal, du cyan, du lilas, du jaune et du corail.
- [x] Ajuster les commandes pour rendre leur action perceptible sans tutoriel intrusif.
- [x] Ajouter des indices contextuels et des explications au survol ou à la demande.
- [x] Vérifier contraste, navigation clavier et cohérence visuelle sur bureau et mobile.

## Réseau Wikidata et gravité des conflits

- [x] Résoudre les URI Wikidata du fichier en libellés d’acteurs et types de relations.
- [x] Étendre l’extrait UCDP avec davantage de cellules de 2020 à 2025.
- [x] Ajouter un filtre de gravité sur les décès estimés UCDP.
- [x] Exposer la provenance des relations Wikidata et des cellules UCDP.
- [x] Vérifier la carte, les filtres et le rendu responsive.

## Données de conflit et vue tactique

- [x] Identifier le format, les champs, la période et la provenance du fichier transmis.
- [x] Préparer un extrait de données de conflit exploitable dans le navigateur.
- [x] Remplacer les signaux de corpus par les données sourcées disponibles.
- [x] Ajouter une vue tactique 3D locale depuis un pays, une organisation ou une zone.
- [x] Vérifier la précision de la chaleur, la vue tactique et le rendu responsive.

## Analyse guidée et vues spécialisées

- [x] Identifier les sources réutilisables pour les zones de conflit et définir leurs limites de représentation.
- [x] Étendre les typologies, les échelles et les règles de calques automatiques.
- [x] Ajouter sélection de pays, organisations et zones avec mise en évidence du réseau.
- [x] Ajouter des relations directionnelles et un panneau de détail par typologie.
- [x] Ajouter vues spécialisées, chaleur de conflit et prévisualisation temporelle.
- [x] Ajouter un export contextualisé de la vue, de l’époque et des relations actives.
- [x] Vérifier l’expérience complète sur bureau et mobile.

## Graphique, export et sources vérifiables

- [x] Auditer la couverture de l’application par rapport aux deux documents transmis.
- [x] Ajouter une chronologie bilatérale dans le comparateur.
- [x] Ajouter un export CSV et un rapport PDF du comparateur.
- [x] Rendre cliquables les sources des arcs, pays et organisations.
- [x] Vérifier les flux d’export, les liens externes et le rendu responsive.

## Comparateur diplomatique et légende

- [x] Concevoir la sélection de deux pays et le résumé bilatéral des relations du corpus.
- [x] Ajouter une infobulle d’arc avec type, période, détail et provenance.
- [x] Ajouter une légende colorée servant également de filtre de relations.
- [x] Vérifier le comparateur et les contrôles sur bureau et mobile.

## Relations géopolitiques interactives

- [x] Structurer un premier jeu de relations documentées entre États et organisations.
- [x] Ajouter des arcs colorés, filtrables et animés selon le type de lien et la période.
- [x] Ajouter un mode globe 3D en complément de la carte plane.
- [x] Ajouter une timeline interactive et des filtres de relations.
- [x] Ajouter la recherche d’un pays ou d’une organisation avec mise en évidence.
- [x] Vérifier le rendu et les interactions sur bureau et mobile.

## Correctif de rendu deck.gl

- [x] Lire les documents de classification et de calques transmis.
- [x] Identifier la propriété incompatible lors de l’initialisation de `ScatterplotLayer`.
- [x] Corriger les couches mondiales et vérifier les interactions.

## Refonte géopolitique mondiale

- [x] Sélectionner des indicateurs géopolitiques mondiaux et des sources publiques fiables.
- [x] Remplacer le cadrage parisien par une vue mondiale et des limites de pays.
- [x] Ajouter des boutons de vues régionales et globales.
- [x] Ajouter des boutons de calques et des filtres par période, région et indicateur.
- [x] Vérifier les interactions et l’affichage responsive de la carte mondiale.

- [x] Identifier un jeu de données GeoJSON public, réutilisable et adapté à la visualisation urbaine.
- [x] Vérifier l’intégration officielle de MapLibre avec deck.gl pour le fond vectoriel.
- [x] Préparer une sélection de données temporelles cohérentes pour l’exploration par période.
- [x] Installer les dépendances cartographiques nécessaires et intégrer les données au projet.
- [x] Ajouter les contrôles temporels et filtrer les couches affichées.
- [x] Créer un panneau accessible de détail des nœuds sélectionnés.
- [x] Vérifier les interactions, la compilation et les versions bureau/mobile.

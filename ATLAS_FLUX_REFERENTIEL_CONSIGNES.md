# Atlas Flux — Référentiel consolidé des consignes

**Statut :** document de référence opérationnel. Il consolide les demandes formulées pour Atlas Flux et remplace les versions antérieures lorsqu’une même intention a été précisée, corrigée ou redéfinie par la suite.

> **Règle de lecture.** Lorsque deux consignes sont incompatibles ou lorsqu’une demande a évolué, seule la dernière formulation exprimée par l’utilisatrice est normative. Les éléments antérieurs sont conservés uniquement s’ils restent compatibles avec cette dernière décision.

## 1. Finalité du produit

Atlas Flux est un **observatoire géopolitique mondial interactif**. Il doit permettre de sélectionner un pays, un territoire, une organisation ou une zone, d’en visualiser les liens et d’explorer des relations géopolitiques dans l’espace et dans le temps. L’outil sert à l’analyse, à la comparaison, à la documentation et à l’export de lectures cartographiques contextualisées.

La priorité produit est une exploration directe de la carte. L’interface doit donc guider sans encombrer : la manipulation doit rester compréhensible sans tutoriel intrusif, les contrôles doivent suggérer naturellement leur usage et les détails doivent apparaître progressivement au moment où ils sont utiles.

| Principe d’expérience | Décision consolidée |
| --- | --- |
| Échelle | Monde entier, avec pays, territoires, îles, dépendances et unités géographiques reconnues dans les données retenues. |
| Acteurs | Pays, territoires, organisations et zones européennes ou régionales. |
| Cœur d’usage | Chercher ou cliquer un acteur, le mettre en évidence, filtrer un type de lien, explorer les acteurs reliés et leurs sources. |
| Navigation | Carte comme support principal ; panneaux contextuels non bloquants, masquables et réversibles. |
| Éthique des données | Les relations doivent être sourcées. Tout corpus de démonstration doit être explicitement signalé et remplacé progressivement par des données vérifiées. |

## 2. Principes d’UX et d’ergonomie

L’interface applique les principes demandés d’**affordance**, de **modèle mental**, de **loi de Jakob**, de **divulgation progressive** et de **reconnaissance plutôt que rappel**. Les boutons ressemblent à des contrôles, les symboles connus remplacent les libellés répétitifs et les détails sont révélés par le clic, le survol ou un panneau dédié plutôt que par une accumulation d’informations permanentes.

Les mouvements doivent être courts, réversibles et utiles. Les transitions de sélection, de focus et de période doivent être fluides. Les contrôles conservent un intitulé accessible, une aide au survol lorsque le seul pictogramme pourrait être ambigu et des cibles utilisables au clavier et sur mobile.

| Élément | Consigne consolidée |
| --- | --- |
| Panneaux | Verre dépoli translucide, bordure fine unique, flou perceptible mais lisibilité prioritaire, densité élégante. |
| Boutons | États visibles, pression tactile, icônes familières et libellés d’accessibilité. Les interrupteurs utilisent le comportement de type Apple. |
| Recherche | Centrée dans la scène ; l’œil de filtres reste indépendant ; résultats prédictifs et exhaustifs dès la frappe. |
| Panneau Filtres | Positionné à gauche, repliable via un œil qui demeure toujours accessible. Une scrollbar, lorsqu’elle est nécessaire, adopte le même aspect vitré et transparent. |
| Détails | Une seule fiche de détail visible à la fois. Cliquer la carte referme l’introduction qui gêne l’exploration. |
| Mobile | Les éléments indispensables restent accessibles, les panneaux n’occupent pas inutilement la carte et la Timeline peut s’agrandir en plein écran. |

## 3. Direction artistique et charte normative

La scène cible est une carte nocturne bleu ardoise, avec continents et reliefs discrets, flux lumineux cyan et panneaux système inspirés du verre dépoli Apple. La carte claire demeure disponible via un bouton lune/soleil, mais la direction visuelle principale est sombre. Aucun orange décoratif ne doit devenir une couleur de marque.

| Jeton | Rôle normatif |
| --- | --- |
| **Encre `#112235`** | Structure, texte sombre, profondeur et contraste. |
| **Papier `#FBF7F0`** | Surfaces claires, texte clair et respiration. |
| **Teal `#008C95`** | Activation, contrôles sélectionnés et états positifs. |
| **Cyan `#20C4D9`** | Données, liens, halo de réseau et focus cartographique. |
| **Lilas `#8B7AC8`** | Contexte, informations secondaires et couches complémentaires. |
| **Jaune `#F2C14E`** | Faits, attention informative et repères non critiques. |
| **Corail `#D95D4E`** | Risque, conflit, sécurité ou action irréversible uniquement. |

Les relations conservent chacune une couleur sémantique distincte. Le trait, la direction, l’infobulle et la fiche d’une même relation doivent employer une couleur cohérente. Un halo cyan peut éclairer les flux, mais ne doit pas faire perdre la couleur du type relationnel.

## 4. Carte, vues et interactions spatiales

La carte utilise deck.gl et MapLibre, une base vectorielle esthétique et un fond Natural Earth. Les vues sont limitées aux trois modes utiles : **2D**, **Globe** et **Tac**. Elles se trouvent dans Filtres principaux ; il n’y a plus de barre latérale dédiée aux vues.

| Fonction | Consigne consolidée |
| --- | --- |
| Focus d’acteur | Un pays, territoire, organisation ou zone sélectionné est mis en évidence en bleu marine. Les acteurs liés apparaissent en bleu plus clair et sont reliés par des arcs ou flèches. |
| Focus 3D | Le focus doit rester réel, fluide et cohérent dans les vues Globe et Tactique, pas seulement en 2D. |
| Sélection | Un second clic sur le même acteur le désélectionne. Deux clics successifs sur des acteurs lancent la comparaison ; un troisième acteur remplace le premier de façon à comparer le second au troisième. |
| Relations | Les arcs sont interactifs ; le survol renseigne sans double infobulle et le clic ouvre une fiche relationnelle unique. |
| Chaleur de conflit | Carte de chaleur UCDP, zones chaudes, filtre de gravité fondé sur les décès et légende de seuils détaillée. |
| Calques automatiques | Le type de lien sélectionné applique les vues ou calques pertinents. Les indicateurs PIB, défense et assimilés restent dans les fiches et ne constituent pas des calques principaux. |

## 5. Filtres, recherche et typologies

La **typologie relationnelle est un filtre principal**. Elle est réunie avec les régions, organisations et conflit dans le panneau de filtres unique. Les liens peuvent être sélectionnés en choix multiples. L’état actif est représenté par l’opacité et l’interrupteur, non par le mot « actif ».

La recherche doit anticiper les requêtes, accepter les synonymes et langues disponibles, ne pas s’arrêter aux dix premiers résultats et afficher les drapeaux à côté des pays. Les territoires sans drapeau emploient un marqueur territorial explicite. La recherche peut cibler pays, territoires, organisations et zones.

## 6. Temporalité et Timeline

La période de lecture est une plage **DE/À**, avec deux bornes. Elle utilise des dates au format **JJ/MM/AAAA**, un calendrier et des molettes de jour, mois et année. La Timeline est une seule piste continue à deux poignées, avec les dates attachées aux poignées ; elle ne doit plus afficher de séparation artificielle ou de libellés redondants.

Le bouton Timeline, avec l’horloge seule comme repère suffisant, est disposé à gauche de la piste dans le même bloc. Le clic ouvre immédiatement le sélecteur de période. Sur petit écran, un contrôle permet de passer la Timeline en plein écran, puis de revenir à la carte. Les anciennes molettes redondantes dans le panneau Filtres sont retirées.

La comparaison temporelle A/B reste une fonction distincte : elle présente deux périodes synchronisées en écran scindé, sans se confondre avec la sélection de deux acteurs.

## 7. Fiches, sources et contribution

Les fiches pays, territoire, organisation et relation doivent présenter les informations utiles, les relations contextuelles et des sources cliquables. Pour un pays, le lien Wikipédia est requis ; pour une organisation, les liens Wikipédia et officiel sont affichés lorsque disponibles. Les relations renvoient vers leur source vérifiable.

Les sources appartiennent à la fiche elle-même. Elles ne doivent pas former un encart flottant ou externe. La fiche affiche le **nombre total de sources** et liste les références dans une zone de défilement vitrée (`ScrollArea`) lorsque la liste est longue. Le contraste ton sur ton doit être corrigé : titre, valeur, libellé secondaire et lien utilisent des teintes suffisamment distinctes.

La fiche relationnelle utilise un MorphingPopover intégré au panneau de détail, jamais superposé à une autre fiche. Ouvrir une relation ferme d’abord la fiche pays ou organisation. Les actions de fiche comprennent au minimum consultation de la source, partage, export PDF et proposition de correction. Le workflow de contribution impose une source vérifiable puis une validation éditoriale, avec revue administrateur.

## 8. Comparaison, relevés, exports et collections

La comparaison de deux acteurs est déclenchée directement par la sélection sur la carte, sans passage obligatoire par une carte intermédiaire. Le comparateur affiche les drapeaux, les relations actives et leur évolution historique. La vue A/B temporelle séparée permet de comparer deux états de carte synchronisés.

| Fonction | Consigne consolidée |
| --- | --- |
| Instantané cartographique | Une icône imprimer génère un PDF de la carte réellement visible, avec les filtres appliqués à l’instant T. La capture de carte est obligatoire dans l’export. |
| Fiches et comparaison | Exports PDF et CSV pour un pays, une organisation, une relation, une comparaison ou un relevé. Les rapports peuvent comporter graphiques, couleurs et sources. |
| Relevés | Nommer, enregistrer, réappliquer, partager par lien unique ou via les capacités de partage disponibles. |
| Collections | Regrouper des relevés dans des collections privées ou partagées ; permettre lecture, restauration et suppression par le propriétaire. |
| Actions globales | Un Dock Palladyon remplace la barre d’actions conventionnelle et regroupe comparaison, recentrage, contribution, sauvegarde, exports et partage. |

## 9. Données, provenance et limites actuelles

Le projet doit s’appuyer sur des données géographiques et relationnelles vérifiables. Les jeux actuellement prévus ou intégrés comprennent Natural Earth pour le fond géographique, Wikidata pour des relations et URI d’acteurs, UCDP GED pour le contexte des conflits, et la Banque mondiale pour les indicateurs de fiche.

Tout sous-ensemble doit préciser son millésime, son périmètre et sa source. Les cellules UCDP utilisées doivent être datées et la granularité doit être améliorée au fil des intégrations. Les qualificatifs temporels Wikidata sont ajoutés lorsqu’ils existent. Les exemples relationnels non factuels doivent être explicitement étiquetés puis remplacés par des relations sourcées, avec au moins quatre pays représentatifs pour chaque niveau de typologie pendant la phase de test.

## 10. Composants Palladyon retenus

| Composant | Usage retenu |
| --- | --- |
| `Switch` | Typologies de relation et états actifs/inactifs du panneau de filtres. |
| `Slider` | Timeline continue à deux poignées. |
| `Popover` | Calendrier et molettes de période ouverts depuis Timeline. |
| `Dock` | Actions cartographiques globales. |
| `MorphingPopover` | Fiche relationnelle fluide, intégrée à la zone de détail. |
| `ScrollArea` | Références de fiche longues, avec scrollbar vitrée. |

## 11. Exigences techniques et livraison

Le frontend est prioritaire. Le backend ne doit évoluer que pour les collections et workflows déjà nécessaires ; les fichiers d’infrastructure `server/_core` ne doivent pas être modifiés. Toute modification doit être testée par TypeScript, Vitest et contrôle visuel bureau/mobile lorsque l’interface est concernée.

Le ZIP téléchargé doit refléter le dernier point de contrôle Atlas Flux, jamais l’ancienne maquette Atlas Connect / `carte-deckgl`. Le dépôt contient un `EXPORT_MANIFEST.md` pour identifier l’archive et un `PROJECT_STATUS.md` pour l’état produit. Après une évolution importante, le checkpoint publié est la référence de l’archive téléchargeable.

## 12. Priorités restantes

Le socle fonctionnel est en place. La priorité suivante est de remplacer le reliquat de corpus de démonstration par un référentiel relationnel entièrement sourcé et révisé, puis de définir un processus de rafraîchissement/versionnage pour Wikidata, UCDP et les indicateurs économiques. Une recette métier des interactions carte, fiches, Timeline, exports et collections est ensuite attendue avant extension du périmètre.

---

## Annexes : décisions explicitement abandonnées ou remplacées

| Ancienne orientation | Décision finale à appliquer |
| --- | --- |
| Barre latérale de vues | Supprimée ; seuls les boutons 2D, Globe et Tac dans Filtres principaux sont conservés. |
| Panneau « Analyse guidée » autonome | Supprimé ; l’exploration part de l’acteur, des typologies et de la carte. |
| Calques PIB, défense ou indicateurs de démonstration | Retirés de la carte principale ; information conservée dans les fiches. |
| Infobulle doublée de relation | Retirée ; un seul détail contextuel est visible. |
| Légende contextuelle qui s’ouvre à chaque clic | Retirée ; la légende reste non intrusive et contrôlée par l’utilisateur. |
| Texte « actif » dans les filtres | Remplacé par opacité et toggles Apple. |
| Période à molette dans Filtres | Retirée ; le contrôle de période est centralisé dans Timeline. |
| Fiche relationnelle en superposition externe | Remplacée par le MorphingPopover intégré au panneau de détail unique. |
| Sources dans un encart flottant | Remplacées par un registre directement intégré à chaque fiche. |
| Barre d’actions classique | Remplacée par un Dock Palladyon. |

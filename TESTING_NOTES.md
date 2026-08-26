# Vérifications de l’itération corpus et collections

- La recherche mobile trouve **Germany** avec la requête espagnole `alemania`, via les noms localisés générés depuis le code pays.
- La recherche mobile trouve l’**Organisation mondiale de la Santé** avec `world health`, via les synonymes d’organisation.
- La recherche mobile trouve le territoire **Antarctique** avec la requête espagnole `antartida`, confirmant la couverture des territoires disposant d’un code ISO.
- Une relation démonstrative ouvre une fiche explicitement qualifiée de scénario et présente les actions **PDF** et **CSV** de la fiche.
- Les captures bureau et mobile confirment la présence du corpus démonstratif étiqueté, du sélecteur de collections et de la section de collections partageables.
- La compilation TypeScript et les 11 tests Vitest passent après les changements.

## Exports et collections : preuve de validation

| Parcours | Méthode | Résultat |
| --- | --- | --- |
| Fiche relation → PDF | Navigateur Chromium, relation démonstrative France → Brésil | Le téléchargement `atlas-flux-relation-france-—-bresil.pdf` est confirmé dans l’historique des téléchargements. |
| Fiche relation → CSV | Navigateur Chromium, même fiche | Le téléchargement `atlas-flux-relation-france-—-bresil.csv` est confirmé dans l’historique des téléchargements. |
| Création, lecture partagée et suppression de collection | Vitest, procédures tRPC et persistance simulée | Le cycle création → ajout d’un relevé → lecture par clé de partage → suppression propriétaire est couvert et validé. |
| Création persistante en interface | Navigateur non connecté | Le sélecteur de relevé et le point d’entrée sont visibles. La dernière écriture en base est volontairement non testée dans le navigateur, car elle demande une session Manus ; aucune collection fictive n’a été créée dans la base. |

## Vérification des annotations visuelles

| Ajustement | Vérification | Résultat |
| --- | --- | --- |
| Contrôles cartographiques | Captures bureau et mobile | Les boutons 2D, Globe, Tac et l’œil sont regroupés dans **Filtres principaux**, sans libellé « Vue ». |
| Filtres fusionnés | Captures bureau et mobile | Les organisations et les molettes de période se trouvent dans le même panneau ; les panneaux flottants doublons ont été retirés. |
| Barre d’actions | Capture bureau | Comparer est placé à gauche sous la carte ; PDF, rapport et partage sont réduits à des boutons icônes à droite. |
| Thème clair | Session navigateur | Le fond MapLibre bascule vers Positron, et les panneaux, la recherche, les champs et les contrôles utilisent un contraste clair cohérent. |
| Logo | Inspection du rendu | La marque est un SVG transparent composé de deux formes angulaires, sans fond matriciel. |

- La compilation TypeScript et les **13 tests Vitest** passent après les ajustements visuels.

## Cohérence relationnelle et filtres modernes

| Parcours | Vérification | Résultat |
| --- | --- | --- |
| Couleurs militaires | Revue du registre de typologies et des couches DeckGL | L’arc, la flèche et les fiches utilisent désormais la même couleur corail pour une relation militaire, y compris en comparaison temporelle. |
| Recherche anticipative | Saisie navigateur `fra` | Treize résultats sont classés sans limite arbitraire ; les pays et territoires affichent leur drapeau ou un marqueur territorial. |
| Œil de filtres | Navigateur | Après masquage du panneau, l’œil reste visible avec le libellé d’accessibilité « Afficher les filtres ». |
| Mobile | Capture 375 × 812 | Organisations remontées, molettes supprimées, repère démonstratif non chevauchant et commandes de carte lisibles. |
| Vérification technique | `pnpm check` et `pnpm test` | Compilation réussie et 13 tests Vitest validés. |
| Sélecteurs A/B | Inspection navigateur des options du comparateur | Chaque pays est préfixé par son drapeau ISO ; les unités sans code ISO affichent le marqueur territorial `◉`. |
| Mobile 375 × 812 | Captures `?search=fra` et `?compare=1` | Les résultats France et territoires affichent drapeaux ou marqueurs ; les valeurs actives A/B affichent les drapeaux de Turquie et Grèce. |
| Preuve visuelle mobile | Captures locales contrôlées | `webdev-preview-root-1787732587914905412-5563.png` rend les drapeaux France et Polynésie française, ainsi que les marqueurs territoriaux ; `webdev-preview-root-1787732591887024980-4527.png` rend les valeurs A/B 🇹🇷 Türkiye et 🇬🇷 Greece. |

## Panneaux verre fumé

| Format | Vérification | Résultat |
| --- | --- | --- |
| Bureau 1440 × 900 | Filtres, recherche, timeline, actions et surfaces contextuelles | Les panneaux laissent désormais filtrer la carte derrière un fond fumé, avec flou léger, reflet supérieur discret et bordure unique à faible contraste. |
| Mobile 375 × 812 | Filtres ouverts avec actions cartographiques | Les groupes restent lisibles et espacés ; la commande œil reste accessible pour replier le panneau. |
| Repli réversible | Exécution navigateur sur `.map-filter-visibility-toggle` | Le clic applique `filters-hidden`, rend le panneau à `opacity: 0` et `pointer-events: none` tout en conservant l’œil visible ; le second clic retire la classe et restaure les interactions. |
| Repli mobile responsive | Contrôle Chromium CDP à 375 × 812 | État initial : opacité `1` et interactions actives. Après clic : `filtersHidden: true`, opacité `0`, interactions désactivées et œil visible. Après second clic : opacité `1`, interactions actives et œil toujours visible. |

## Refonte nocturne Apple-style

| Format | Vérification | Résultat |
| --- | --- | --- |
| Bureau 1440 × 900 | Carte Atlas Flux, flux et surfaces superposées | Le style MapLibre Atlas Flux repose désormais sur un fond sans raster tiers, complété d’un continent Natural Earth bleu ardoise, de frontières fines et de repères continentaux. Les flux ont un halo cyan dédié sous leur trait de typologie. Les commandes restent compactes, arrondies et floutées. |
| Mobile 375 × 812 | Panneau de filtres et timeline | La surface conserve un flou de verre dépoli, ses séparateurs faibles et ses contrôles arrondis sans perte de lisibilité ou de l’œil indépendant. La carte conserve son fond nocturne, ses flux cyan et son contraste sous le panneau. |
| Correspondance de référence | Revue des captures bureau et mobile | Les attributs demandés sont explicitement présents : scène nocturne bleu ardoise, contours continentaux discrets, flux cyan lumineux, cœur d’arc sémantique, surfaces translucides fortement floutées et densité de contrôles réduite. |
| Vérification technique | `pnpm check` et `pnpm test` | Compilation réussie et **13 tests Vitest** validés après la couche de continents, les repères et les halos cyan. |

## Ajustements des panneaux et de la timeline

| Parcours | Vérification | Résultat |
| --- | --- | --- |
| Bureau 1440 × 900 | Disposition des contrôles | Le panneau Filtres principaux est placé à gauche, la recherche est centrée et l’œil demeure une commande indépendante. |
| Typologies | Revue du panneau de filtres | Les libellés « actif » sont remplacés par des interrupteurs de type Apple ; les liens désactivés deviennent transparents et la grille ne possède plus de scrollbar interne. |
| Timeline | Captures bureau et mobile | La lecture temporelle affiche deux bornes DE/À en JJ/MM/AAAA et deux curseurs. Un clic sur « Timeline » ouvre les champs date et le calendrier de plage. |
| Carte | Revue du gestionnaire de clic | Tout clic direct sur la carte masque l’introduction initiale pour libérer l’exploration. |
| Vérification technique | `pnpm check` et `pnpm test` | Compilation réussie et **16 tests Vitest** validés, dont trois contrats d’interface Atlas Flux. |

## Simplification de la timeline et des panneaux

| Parcours | Vérification | Résultat |
| --- | --- | --- |
| Bureau 1440 × 900 | Timeline et scène cartographique | Les libellés redondants et la séparation entre les curseurs ont disparu. Les deux poignées occupent une piste unique continue ; leurs repères restent attachés aux poignées. |
| Mobile 375 × 812 | Timeline et panneau Filtres | La piste unique, l’icône Timeline et les deux poignées restent lisibles. Le panneau conserve sa densité sans éléments de période redondants. |
| Popover Timeline | Sélection de période | Un clic sur Timeline ouvre directement le calendrier de plage et les molettes DE/À. |
| Vérification technique | `pnpm check` et `pnpm test` | Compilation réussie et **16 tests Vitest** validés après mise à jour du contrat UI. |

## Intégration des primitives Palladyon

| Composant intégré | Remplacement Atlas Flux | Résultat |
| --- | --- | --- |
| `Switch` | Interrupteurs synthétiques des typologies | Les filtres de liens utilisent désormais la primitive Palladyon/Radix, avec l’état et les couleurs sémantiques Atlas Flux conservés. |
| `Slider` | Deux inputs de plage temporelle | La timeline utilise maintenant le Slider Palladyon/Radix à deux poignées, synchronisé avec les dates, le calendrier et les molettes. |
| Compatibilité | Bureau 1440 × 900 et mobile 375 × 812 | Les toggles et les poignées restent lisibles ; les repères explicites garantissent la visibilité des deux bornes sur mobile. |
| Vérification technique | `pnpm check` et `pnpm test` | Compilation réussie et **16 tests Vitest** validés, dont les contrats d’adoption des primitives Palladyon. |
| Extensions recommandées | Composants Palladyon à envisager | Le `Dock` pourrait remplacer la barre d’actions basse ; `MorphingPopover` conviendrait aux fiches de relations ; `ScrollArea` peut servir aux longues listes de sources si leur volume augmente. |

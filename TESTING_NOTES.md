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

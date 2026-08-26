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

# Notes de référence — deck.gl

Consultation effectuée le 26 août 2026.

| Source | Constat utile pour l’intégration |
| --- | --- |
| [Documentation deck.gl](https://deck.gl/) | deck.gl est un framework de visualisation de données géospatiales à grande échelle accéléré par GPU. Son modèle repose sur la composition de calques et il propose une interface adaptée à React. |
| [Dépôt visgl/deck.gl](https://github.com/visgl/deck.gl) | Le dépôt officiel expose les guides React, les exemples de démarrage et les paquets de calques. |

## Décision d’implémentation

Le site utilisera **`@deck.gl/react`** pour le composant de rendu et **`@deck.gl/layers`** pour les calques de données. La première démonstration restera volontairement autonome, sans dépendance à un fournisseur de fond de carte : cette configuration est explicitement prise en charge par deck.gl et évite l’utilisation d’une clé tierce. Les données affichées sont une petite série de trajectoires illustratives, étiquetées comme telles dans l’interface.

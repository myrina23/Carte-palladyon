# Charte UX permanente — Atlas Flux

Cette charte s’applique à chaque ajout fonctionnel. Atlas Flux doit donner à voir un **poste d’observation**, et non un tableau de bord demandant un apprentissage préalable.

| Principe | Règle de conception | Vérification pratique |
| --- | --- | --- |
| **Affordance** | Toute action doit avoir une forme de contrôle identifiable, un état actif visible et une zone cliquable confortable. | Les boutons se distinguent des labels ; leurs états `hover`, `active` et `focus-visible` sont perceptibles. |
| **Modèle mental** | Les interactions reprennent les conventions cartographiques établies : cliquer pour sélectionner, faire glisser pour déplacer, molette ou pincement pour zoomer, curseur pour explorer le temps. | Aucun geste propriétaire ni tutoriel bloquant n’est requis. |
| **Loi de Jakob** | Les recherches, filtres, bascules de calques, liens externes et exports suivent les usages familiers du web. | Les libellés, icônes et emplacements restent cohérents d’une vue à l’autre. |
| **Divulgation progressive** | Le détail ne s’affiche qu’au clic ou au survol : panneaux contextuels, infobulles et sources ouvrables. | La carte conserve de l’espace et aucun panneau ne masque inutilement la scène. |
| **Reconnaissance** | Une icône renforce chaque concept récurrent ; une couleur ne porte jamais le sens à elle seule. | Chaque signal possède aussi un texte, une valeur ou une étiquette accessible. |

## Palette sémantique

| Jeton | Couleur | Rôle exclusif |
| --- | --- | --- |
| **Encre** | `#112235` | Structure, titres, limites et fond cartographique. |
| **Papier chaud** | `#FBF7F0` | Lecture longue et sections éditoriales. |
| **Teal actif** | `#008C95` | Navigation active, activation de couche et données neutres. |
| **Cyan data** | `#20C4D9` | Flux, liens et repères cartographiques. |
| **Lilas contexte** | `#8B7AC8` | Scénarios, organisations et couches secondaires. |
| **Jaune repère** | `#F2C14E` | Faits clés, mesure pédagogique et attention modérée. |
| **Corail alerte** | `#D95D4E` | Risque, conflit, urgence et action irréversible uniquement. |

Le corail ne doit jamais devenir une couleur d’ambiance, de navigation courante ou de décoration. Toute nouvelle couleur ou interaction doit être évaluée à l’aune de cette charte avant son intégration.

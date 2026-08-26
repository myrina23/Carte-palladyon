# Direction créative — Atlas Flux

## Trois pistes stylistiques

| Thème | Introduction très brève | Probabilité |
| --- | --- | --- |
| **Atlas Flux** | Une console cartographique éditoriale inspirée des planches topographiques et des instruments scientifiques. Elle privilégie le contraste, la précision et une lecture immédiate de l’activité urbaine. | 0.07 |
| **Signal de Territoire** | Un espace clair, presque muséal, où la donnée apparaît comme une collection de relevés géographiques. Les accents minéraux donnent un caractère calme et analytique. | 0.04 |
| **Veille Littorale** | Une interface tactile évoquant un carnet d’observation maritime, avec des couches aquatiques et des annotations de terrain. Le ton est plus contemplatif que technique. | 0.09 |

## Approche retenue : Atlas Flux

### Design Movement

**Cartographie éditoriale contemporaine**, mêlant la clarté de la signalétique de transport à la matérialité de l’atlas imprimé. L’interface doit faire ressentir une observation active du territoire, et non une simple démonstration technique.

### Core Principles

1. **La carte est le sujet** : elle occupe le premier plan et les commandes la servent sans la concurrencer.
2. **Des informations hiérarchisées comme un relevé de terrain** : titre, métriques, légende et actions sont disposés en strates lisibles.
3. **Une matérialité utile** : encre sombre, papier minéral, lignes de contour et transparences fonctionnelles donnent de la profondeur sans décor superflu.
4. **Une interaction instrumentale** : chaque commande doit évoquer l’activation ou le réglage d’un instrument d’analyse.

### Color Philosophy

Un fond **charbon bleuté** réduit la fatigue visuelle et met les données lumineuses au premier plan. L’**orange cartographique** constitue la couleur de signature : un signal chaud et immédiatement repérable, réservé aux actions et aux trajectoires prioritaires. Des verts d’eau et jaunes doux servent aux variations de densité ; ils évoquent une lecture topographique plutôt qu’une esthétique néon.

### Layout Paradigm

Un **poste d’observation asymétrique** : une bande verticale de repères à gauche, une carte panoramique centrale, et des relevés suspendus dans les angles. Sur petit écran, ces éléments deviennent des feuilles superposées au-dessus de la carte, sans masquer l’espace d’exploration principal.

### Signature Elements

* Un symbole de **rose des vents abstraite**, constitué de quatre segments angulaires, repris dans le logo et les états actifs.
* Une **trame de coordonnées** discrète et des repères de grille autour des cadres.
* Des **lignes de contour interrompues** et de petits labels en capitales qui rappellent les cartes techniques.

### Interaction Philosophy

Les interactions doivent être sobres et explicites : les calques s’allument, les métriques changent de tonalité, et une sélection de zone dévoile un relevé ciblé. Les actions restent toujours accessibles au clavier et accompagnées d’un libellé clair.

### Animation

Les entrées utilisent une translation légère et une opacité progressive, décalées de 50 ms pour révéler les strates d’information. Les boutons utilisent une transition de 160 ms avec un léger enfoncement. Les trajectoires peuvent s’animer au chargement avec un balayage doux, mais aucune animation ne doit gêner le déplacement de la carte. Toutes les animations non essentielles respectent `prefers-reduced-motion`.

### Typography System

**Space Grotesk** apporte une structure précise aux titres, labels et chiffres ; **Source Serif 4** donne aux descriptifs une respiration éditoriale. Les libellés de contrôle sont en capitales espacées, les chiffres métriques sont grands et à chasse stable, les paragraphes restent courts et élégants.

### Brand Essence

**Atlas Flux est un observatoire cartographique interactif pour les équipes qui veulent lire les mouvements d’un territoire, pas seulement les afficher.**

Personnalité : **précis**, **vivant**, **méthodique**.

### Brand Voice

Une langue concise, factuelle et orientée vers l’observation. Les titres nomment un phénomène ; les CTA invitent à examiner ou isoler une couche.

* « Les flux dessinent la ville. »
* « Isoler la trajectoire active. »

### Wordmark & Logo

Le mot-symbole utilise des capitales compactes espacées, accompagnées d’une marque angulaire : une rose des vents réduite à quatre pointes opposées, avec un cœur ajouré. Le symbole doit être reconnaissable sans texte, lisible dans un favicon et visible dans l’en-tête.

### Signature Brand Color

**Orange Méridien — `#FF6B35`** : une couleur de repère énergique, utilisée avec retenue pour signaler le mouvement, la sélection et les appels à l’action.

## Style Decisions

* **Orange Méridien** reste réservé aux sélections actives, trajectoires prioritaires, actions principales et chiffres clés ; les couches secondaires se répartissent entre vert d’eau, jaune doux et neutres minéraux.
* Chaque section importante doit intégrer au moins une primitive cartographique Atlas Flux : repères de coordonnées, contour interrompu, segment de rose angulaire, label marginal ou règle graduée.
* Les sections claires doivent rester des **rapports de terrain imprimés** du même observatoire, avec trames, graduations et repères géographiques, plutôt que des blocs éditoriaux génériques.
* La rose des vents Atlas Flux devient un repère d’activation répété dans les panneaux, sélections et balises de relevé, au-delà du seul logotype.
* Les actions restent en français observationnel : elles proposent de recentrer, comparer ou produire un relevé, plutôt que d’employer des libellés utilitaires génériques.
* La carte conserve la priorité visuelle ; textes et contrôles doivent se lire comme des annotations instrumentales posées sur le territoire.

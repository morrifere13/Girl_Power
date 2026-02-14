# 🎨 Guide Visuel - Girl Power Application

## Vue d'Ensemble de l'Interface

### 🏠 Architecture Visuelle

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  ┌──────────┐  ┌────────────────────────────────────┐ │
│  │          │  │                                    │ │
│  │          │  │         ZONE DE CONTENU           │ │
│  │ SIDEBAR  │  │      (Tableau de bord, etc.)      │ │
│  │  (Fixe)  │  │                                    │ │
│  │          │  │                                    │ │
│  │          │  │                                    │ │
│  └──────────┘  └────────────────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 📱 Sidebar - Navigation Principale

### Layout de la Sidebar

```
╔═══════════════════════════════════╗
║  ┌─┐                              ║
║  │GP│  Girl Power      [≡]        ║
║     Gestion                       ║
╠═══════════════════════════════════╣
║                                   ║
║  📊  Tableau de bord             ║  <- Active (fond bleu)
║                                   ║
║  👥  Candidates                  ║
║                                   ║
║  ➕  Nouvelle Candidate          ║
║                                   ║
║  📈  Statistiques                ║
║                                   ║
╠═══════════════════════════════════╣
║  ACTIONS RAPIDES                 ║
║                                   ║
║  📥  Exporter                    ║
║                                   ║
║  📤  Importer                    ║
║                                   ║
╠═══════════════════════════════════╣
║  ┌──┐                            ║
║  │👤│  Admin                     ║
║  └──┘  Administrateur            ║
╚═══════════════════════════════════╝
```

### États de la Sidebar

**Mode Normal (256px de large)**
- Logo + Texte complet
- Icônes + Labels
- Section utilisateur visible

**Mode Réduit (80px de large)**
- Logo seul
- Icônes uniquement
- Pas de texte

**Mode Mobile**
- Header horizontal en haut
- Menu burger pour ouvrir la navigation

---

## 📝 Formulaire Multi-Étapes

### Navigation par Tabs

```
┌────────────────────────────────────────────────────────┐
│  [👤 Identité] [📞 Contact] [📍 Local] [📄 Docs]      │
│  [🎓 Formation] [👶 Enfants]                          │
└────────────────────────────────────────────────────────┘
     ↑ Active          ← Inactives →
```

### Section 1: Identité 👤

```
╔══════════════════════════════════════════════════════╗
║  👤 Informations d'Identité                         ║
╠══════════════════════════════════════════════════════╣
║                                                      ║
║  Nom *              │  Prénom *                     ║
║  [___________]      │  [___________]                ║
║                                                      ║
║  📅 Date naissance* │  Âge (calculé)               ║
║  [___________]      │  [___23___] (readonly)       ║
║                                                      ║
║  Sexe               │  Statut                       ║
║  [Féminin ▼]        │  [En attente ▼]              ║
║                                                      ║
╚══════════════════════════════════════════════════════╝

                    [Suivant →]
```

### Section 2: Contact 📞

```
╔══════════════════════════════════════════════════════╗
║  📞 Informations de Contact                         ║
╠══════════════════════════════════════════════════════╣
║                                                      ║
║  Téléphone          │  Email                        ║
║  📞 [_________]     │  ✉️ [_________]              ║
║                                                      ║
╚══════════════════════════════════════════════════════╝

        [← Précédent]  [Suivant →]
```

### Section 3: Localisation 📍

```
╔══════════════════════════════════════════════════════╗
║  📍 Localisation                                     ║
╠══════════════════════════════════════════════════════╣
║                                                      ║
║  Région *           │  Ville *                      ║
║  [NAWA ▼]          │  [Soubré______]              ║
║                                                      ║
║  Adresse complète                                   ║
║  🏠 [________________________________]              ║
║     [________________________________]              ║
║                                                      ║
╚══════════════════════════════════════════════════════╝

        [← Précédent]  [Suivant →]
```

### Section 4: Documents 📄

```
╔══════════════════════════════════════════════════════╗
║  📄 Documents d'Identité                            ║
╠══════════════════════════════════════════════════════╣
║                                                      ║
║  Type de document   │  Numéro du document          ║
║  [CNI ▼]           │  🆔 [_________]              ║
║                                                      ║
╚══════════════════════════════════════════════════════╝

        [← Précédent]  [Suivant →]
```

### Section 5: Formation 🎓

```
╔══════════════════════════════════════════════════════╗
║  🎓 Formation et Métier                             ║
╠══════════════════════════════════════════════════════╣
║                                                      ║
║  Diplôme            │  Métier choisi               ║
║  [BEPC ▼]          │  [Pâtisserie ▼]              ║
║                                                      ║
╚══════════════════════════════════════════════════════╝

        [← Précédent]  [Suivant →]
```

### Section 6: Enfants 👶

```
╔══════════════════════════════════════════════════════╗
║  👶 Enfants                                          ║
║                                                      ║
║  ☑ A des enfants    ☑ Enfants au centre            ║
╠══════════════════════════════════════════════════════╣
║                                                      ║
║  [+ Ajouter un enfant]                              ║
║                                                      ║
║  ┌────────────────────────────────────────────┐    ║
║  │ Enfant 1                            [🗑️]  │    ║
║  ├────────────────────────────────────────────┤    ║
║  │ Nom      │ Prénom    │ Date naiss.        │    ║
║  │ [_____]  │ [_____]   │ [_____]            │    ║
║  │                                             │    ║
║  │ Âge      │ Sexe      │ ☑ Au centre        │    ║
║  │ [__2__]  │ [M ▼]     │                     │    ║
║  └────────────────────────────────────────────┘    ║
║                                                      ║
╚══════════════════════════════════════════════════════╝

        [← Précédent]  [✓ Enregistrer]
```

---

## 📊 Tableau de Bord

### Cartes Statistiques (en haut)

```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  👥          │ │  🗺️          │ │  🏙️          │
│ CANDIDATES   │ │  RÉGIONS     │ │  VILLES      │
│     150      │ │      5       │ │     42       │
└──────────────┘ └──────────────┘ └──────────────┘

┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  👶          │ │  🏫          │ │  👩‍👧          │
│AVEC ENFANTS  │ │ENFTS CENTRE  │ │MÈRES CENTRE  │
│     78       │ │     34       │ │     34       │
└──────────────┘ └──────────────┘ └──────────────┘
```

### Sections TOP 5

```
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ TOP 5 RÉGIONS   │ │  TOP 5 VILLES   │ │  TOP 5 MÉTIERS  │
├─────────────────┤ ├─────────────────┤ ├─────────────────┤
│ NAWA       [84] │ │ Soubré     [70] │ │ Pâtisserie [45] │
│ GBOKLE     [31] │ │ Sago       [28] │ │ Coiffure   [32] │
│ ABIDJAN    [22] │ │ Guéyo      [15] │ │ Agro       [28] │
│ SAN PEDRO   [9] │ │ ...        [...] │ │ ...        [...] │
│ YAMOUSS.    [4] │ │ ...        [...] │ │ ...        [...] │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

### Graphiques de Répartition

```
┌─────────────────────────────────────┐
│ Répartition par Diplôme             │
├─────────────────────────────────────┤
│ CEPE       ████████████████ 69     │
│ BEPC       ████████ 15              │
│ Sans       ███████████████████ 66   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Répartition par Document            │
├─────────────────────────────────────┤
│ Aucun      ██████████████████ 105  │
│ CNI        ██ 15                    │
│ Extrait    █ 10                     │
└─────────────────────────────────────┘
```

---

## 👥 Liste des Candidates

### Vue en Liste (Tableau)

```
┌──────────────────────────────────────────────────────┐
│ 🔍 [Rechercher...]               [⊞ Filtres] [↻]   │
└──────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│  [≣ Liste]  [⊞ Cartes]     [📤 Importer] [📥 Exporter] │
└────────────────────────────────────────────────────────┘

╔════════════════════════════════════════════════════════╗
║ Nom & Prénom │ Âge │ Région/Ville │ Métier │ Actions ║
╠════════════════════════════════════════════════════════╣
║ KOUAME Aya   │ 23  │ NAWA/Soubré  │ Pât... │ 👁️✏️🗑️ ║
║ KOFFI Marie  │ 21  │ NAWA/Soubré  │ Coif.. │ 👁️✏️🗑️ ║
║ YAO Adjoua   │ 25  │ GBOKLE/Sago  │ Agro   │ 👁️✏️🗑️ ║
╚════════════════════════════════════════════════════════╝

            [← Précédent] Page 1/5 [Suivant →]
```

### Vue en Cartes

```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ KOUAME Aya   │ │ KOFFI Marie  │ │ YAO Adjoua   │
│ 23 ans       │ │ 21 ans       │ │ 25 ans       │
│ [En attente] │ │ [Acceptée]   │ │ [Formation]  │
├──────────────┤ ├──────────────┤ ├──────────────┤
│ NAWA/Soubré  │ │ NAWA/Soubré  │ │ GBOKLE/Sago  │
│ Pâtisserie   │ │ Coiffure     │ │ Agro-past.   │
│ CEPE         │ │ BEPC         │ │ CEPE         │
│ 2 enfants    │ │ 0 enfant     │ │ 1 enfant     │
├──────────────┤ ├──────────────┤ ├──────────────┤
│ [Voir] [Mod] │ │ [Voir] [Mod] │ │ [Voir] [Mod] │
└──────────────┘ └──────────────┘ └──────────────┘
```

---

## 🎨 Palette de Couleurs

### Couleurs Principales

```
Primary (Girl Power Pink):
┌────┐ #e74c64  Rose principal
│████│
└────┘

┌────┐ #d42d4f  Rose foncé (hover)
│████│
└────┘

┌────┐ #fde6e7  Rose clair (backgrounds)
│████│
└────┘
```

### Couleurs Secondaires

```
Bleu:        Vert:        Orange:      Violet:
┌────┐      ┌────┐      ┌────┐      ┌────┐
│████│      │████│      │████│      │████│
└────┘      └────┘      └────┘      └────┘
#3B82F6     #10B981     #F97316     #8B5CF6
```

### Couleurs de Statut

```
Success:     Warning:     Danger:      Info:
┌────┐      ┌────┐      ┌────┐      ┌────┐
│████│      │████│      │████│      │████│
└────┘      └────┘      └────┘      └────┘
#10B981     #F59E0B     #EF4444     #3B82F6

Acceptée     En attente   Refusée     Formation
```

---

## ✨ Animations et Interactions

### Boutons

```
État Normal:
┌─────────────────┐
│  ENREGISTRER    │  ← Ombre légère
└─────────────────┘

État Hover:
┌─────────────────┐
│  ENREGISTRER    │  ← Ombre forte + Légère élévation
└─────────────────┘  ↑ Transform: translateY(-2px)

État Actif:
┌─────────────────┐
│  ENREGISTRER    │  ← Couleur plus foncée
└─────────────────┘
```

### Cartes

```
État Normal:
╔═══════════════╗
║   Contenu     ║  ← border: gray-100
╚═══════════════╝    shadow: md

État Hover:
╔═══════════════╗
║   Contenu     ║  ← border: gray-200
╚═══════════════╝    shadow: xl
                     Transform: scale(1.02)
```

### Transitions

- **Durée**: 200ms (rapide), 300ms (normal)
- **Easing**: ease-out, ease-in-out
- **Propriétés animées**:
  - colors (couleurs)
  - shadow (ombres)
  - transform (transformations)
  - opacity (opacité)

---

## 📐 Espacements et Tailles

### Espacements Standards

```
Très petit:  0.5rem (8px)   gap-2, p-2
Petit:       1rem   (16px)  gap-4, p-4
Moyen:       1.5rem (24px)  gap-6, p-6
Large:       2rem   (32px)  gap-8, p-8
Très large:  3rem   (48px)  gap-12, p-12
```

### Rayons de Bordure

```
Petit:    rounded-lg   (8px)   ← Inputs, petits boutons
Moyen:    rounded-xl   (12px)  ← Boutons, badges
Large:    rounded-2xl  (16px)  ← Cartes, sections
Cercle:   rounded-full (50%)   ← Avatars, badges
```

### Tailles de Police

```
xs:    0.75rem  (12px)  ← Badges, légendes
sm:    0.875rem (14px)  ← Labels, texte secondaire
base:  1rem     (16px)  ← Texte normal
lg:    1.125rem (18px)  ← Titres de cartes
xl:    1.25rem  (20px)  ← Sous-titres
2xl:   1.5rem   (24px)  ← Titres de sections
3xl:   1.875rem (30px)  ← Titres de pages
4xl:   2.25rem  (36px)  ← Titres principaux
```

---

## 📱 Responsive Design

### Points de Rupture (Breakpoints)

```
Mobile:     < 640px   (sm)
Tablette:   640-1024px (md, lg)
Desktop:    > 1024px   (xl, 2xl)
```

### Adaptations par Écran

**Mobile (< 640px)**
```
┌────────────────┐
│ [≡] Girl Power │ ← Header horizontal
├────────────────┤
│                │
│    Contenu     │ ← 1 colonne
│   full width   │
│                │
└────────────────┘
```

**Tablette (640-1024px)**
```
┌──┬─────────────┐
│S │             │
│I │  Contenu    │ ← Sidebar réduite
│D │  2 colonnes │    + 2 colonnes
│E │             │
└──┴─────────────┘
```

**Desktop (> 1024px)**
```
┌──────┬──────────┐
│      │          │
│SIDE- │ Contenu  │ ← Sidebar complète
│ BAR  │3 colonnes│    + 3 colonnes
│      │          │
└──────┴──────────┘
```

---

## 🖨️ Mode Impression

Quand on imprime:

1. **Masqué**:
   - Sidebar
   - Boutons d'action
   - Navigation
   - Filtres

2. **Optimisé**:
   - Fond blanc
   - Bordures grises simples
   - Pas d'ombres
   - Pas d'animations

3. **Format**:
   - Format A4
   - Marges: 2cm
   - Police: noir sur blanc

---

## 🎯 Indicateurs Visuels

### États des Champs

```
Normal:      [___________]  ← border-gray-200
Hover:       [___________]  ← border-gray-300
Focus:       [___________]  ← border-primary-500 + ring
Erreur:      [___________]  ← border-red-500 + ring-red
Disabled:    [___________]  ← bg-gray-100 (readonly)
```

### Badges de Statut

```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│Acceptée  │ │En attente│ │ Refusée  │ │Formation │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
  bg-green    bg-yellow    bg-red      bg-blue
```

### Icônes

Toutes les icônes proviennent de **Lucide React**:
- Taille standard: 20px
- Taille cartes stats: 40-48px
- Couleur: Assortie au contexte

---

## 🔤 Typographie

### Police

```
Font Family:
'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
```

### Poids de Police

```
Regular:    font-normal  (400)  ← Texte standard
Medium:     font-medium  (500)  ← Labels
Semibold:   font-semibold (600) ← Boutons, titres secondaires
Bold:       font-bold    (700)  ← Titres principaux
```

### Style de Texte

```
Titre Page:      text-4xl font-bold text-gray-900
Titre Section:   text-2xl font-bold text-gray-900
Titre Carte:     text-xl font-bold text-gray-900
Label:           text-sm font-semibold text-gray-700 uppercase
Texte Normal:    text-base text-gray-900
Texte Sec.:      text-sm text-gray-600
Légende:         text-xs text-gray-500
```

---

## 💡 Conseils d'Utilisation

### Pour les Développeurs

1. **Classes CSS réutilisables**: Utilisez les classes custom (btn-primary, input-field, card, etc.)
2. **Espacements cohérents**: Utilisez les multiples de 4 (gap-4, p-6, mb-8)
3. **Couleurs sémantiques**: Utilisez primary pour Girl Power, blue/green/red pour contexte
4. **Animations**: Ajoutez transition-all duration-200 pour des transitions fluides

### Pour les Designers

1. **Cohérence**: Respectez la palette de couleurs définie
2. **Hiérarchie**: Utilisez les tailles de police définies
3. **Espacements**: Maintenez les espacements standards
4. **Accessibilité**: Contraste minimum AA (4.5:1) pour le texte

---

**🎨 Interface Girl Power - Design System Complet**
*Version 1.0 - Janvier 2026*

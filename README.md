# Girl Power - Application de Gestion des Candidates

Application web complète de gestion des candidates pour le programme Girl Power avec tableau de bord dynamique, recherche multi-critères et import/export Excel.

## Fonctionnalités Principales

### 1. Tableau de Bord Dynamique
- Statistiques en temps réel (nombre de candidates, régions, villes, enfants)
- TOP 5 des régions, villes et métiers
- Répartition par diplôme et type de document
- Statistiques d'âge des candidates et enfants
- Graphiques et visualisations dynamiques
- Fonction d'impression

### 2. Gestion des Candidates (CRUD Complet)
- **Créer**: Formulaire complet avec validation
- **Lire**: Liste avec pagination et détails individuels
- **Modifier**: Édition de toutes les informations
- **Supprimer**: Suppression avec confirmation

### 3. Recherche Multi-Critères
- Recherche textuelle globale
- Filtres par région, ville, métier, diplôme, document
- Filtre par présence d'enfants
- Filtres par tranche d'âge
- Combinaison de plusieurs critères

### 4. Affichage Flexible
- Vue en liste (tableau détaillé)
- Vue en cartes (cards)
- Basculement facile entre les vues
- Pagination intelligente

### 5. Import/Export Excel
- Export de toutes les candidates en Excel
- Export des statistiques en Excel (multi-feuilles)
- Import de candidates depuis Excel
- Rapport d'import avec erreurs

### 6. Gestion des Enfants
- Ajout multiple d'enfants par candidate
- Informations détaillées (nom, prénom, âge, sexe)
- Indication si enfants au centre
- Statistiques des enfants par sexe et âge

### 7. Impression
- Impression de fiches individuelles
- Impression du tableau de bord
- Format optimisé pour l'impression

## Architecture Technique

### Backend
- **Framework**: Node.js + Express
- **Base de données**: MySQL
- **API RESTful**: Endpoints complets CRUD
- **Packages**:
  - `express`: Framework web
  - `mysql2`: Client MySQL
  - `cors`: Gestion CORS
  - `multer`: Upload de fichiers
  - `xlsx`: Traitement Excel
  - `dotenv`: Variables d'environnement

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **Icons**: Lucide React

## Structure du Projet

```
girl-power-app/
├── backend/
│   ├── config/
│   │   └── db.js              # Configuration base de données
│   ├── routes/
│   │   ├── candidates.js      # Routes CRUD candidates
│   │   ├── stats.js           # Routes statistiques
│   │   └── export.js          # Routes import/export
│   ├── .env                   # Variables d'environnement
│   ├── server.js              # Point d'entrée backend
│   ├── database.sql           # Schéma de la base de données
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── Dashboard.jsx          # Tableau de bord
    │   │   ├── CandidatesList.jsx     # Liste des candidates
    │   │   ├── CandidateForm.jsx      # Formulaire création/édition
    │   │   └── CandidateDetails.jsx   # Détails d'une candidate
    │   ├── services/
    │   │   └── api.js                 # Service API
    │   ├── App.jsx                    # Composant principal
    │   ├── main.jsx                   # Point d'entrée
    │   └── index.css                  # Styles globaux
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```

## Installation et Lancement

### Prérequis
- Node.js 16+ et npm
- MySQL 5.7+ ou MariaDB 10+
- Un éditeur de code (VS Code recommandé)

### 1. Configuration de la Base de Données

```bash
# Se connecter à MySQL
mysql -u root -p

# Créer la base de données et importer le schéma
mysql -u root -p < backend/database.sql
```

Ou exécutez le contenu de `backend/database.sql` dans votre client MySQL.

### 2. Configuration du Backend

```bash
# Aller dans le dossier backend
cd backend

# Installer les dépendances
npm install

# Configurer les variables d'environnement
# Éditez le fichier .env avec vos paramètres MySQL:
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=votre_mot_de_passe
# DB_NAME=girl_power_db
# PORT=5000

# Lancer le serveur backend
npm start
# ou en mode développement avec auto-reload:
npm run dev
```

Le backend sera accessible sur http://localhost:5000

### 3. Configuration du Frontend

```bash
# Dans un nouveau terminal, aller dans le dossier frontend
cd frontend

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

Le frontend sera accessible sur http://localhost:3000

### 4. Accès à l'Application

Ouvrez votre navigateur et allez sur: **http://localhost:3000**

## Utilisation

### 1. Tableau de Bord
- Accédez à la page d'accueil pour voir toutes les statistiques
- Cliquez sur "Imprimer" pour imprimer le rapport

### 2. Gestion des Candidates

#### Ajouter une Candidate
1. Cliquez sur "Nouvelle Candidate" dans la navigation
2. Remplissez le formulaire (champs obligatoires marqués *)
3. Si la candidate a des enfants, cochez "A des enfants" et ajoutez-les
4. Cliquez sur "Sauvegarder"

#### Voir la Liste
1. Cliquez sur "Candidates" dans la navigation
2. Utilisez la barre de recherche pour rechercher
3. Cliquez sur "Filtres" pour affiner la recherche
4. Basculez entre vue liste et vue cartes avec les boutons en haut

#### Modifier une Candidate
1. Dans la liste, cliquez sur l'icône "Modifier"
2. Modifiez les informations
3. Cliquez sur "Sauvegarder"

#### Supprimer une Candidate
1. Dans la liste ou la fiche détail, cliquez sur "Supprimer"
2. Confirmez la suppression

#### Voir la Fiche Détaillée
1. Dans la liste, cliquez sur l'icône "Voir"
2. Consultez toutes les informations
3. Cliquez sur "Imprimer" pour imprimer la fiche

### 3. Import/Export Excel

#### Exporter
1. Dans la liste des candidates, cliquez sur "Exporter"
2. Le fichier Excel sera téléchargé automatiquement

#### Importer
1. Préparez un fichier Excel avec les colonnes appropriées
2. Dans la liste des candidates, cliquez sur "Importer"
3. Sélectionnez votre fichier
4. Un message vous indiquera le nombre de candidates importées

## Schéma de la Base de Données

### Table `candidates`
- Informations personnelles (nom, prénom, date de naissance, âge, sexe)
- Contact (téléphone, email)
- Localisation (région, ville, adresse)
- Documents (type, numéro)
- Formation (diplôme, métier choisi)
- Enfants (a_des_enfants, nombre_enfants, enfants_au_centre)
- Statut (En attente, Acceptée, Refusée, En formation)

### Table `enfants`
- Lien avec la candidate (candidate_id)
- Informations (nom, prénom, date de naissance, âge, sexe)
- Au centre (boolean)

## API Endpoints

### Candidates
- `GET /api/candidates` - Liste des candidates avec filtres
- `GET /api/candidates/:id` - Détails d'une candidate
- `POST /api/candidates` - Créer une candidate
- `PUT /api/candidates/:id` - Modifier une candidate
- `DELETE /api/candidates/:id` - Supprimer une candidate
- `GET /api/candidates/filters/options` - Options de filtres

### Statistiques
- `GET /api/stats/dashboard` - Statistiques du tableau de bord
- `GET /api/stats/region/:region` - Stats par région
- `GET /api/stats/ville/:ville` - Stats par ville

### Export/Import
- `GET /api/export/excel` - Exporter les candidates
- `GET /api/export/stats/excel` - Exporter les statistiques
- `POST /api/export/import` - Importer des candidates

## Technologies Utilisées

### Backend
- Node.js 18+
- Express 4.18
- MySQL2 3.6
- XLSX 0.18 (traitement Excel)
- Multer 1.4 (upload)
- CORS, dotenv, body-parser

### Frontend
- React 18.2
- Vite 5.0
- Tailwind CSS 3.3
- React Router DOM 6.20
- Axios 1.6
- Lucide React 0.294 (icônes)

## Fonctionnalités Avancées

### Calcul Automatique de l'Âge
- L'âge est calculé automatiquement à partir de la date de naissance
- Mise à jour dynamique dans le formulaire

### Pagination Intelligente
- Navigation entre les pages
- Affichage du nombre total de résultats
- Limite configurable par page

### Statistiques Dynamiques
- Toutes les statistiques sont calculées en temps réel
- Mise à jour automatique lors de modifications
- Visualisations claires et colorées

### Responsive Design
- Interface adaptée mobile, tablette et desktop
- Navigation optimisée pour tous les écrans
- Impression optimisée

## Dépannage

### Le backend ne démarre pas
- Vérifiez que MySQL est démarré
- Vérifiez les credentials dans le fichier `.env`
- Vérifiez que le port 5000 est libre

### Le frontend ne se connecte pas au backend
- Vérifiez que le backend tourne sur le port 5000
- Vérifiez la configuration du proxy dans `vite.config.js`
- Vérifiez les CORS dans le backend

### Erreur d'import Excel
- Vérifiez que le fichier Excel a les bonnes colonnes
- Vérifiez le format des dates
- Consultez le rapport d'erreurs après import

## Développement Future

### Améliorations Possibles
- Authentification et gestion des utilisateurs
- Upload de photos pour les candidates
- Export PDF des fiches
- Notifications par email
- Historique des modifications
- Tableau de bord avec graphiques interactifs (Chart.js)
- Application mobile (React Native)

## Support

Pour toute question ou problème:
- Consultez la documentation
- Vérifiez les logs du backend et frontend
- Contactez l'équipe de développement

## Licence

© 2026 Girl Power - Tous droits réservés

---

**Développé avec ❤️ pour Girl Power**

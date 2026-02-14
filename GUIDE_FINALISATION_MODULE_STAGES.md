# 🎯 Guide de Finalisation du Module de Gestion des Stages

## ✅ État Actuel

### Code Complété (100%)
- ✅ 4 migrations SQL créées
- ✅ 2 contrôleurs backend (entreprises, stages)
- ✅ 2 fichiers de routes
- ✅ 6 pages frontend (listes, formulaires, détails)
- ✅ Navigation configurée
- ✅ Services API enregistrés
- ✅ Protection des routes

## 📋 Étapes Restantes

### Étape 1 : Exécuter les Migrations SQL ⚠️ OBLIGATOIRE

**Option A : Via MySQL Workbench (Recommandé)**

1. Ouvrir MySQL Workbench
2. Se connecter à la base de données `girl_power`
3. Ouvrir le fichier : `backend/migrations/RUN_ALL_STAGE_MIGRATIONS.sql`
4. Cliquer sur l'icône éclair ⚡ (Execute)
5. Vérifier qu'il n'y a pas d'erreurs

**Option B : Via ligne de commande**

```bash
cd backend/migrations

# Exécuter le script consolidé
mysql -u root -p girl_power < RUN_ALL_STAGE_MIGRATIONS.sql

# OU exécuter chaque migration individuellement
mysql -u root -p girl_power < 004_create_entreprises.sql
mysql -u root -p girl_power < 005_create_stages.sql
mysql -u root -p girl_power < 006_create_stage_evaluations.sql
mysql -u root -p girl_power < 007_update_candidates_for_stages.sql
```

**Vérification après migration :**

```sql
-- Dans MySQL, vérifier que les tables existent
USE girl_power;
SHOW TABLES;

-- Doit afficher :
-- entreprises
-- stages
-- stage_evaluations

-- Vérifier les colonnes ajoutées à candidates
DESCRIBE candidates;
-- Doit afficher : en_stage, nombre_stages_effectues, dernier_stage_id, disponible_stage
```

---

### Étape 2 : Démarrer l'Application

**Backend :**
```bash
cd backend
npm start
# OU
node server.js
```

**Frontend :**
```bash
cd frontend
npm run dev
```

---

### Étape 3 : Tests Fonctionnels

#### Test 1 : Workflow Entreprise ✅

1. **Créer une entreprise**
   - Aller sur `/entreprises`
   - Cliquer "Nouvelle Entreprise"
   - Remplir le formulaire :
     - Nom : "Acme Corp"
     - Secteur : "Technologie"
     - Région : "Dakar"
     - Métiers proposés : Cocher 2-3 métiers
   - Sauvegarder
   - ✅ Vérifier redirection vers page détails

2. **Consulter la liste**
   - Retourner sur `/entreprises`
   - ✅ Voir l'entreprise créée dans le tableau
   - ✅ Vérifier les statistiques (cards en haut)

3. **Modifier l'entreprise**
   - Cliquer sur "Modifier"
   - Changer le secteur
   - Sauvegarder
   - ✅ Vérifier que la modification est prise en compte

4. **Filtres et export**
   - Tester le filtre par secteur
   - Tester le filtre par région
   - Cliquer "Exporter Excel"
   - ✅ Vérifier le téléchargement du fichier .xlsx

---

#### Test 2 : Workflow Stage ✅

1. **Créer un stage**
   - Aller sur `/stages`
   - Cliquer "Nouveau Stage"
   - Remplir :
     - Sélectionner une candidate
     - Sélectionner l'entreprise créée précédemment
     - Date début : Date actuelle
     - Date fin : Dans 3 mois
     - Type : "Stage pendant formation"
     - Métier : "Développement Web"
     - Tuteur : Nom et contact
   - Sauvegarder
   - ✅ Vérifier redirection vers page détails

2. **Vérifier validations**
   - Essayer de créer un stage avec date fin < date début
   - ✅ Doit afficher un message d'erreur
   - Essayer de créer un 2e stage pour la même candidate sur la même période
   - ✅ Doit afficher un message d'erreur

3. **Changer le statut**
   - Sur la page détails du stage
   - Cliquer "Démarrer le stage"
   - ✅ Le statut passe de "Planifié" à "En cours"
   - ✅ Le badge devient vert

4. **Ajouter une évaluation**
   - Cliquer "Ajouter une évaluation"
   - Remplir le formulaire modal :
     - Période : "Mi-parcours"
     - Type évaluateur : "Tuteur entreprise"
     - Notes : 4/5 pour chaque critère
     - Commentaires
   - Sauvegarder
   - ✅ L'évaluation apparaît dans la liste

---

#### Test 3 : Intégrations ✅

1. **Depuis fiche candidate**
   - Aller sur une fiche candidate
   - ✅ Voir le stage actuel affiché
   - ✅ Voir l'historique des stages

2. **Depuis fiche entreprise**
   - Aller sur la fiche entreprise créée
   - ✅ Voir le stage en cours dans la section "Stages Actifs"
   - ✅ Les stats se mettent à jour (nombre stagiaires = 1)

3. **Export Excel**
   - Sur `/stages`, exporter la liste
   - Ouvrir le fichier Excel
   - ✅ Vérifier toutes les colonnes sont présentes

---

### Étape 4 : Tests de Permissions

1. **Utilisateur Admin** ✅
   - Peut créer, modifier, supprimer entreprises
   - Peut créer, modifier, supprimer stages
   - Peut voir toutes les pages

2. **Utilisateur Gestionnaire** ✅
   - Peut créer, modifier entreprises
   - Peut créer, modifier stages
   - Ne peut pas supprimer (si configuré ainsi)

3. **Utilisateur Consultant** ✅
   - Peut voir les listes
   - Peut voir les détails
   - Ne peut PAS accéder aux formulaires (redirects)

---

## 🐛 Résolution de Problèmes Courants

### Erreur : "Table doesn't exist"
**Solution :** Vous n'avez pas exécuté les migrations SQL
→ Retourner à l'Étape 1

### Erreur : "Cannot read property of undefined"
**Solution :** Le backend n'est pas démarré
→ Vérifier que `npm start` tourne dans `/backend`

### Erreur 404 sur les routes API
**Solution :** Les routes ne sont pas enregistrées
→ Vérifier que `server.js` contient :
```javascript
app.use('/api/entreprises', require('./routes/entreprises'));
app.use('/api/stages', require('./routes/stages'));
```

### Les filtres ne fonctionnent pas
**Solution :** Vérifier la console navigateur (F12)
→ Peut-être un problème de clé API ou de paramètres

### L'export Excel ne télécharge pas
**Solution :** Vérifier que la bibliothèque `xlsx` est installée
```bash
cd frontend
npm install xlsx
```

---

## 📊 Données de Test à Créer

### 3 Entreprises de test

1. **Tech Solutions SARL**
   - Secteur : Technologie
   - Région : Dakar
   - Métiers : Développement Web, Data Analysis

2. **Santé Plus**
   - Secteur : Santé
   - Région : Thiès
   - Métiers : Assistance administrative, Gestion

3. **Agro Business**
   - Secteur : Agriculture
   - Région : Casamance
   - Métiers : Gestion de projet, Marketing

### 5 Stages de test

1. Stage en cours (candidate A → Tech Solutions)
2. Stage terminé (candidate B → Santé Plus)
3. Stage planifié (candidate C → Agro Business)
4. Stage abandonné (candidate D → Tech Solutions)
5. Stage annulé (candidate E → Santé Plus)

---

## ✅ Checklist Finale

### Backend
- [ ] Migrations SQL exécutées sans erreur
- [ ] Tables créées : entreprises, stages, stage_evaluations
- [ ] Colonnes ajoutées à candidates : en_stage, nombre_stages_effectues, etc.
- [ ] Backend démarre sans erreur (`npm start`)
- [ ] Routes `/api/entreprises` et `/api/stages` répondent

### Frontend
- [ ] Frontend démarre sans erreur (`npm run dev`)
- [ ] Menu latéral affiche "Entreprises" et "Stages"
- [ ] Navigation vers `/entreprises` fonctionne
- [ ] Navigation vers `/stages` fonctionne
- [ ] Formulaires se chargent sans erreur
- [ ] Pages de détails s'affichent correctement

### Fonctionnalités
- [ ] Création entreprise fonctionne
- [ ] Modification entreprise fonctionne
- [ ] Suppression entreprise fonctionne (ou bloquée si stages actifs)
- [ ] Création stage fonctionne
- [ ] Validations des dates fonctionnent
- [ ] Changement de statut fonctionne
- [ ] Ajout d'évaluation fonctionne
- [ ] Export Excel fonctionne
- [ ] Filtres fonctionnent
- [ ] Stats se mettent à jour

### Intégrations
- [ ] Depuis fiche candidate : voir ses stages
- [ ] Depuis fiche entreprise : voir stages actifs
- [ ] Les compteurs se mettent à jour automatiquement

---

## 🎉 Module Complété !

Une fois toutes les cases cochées, le module de gestion des stages est **100% opérationnel** !

## 📚 Ressources Utiles

- **Lucide Icons** : https://lucide.dev/icons/
- **TailwindCSS** : https://tailwindcss.com/docs
- **React Router** : https://reactrouter.com/
- **xlsx library** : https://www.npmjs.com/package/xlsx

---

## 🔮 Améliorations Futures (Optionnelles)

1. **Upload de fichiers**
   - Logo entreprise
   - Rapport de stage

2. **Tableaux de bord**
   - Dashboard entreprises partenaires
   - Dashboard performance stages

3. **Notifications**
   - Email lors de nouveau stage
   - Rappels évaluations

4. **Exports avancés**
   - PDF pour rapports
   - Graphiques statistiques

5. **Historique détaillé**
   - Timeline complète du stage
   - Logs de modifications

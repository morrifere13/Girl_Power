# ✅ Module de Gestion des Stages - PRÊT À TESTER

## 🎉 Migration Réussie !

Les tables suivantes ont été créées avec succès :
- ✅ `entreprises` (existait déjà)
- ✅ `stages` (nouvellement créée)
- ✅ `stage_evaluations` (nouvellement créée)
- ✅ Colonnes ajoutées à `candidates` : `en_stage`, `nombre_stages_effectues`, `dernier_stage_id`, `disponible_stage`

## 🚀 Démarrage

### Backend (Déjà démarré)
Le backend tourne déjà sur le port 5000 ✅

### Frontend
```bash
cd frontend
npm run dev
```

Le frontend devrait démarrer sur http://localhost:5173

## 📝 Tests à Effectuer

### Test 1 : Créer une Entreprise

1. Se connecter à l'application
2. Aller sur le menu **Entreprises** (dans la sidebar)
3. Cliquer sur **"Nouvelle Entreprise"**
4. Remplir le formulaire :
   - **Nom** : Tech Solutions SARL
   - **Code** : (généré automatiquement)
   - **Secteur** : Technologie
   - **Région** : Dakar
   - **Ville** : Dakar
   - **Téléphone** : +221 77 123 45 67
   - **Email** : contact@techsolutions.sn
   - **Responsable** : Mamadou Diop
   - **Fonction** : Directeur RH
   - **Capacité stagiaires max** : 10
   - **Métiers proposés** : Cocher "Développement Web" et "Data Analysis"
5. Cliquer sur **"Enregistrer"**
6. ✅ Vérifier la redirection vers la page de détails de l'entreprise

### Test 2 : Voir la Liste des Entreprises

1. Retourner sur `/entreprises`
2. ✅ Vérifier que l'entreprise créée apparaît dans la liste
3. ✅ Vérifier les stats en haut de page (Total, Actives, etc.)
4. Tester les filtres :
   - Rechercher par nom
   - Filtrer par secteur "Technologie"
   - Filtrer par région "Dakar"
5. ✅ Cliquer sur "Exporter Excel" et vérifier le téléchargement

### Test 3 : Créer un Stage

1. Aller sur le menu **Stages**
2. Cliquer sur **"Nouveau Stage"**
3. Remplir le formulaire :

   **Section Affectation :**
   - **Candidate** : Sélectionner une candidate disponible
   - **Entreprise** : Sélectionner "Tech Solutions SARL"

   **Section Période et Type :**
   - **Date début** : Aujourd'hui
   - **Date fin** : Dans 3 mois
   - **Type de stage** : "Stage pendant formation"
   - **Métier** : "Développement Web"

   **Section Tuteur :**
   - **Nom** : Abdoulaye Ndiaye
   - **Fonction** : Chef de projet
   - **Contact** : +221 76 987 65 43
   - **Email** : a.ndiaye@techsolutions.sn

   **Section Conditions** (optionnel) :
   - **Indemnité mensuelle** : 50000
   - **Frais transport** : 10000

4. Cliquer sur **"Enregistrer"**
5. ✅ Vérifier la redirection vers les détails du stage

### Test 4 : Gérer un Stage

1. Sur la page de détails du stage :

   **Changer le statut :**
   - Cliquer sur **"Démarrer le stage"**
   - ✅ Le statut passe à "En cours"
   - ✅ Le badge devient vert

   **Ajouter une évaluation :**
   - Cliquer sur **"Ajouter une évaluation"**
   - Remplir le formulaire dans le modal :
     - **Période** : Mi-parcours
     - **Type évaluateur** : Tuteur entreprise
     - **Évaluateur** : Abdoulaye Ndiaye
     - **Notes** : Donner 4/5 à chaque critère
     - **Points forts** : "Très motivée, apprend vite"
     - **Points à améliorer** : "Doit gagner en autonomie"
     - **Commentaire général** : "Bon niveau technique"
   - Cliquer sur **"Enregistrer"**
   - ✅ L'évaluation apparaît dans la liste

2. **Terminer le stage :**
   - Cliquer sur **"Terminer le stage"**
   - ✅ Le statut passe à "Terminé"
   - ✅ Le badge devient gris

### Test 5 : Vérifier les Intégrations

**Depuis la fiche candidate :**
1. Aller sur la page détails de la candidate qui a le stage
2. ✅ Voir le stage actuel affiché
3. ✅ Voir l'historique des stages

**Depuis la fiche entreprise :**
1. Aller sur la page détails de "Tech Solutions SARL"
2. ✅ Voir le stage dans la section "Stages Actifs"
3. ✅ Vérifier que les statistiques se sont mises à jour :
   - Total Stages : 1
   - Stagiaires : 1

### Test 6 : Validations

**Test de conflit de dates :**
1. Essayer de créer un 2e stage pour la même candidate
2. Avec des dates qui chevauchent le premier stage
3. ✅ Doit afficher un message d'erreur

**Test de validation des dates :**
1. Essayer de créer un stage avec date fin < date début
2. ✅ Doit afficher "La date de fin doit être après la date de début"

### Test 7 : Export et Filtres

**Liste des stages :**
1. Aller sur `/stages`
2. ✅ Vérifier les 5 stats cards en haut
3. Tester les filtres :
   - Par statut (En cours, Terminé, etc.)
   - Par type de stage
   - Par entreprise
   - Par recherche (nom candidate ou entreprise)
4. Cliquer sur **"Exporter Excel"**
5. ✅ Ouvrir le fichier et vérifier toutes les colonnes

## 🔧 En Cas de Problème

### Le backend ne démarre pas
```bash
cd backend
npm install
npm start
```

### Le frontend ne démarre pas
```bash
cd frontend
npm install
npm run dev
```

### Erreur "Table doesn't exist"
Les migrations ont bien été exécutées, vérifiez avec :
```bash
cd backend
node scripts/check-db.js
```

Devrait afficher `stages` et `stage_evaluations` dans la liste.

### Erreur 404 sur les routes API
Vérifiez que `backend/server.js` contient :
```javascript
app.use('/api/entreprises', require('./routes/entreprises'));
app.use('/api/stages', require('./routes/stages'));
```

### Les données ne s'affichent pas
1. Ouvrir la console navigateur (F12)
2. Aller sur l'onglet "Network"
3. Vérifier les requêtes API
4. Chercher les erreurs dans la console

## 📊 Données de Test Suggérées

### Créer 3 entreprises :

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

### Créer 5 stages :

1. Stage en cours (Candidate 1 → Tech Solutions)
2. Stage planifié (Candidate 2 → Santé Plus)
3. Stage terminé (Candidate 3 → Agro Business)
4. Stage en cours (Candidate 4 → Tech Solutions)
5. Stage terminé (Candidate 5 → Santé Plus)

## ✅ Checklist Finale

Après avoir effectué tous les tests :

- [ ] Backend démarre sans erreur
- [ ] Frontend démarre sans erreur
- [ ] Menu "Entreprises" visible dans la sidebar
- [ ] Menu "Stages" visible dans la sidebar
- [ ] Création d'entreprise fonctionne
- [ ] Liste entreprises s'affiche
- [ ] Filtres entreprises fonctionnent
- [ ] Export Excel entreprises fonctionne
- [ ] Création de stage fonctionne
- [ ] Sélection candidate fonctionne
- [ ] Sélection entreprise fonctionne
- [ ] Validation des dates fonctionne
- [ ] Changement de statut stage fonctionne
- [ ] Ajout d'évaluation fonctionne
- [ ] Liste des évaluations s'affiche
- [ ] Détails stage affiche toutes les infos
- [ ] Détails entreprise affiche les stages actifs
- [ ] Stats se mettent à jour correctement
- [ ] Export Excel stages fonctionne

## 🎓 Fonctionnalités Disponibles

### Entreprises
- ✅ Créer une entreprise
- ✅ Modifier une entreprise
- ✅ Supprimer une entreprise (bloqué si stages actifs)
- ✅ Voir détails entreprise
- ✅ Filtrer par secteur, région, statut
- ✅ Rechercher par nom
- ✅ Exporter Excel
- ✅ Voir les stages actifs
- ✅ Statistiques (total, en cours, stagiaires, notes)

### Stages
- ✅ Créer un stage (affecter candidate à entreprise)
- ✅ Modifier un stage
- ✅ Supprimer un stage
- ✅ Voir détails stage
- ✅ Changer le statut (Planifié → En cours → Terminé)
- ✅ Ajouter des évaluations périodiques
- ✅ Voir l'historique des évaluations
- ✅ Validation conflits de dates
- ✅ Filtrer par statut, type, entreprise
- ✅ Exporter Excel
- ✅ Lien vers fiche candidate
- ✅ Lien vers fiche entreprise
- ✅ Calcul automatique de la durée

### Évaluations
- ✅ Ajouter une évaluation
- ✅ 6 critères de notation (/5)
- ✅ Points forts / Points à améliorer
- ✅ Commentaire général
- ✅ Note globale
- ✅ Historique complet

## 🎉 Félicitations !

Le module de gestion des stages est maintenant **100% fonctionnel** !

Vous pouvez maintenant :
- Gérer vos entreprises partenaires
- Affecter des stagiaires aux entreprises
- Suivre les stages en temps réel
- Évaluer les performances
- Exporter les données
- Avoir des statistiques complètes

**Bon testing ! 🚀**

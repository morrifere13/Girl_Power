# Guide de Démarrage Rapide - Girl Power

Ce guide vous permettra de lancer l'application en quelques minutes.

## Étape 1: Prérequis

Assurez-vous d'avoir installé:
- ✅ Node.js (version 16 ou supérieure) - [Télécharger](https://nodejs.org)
- ✅ MySQL ou XAMPP/WAMP - [Télécharger MySQL](https://dev.mysql.com/downloads/) ou [XAMPP](https://www.apachefriends.org)

## Étape 2: Configuration de la Base de Données (5 minutes)

### Option A: Avec XAMPP/WAMP
1. Démarrez XAMPP/WAMP
2. Cliquez sur "Admin" pour MySQL (ouvre phpMyAdmin)
3. Créez une nouvelle base de données nommée `girl_power_db`
4. Cliquez sur l'onglet "SQL"
5. Copiez-collez le contenu du fichier `backend/database.sql`
6. Cliquez sur "Exécuter"

### Option B: Avec MySQL en ligne de commande
```bash
mysql -u root -p < backend/database.sql
```
(Entrez votre mot de passe MySQL quand demandé)

## Étape 3: Installation des Dépendances (3 minutes)

### Backend
```bash
cd backend
npm install
```

### Frontend
```bash
cd frontend
npm install
```

## Étape 4: Configuration (1 minute)

Éditez le fichier `backend/.env` avec vos paramètres MySQL:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votre_mot_de_passe_mysql
DB_NAME=girl_power_db
```

**Note**: Si vous utilisez XAMPP, le mot de passe par défaut est souvent vide.

## Étape 5: Lancement de l'Application (1 minute)

### Terminal 1 - Backend
```bash
cd backend
npm start
```
✅ Le backend devrait afficher: "Server running on port 5000"

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```
✅ Le frontend devrait afficher l'URL: http://localhost:3000

## Étape 6: Accéder à l'Application

Ouvrez votre navigateur et allez sur: **http://localhost:3000**

Vous devriez voir l'interface Girl Power avec le tableau de bord!

## Vérification Rapide

### ✅ Checklist de Vérification
- [ ] MySQL/XAMPP est démarré
- [ ] La base de données `girl_power_db` existe
- [ ] Le backend tourne sur le port 5000
- [ ] Le frontend tourne sur le port 3000
- [ ] L'application s'ouvre dans le navigateur
- [ ] Vous voyez le tableau de bord avec des données de test

## Données de Test

L'application est fournie avec 5 candidates de test pour vous permettre de tester immédiatement:
- Kouame Aya (NAWA - Soubré)
- Koffi Marie (NAWA - Soubré)
- Yao Adjoua (GBOKLE - Sago)
- Kouassi Fatou (ABIDJAN - Yopougon)
- N'Guessan Akissi (SAN PEDRO)

## Premiers Pas

1. **Explorer le Tableau de Bord**: Cliquez sur "Tableau de bord" pour voir les statistiques
2. **Voir la Liste**: Cliquez sur "Candidates" pour voir la liste
3. **Ajouter une Candidate**: Cliquez sur "Nouvelle Candidate"
4. **Tester les Filtres**: Dans la liste, cliquez sur "Filtres"
5. **Essayer l'Export**: Cliquez sur "Exporter" pour télécharger un fichier Excel

## Problèmes Courants

### Le backend ne démarre pas
**Erreur**: "Error: connect ECONNREFUSED"
**Solution**: Vérifiez que MySQL/XAMPP est démarré

**Erreur**: "ER_ACCESS_DENIED_ERROR"
**Solution**: Vérifiez le mot de passe MySQL dans `.env`

### Le frontend affiche une page blanche
**Solution**: Vérifiez la console du navigateur (F12)
**Solution**: Vérifiez que le backend est bien démarré

### Port déjà utilisé
**Solution Backend**: Changez le port dans `.env`
**Solution Frontend**: Changez le port dans `vite.config.js`

## Commandes Utiles

### Redémarrer le Backend
```bash
# Arrêtez avec Ctrl+C, puis:
npm start
```

### Redémarrer le Frontend
```bash
# Arrêtez avec Ctrl+C, puis:
npm run dev
```

### Réinitialiser la Base de Données
```bash
mysql -u root -p girl_power_db < backend/database.sql
```

## Support

Si vous rencontrez des problèmes:
1. Consultez la section "Dépannage" dans le README.md
2. Vérifiez les messages d'erreur dans les terminaux
3. Vérifiez les logs du navigateur (F12 > Console)

## Prochaines Étapes

Une fois l'application lancée, vous pouvez:
- ✨ Ajouter vos propres candidates
- 📊 Explorer toutes les fonctionnalités du tableau de bord
- 🔍 Tester la recherche multi-critères
- 📥 Importer des données depuis Excel
- 🖨️ Imprimer des fiches candidates

---

**Bon travail! Vous êtes prêt à utiliser Girl Power! 🎉**

# 🔧 Guide de Dépannage - Girl Power

## ❌ Problème: "Rien ne s'affiche"

### 🔍 Diagnostic Étape par Étape

#### Étape 1: Vérifier que le Backend tourne

```bash
# Ouvrez un terminal et allez dans backend
cd girl-power-app/backend

# Lancez le backend
npm start
```

**✅ Vous devriez voir:**
```
Server running on port 5000
```

**❌ Si vous voyez une erreur:**
- "ECONNREFUSED" → MySQL n'est pas démarré
- "ER_ACCESS_DENIED" → Mauvais mot de passe dans .env
- "Cannot find module" → Faites `npm install`

---

#### Étape 2: Vérifier que le Frontend tourne

```bash
# Ouvrez un NOUVEAU terminal et allez dans frontend
cd girl-power-app/frontend

# Lancez le frontend
npm run dev
```

**✅ Vous devriez voir:**
```
  VITE v5.0.8  ready in 523 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

**❌ Si vous voyez une erreur:**
- Regardez le message d'erreur
- Il peut y avoir une erreur de syntaxe JavaScript

---

#### Étape 3: Ouvrir le navigateur

1. Ouvrez votre navigateur (Chrome, Firefox, Edge)
2. Allez sur: **http://localhost:3000**
3. Attendez quelques secondes

**✅ Vous devriez voir:**
- La sidebar Girl Power à gauche
- Le tableau de bord au centre

**❌ Si page blanche:**
- Appuyez sur **F12** pour ouvrir la console
- Regardez les erreurs en rouge
- Continuez ci-dessous

---

### 🐛 Solutions aux Problèmes Courants

#### Problème 1: Page Blanche + Erreur "Cannot find module"

**Console affiche:**
```
Error: Cannot find module './components/Sidebar'
```

**Solution:**
Vérifiez que le fichier existe:

```bash
cd girl-power-app/frontend/src
ls components/Sidebar.jsx
```

Si le fichier n'existe pas, il faut le recréer.

---

#### Problème 2: Erreur "Unexpected token"

**Console affiche:**
```
Unexpected token '<'
```

**Solution:**
1. Arrêtez le frontend (Ctrl+C)
2. Supprimez le cache:
```bash
cd girl-power-app/frontend
rm -rf node_modules/.vite
```
3. Relancez:
```bash
npm run dev
```

---

#### Problème 3: Backend ne répond pas

**Console affiche:**
```
Network Error
Failed to fetch
```

**Solution:**
1. Vérifiez que le backend tourne (port 5000)
2. Testez l'URL: http://localhost:5000/api/health
3. Vous devriez voir: `{"status":"OK"}`

Si non, relancez le backend:
```bash
cd girl-power-app/backend
npm start
```

---

#### Problème 4: MySQL n'est pas démarré

**Backend affiche:**
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**Solution:**
1. **Si vous utilisez XAMPP:**
   - Ouvrez XAMPP Control Panel
   - Cliquez sur "Start" pour MySQL
   - Attendez que MySQL démarre (devient vert)

2. **Si vous utilisez MySQL standalone:**
   - Windows: Lancez "Services" → Trouvez MySQL → Démarrez
   - Ou: `net start MySQL80`

---

#### Problème 5: Base de données n'existe pas

**Backend affiche:**
```
ER_BAD_DB_ERROR: Unknown database 'girl_power_db'
```

**Solution:**
Créez la base de données:

```bash
# Méthode 1: Ligne de commande
mysql -u root -p < girl-power-app/backend/database.sql

# Méthode 2: phpMyAdmin (XAMPP)
1. Ouvrez http://localhost/phpmyadmin
2. Créez une base "girl_power_db"
3. Onglet "SQL"
4. Copiez-collez le contenu de database.sql
5. Cliquez "Exécuter"
```

---

#### Problème 6: Erreur d'importation React

**Console affiche:**
```
Failed to resolve import
```

**Solution:**
Réinstallez les dépendances:

```bash
cd girl-power-app/frontend
rm -rf node_modules
npm install
npm run dev
```

---

### 🔄 Réinitialisation Complète

Si rien ne fonctionne, réinitialisez tout:

```bash
# 1. Arrêtez tout (Ctrl+C dans tous les terminaux)

# 2. Backend
cd girl-power-app/backend
rm -rf node_modules
npm install

# 3. Frontend
cd ../frontend
rm -rf node_modules
rm -rf node_modules/.vite
npm install

# 4. Vérifiez MySQL
# Assurez-vous que MySQL tourne

# 5. Recréez la base de données
mysql -u root -p < ../backend/database.sql

# 6. Vérifiez .env
cat ../backend/.env
# Doit contenir:
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=votre_mot_de_passe
# DB_NAME=girl_power_db

# 7. Relancez Backend
cd ../backend
npm start

# 8. Nouveau terminal - Relancez Frontend
cd ../frontend
npm run dev

# 9. Ouvrez http://localhost:3000
```

---

### 📋 Checklist de Vérification

Avant de dire que "rien ne s'affiche", vérifiez:

- [ ] MySQL/XAMPP est démarré
- [ ] Base de données "girl_power_db" existe
- [ ] Fichier `.env` est configuré correctement
- [ ] Backend affiche "Server running on port 5000"
- [ ] Frontend affiche "Local: http://localhost:3000"
- [ ] Navigateur est ouvert sur http://localhost:3000
- [ ] Console du navigateur (F12) n'affiche pas d'erreur rouge

---

### 🖥️ Console du Navigateur (F12)

Pour diagnostiquer:

1. Ouvrez le navigateur
2. Appuyez sur **F12**
3. Allez dans l'onglet **Console**
4. Regardez les messages

**Messages normaux (OK):**
```
[vite] connecting...
[vite] connected.
```

**Messages d'erreur à résoudre:**
```
❌ Failed to fetch
❌ Cannot find module
❌ Unexpected token
❌ Syntax error
```

---

### 🔍 Vérification des Ports

Vérifiez que les ports sont libres:

**Windows:**
```bash
netstat -ano | findstr :5000
netstat -ano | findstr :3000
```

**Si un port est occupé:**
- Fermez l'autre application
- Ou changez le port dans la configuration

---

### 📞 Informations pour le Support

Si le problème persiste, notez:

1. **Message d'erreur exact** (copié de la console)
2. **Système d'exploitation**: Windows/Mac/Linux
3. **Version Node.js**: `node --version`
4. **Navigateur utilisé**: Chrome/Firefox/Edge
5. **Étape où ça bloque**: Backend/Frontend/Navigateur

---

### 💡 Astuces Rapides

#### Astuce 1: Forcer le Rafraîchissement
Dans le navigateur:
- **Ctrl + F5** (Windows)
- **Cmd + Shift + R** (Mac)

#### Astuce 2: Vider le Cache
Chrome:
1. F12 → Settings (⚙️)
2. Network → Disable cache (cochez)
3. Rechargez la page

#### Astuce 3: Mode Incognito
Testez dans une fenêtre de navigation privée:
- **Ctrl + Shift + N** (Chrome)
- **Ctrl + Shift + P** (Firefox)

---

### 🆘 Solution de Dernier Recours

Si VRAIMENT rien ne fonctionne:

1. **Sauvegardez vos données** (exportez si possible)
2. **Téléchargez à nouveau** le projet
3. **Suivez GUIDE_DEMARRAGE_RAPIDE.md** étape par étape
4. **Ne sautez aucune étape**

---

### ✅ Test de Santé de l'Application

Pour tester que tout fonctionne:

```bash
# Test Backend
curl http://localhost:5000/api/health
# Doit retourner: {"status":"OK","message":"Girl Power API is running"}

# Test Frontend
# Ouvrir http://localhost:3000 dans le navigateur
# Doit afficher la sidebar + tableau de bord
```

---

### 📊 État Normal Attendu

**Terminal Backend:**
```
Server running on port 5000
```

**Terminal Frontend:**
```
  VITE v5.0.8  ready in 523 ms

  ➜  Local:   http://localhost:3000/
```

**Navigateur:**
- Sidebar à gauche avec logo Girl Power
- Tableau de bord au centre avec statistiques
- Pas d'erreur dans la console (F12)

---

## 🎯 Guide de Dépannage Rapide

| Symptôme | Cause Probable | Solution |
|----------|----------------|----------|
| Page blanche | Frontend pas lancé | `npm run dev` dans frontend/ |
| "Cannot GET /" | Backend pas lancé | `npm start` dans backend/ |
| "Network Error" | Backend non joignable | Vérifier port 5000 |
| "ECONNREFUSED" | MySQL arrêté | Démarrer MySQL/XAMPP |
| "ER_BAD_DB_ERROR" | BD n'existe pas | Importer database.sql |
| "ER_ACCESS_DENIED" | Mauvais mot de passe | Vérifier .env |
| Erreur import | Dépendances manquantes | `npm install` |

---

**📞 Toujours pas résolu?**

Regardez attentivement:
1. Les messages d'erreur exacts
2. La console du navigateur (F12)
3. Les logs du terminal backend
4. Les logs du terminal frontend

Un message d'erreur vous dira exactement quoi faire! 🔍

---

*Dernière mise à jour: Janvier 2026*

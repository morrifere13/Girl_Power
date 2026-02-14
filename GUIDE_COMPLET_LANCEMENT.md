# 🚀 Guide Complet de Lancement - Girl Power

## ✅ Vous avez dit: "Aucun message d'erreur dans la console"

C'est une bonne nouvelle! Cela signifie que:
- Le navigateur fonctionne ✅
- Pas d'erreur JavaScript ✅

Mais si vous ne voyez rien, c'est probablement que les **serveurs ne sont pas lancés**.

---

## 📋 Méthode 1: Script Automatique (RECOMMANDÉ)

J'ai créé un script qui fait tout pour vous!

### Étape 1: Double-cliquez sur `verifier.bat`

```
📁 girl-power-app/
   ├── verifier.bat  ← Double-cliquez ici!
```

### Étape 2: Choisissez l'option 4

```
Que voulez-vous faire?
1. Vérifier si les serveurs tournent
2. Lancer le Backend
3. Lancer le Frontend
4. Lancer les DEUX (Backend + Frontend)  ← Choisissez cette option
5. Réinstaller les dépendances
6. Quitter

Votre choix (1-6): 4
```

### Étape 3: Attendez

Deux fenêtres vont s'ouvrir:
- **Fenêtre 1**: Backend (port 5000)
- **Fenêtre 2**: Frontend (port 3000)

Attendez de voir:
- Backend: `Server running on port 5000`
- Frontend: `Local: http://localhost:3000`

### Étape 4: Ouvrez le navigateur

Allez sur: **http://localhost:3000**

---

## 📋 Méthode 2: Manuel (Si script ne marche pas)

### Terminal 1: Backend

```bash
# Ouvrez PowerShell ou CMD
cd girl-power-app/backend
npm start
```

**✅ Attendez de voir:**
```
Server running on port 5000
```

**❌ Si vous voyez "npm : command not found":**
→ Node.js n'est pas installé. Installez-le depuis: https://nodejs.org

**❌ Si vous voyez "Cannot find module":**
```bash
npm install
npm start
```

**❌ Si vous voyez "ECONNREFUSED":**
→ MySQL n'est pas démarré. Lancez XAMPP.

---

### Terminal 2: Frontend

```bash
# Ouvrez un NOUVEAU PowerShell ou CMD
cd girl-power-app/frontend
npm run dev
```

**✅ Attendez de voir:**
```
  VITE v5.0.8  ready in 523 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

**❌ Si vous voyez "Cannot find module":**
```bash
npm install
npm run dev
```

---

### Navigateur

Ouvrez: **http://localhost:3000**

**✅ Vous devriez voir:**
- Sidebar Girl Power à gauche
- Tableau de bord au centre

---

## 🔍 Diagnostic: Qu'est-ce qui NE S'AFFICHE PAS?

### Cas 1: Page Complètement Blanche

**Vérifiez dans la console du navigateur (F12):**

Si vous voyez rien dans Console, vérifiez l'onglet **Network**:
- Appuyez sur F12
- Onglet "Network"
- Rafraîchissez (F5)
- Regardez si des fichiers sont chargés

**Si aucun fichier n'apparaît:**
→ Le frontend n'est PAS lancé

**Solution:**
```bash
cd girl-power-app/frontend
npm run dev
```

---

### Cas 2: Page avec Fond Gris Mais Pas de Contenu

**Cela signifie:**
- Le frontend est lancé ✅
- Le CSS est chargé ✅
- Mais les composants ne s'affichent pas ❌

**Vérifiez le terminal frontend:**

Cherchez des erreurs comme:
```
[vite] Internal server error
Failed to resolve import
```

**Solution:**
```bash
cd girl-power-app/frontend
rm -rf node_modules
npm install
npm run dev
```

---

### Cas 3: Vous Voyez la Sidebar Mais Pas le Contenu

**Cela signifie:**
- Le frontend marche ✅
- La sidebar s'affiche ✅
- Mais le backend ne répond pas ❌

**Vérifiez:**
1. Le terminal backend affiche bien "Server running on port 5000"
2. Testez: http://localhost:5000/api/health

**Si page d'erreur:**
→ Le backend n'est PAS lancé

**Solution:**
```bash
cd girl-power-app/backend
npm start
```

---

## 🔧 Commandes de Test

### Test 1: Backend marche?

```bash
curl http://localhost:5000/api/health
```

**✅ Doit retourner:**
```json
{"status":"OK","message":"Girl Power API is running"}
```

**❌ Si erreur:**
→ Backend pas lancé. Faites: `cd backend && npm start`

---

### Test 2: Frontend marche?

Ouvrez dans le navigateur: **http://localhost:3000**

**✅ Doit afficher:** La sidebar + le dashboard

**❌ Si erreur "Cannot GET /":**
→ Frontend pas lancé. Faites: `cd frontend && npm run dev`

---

## 📸 À quoi ça DOIT ressembler

### Terminal Backend:
```
> node server.js

Server running on port 5000
```

### Terminal Frontend:
```
> vite

  VITE v5.0.8  ready in 523 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

### Navigateur sur http://localhost:3000:
```
┌─────────┬────────────────────────────┐
│  Girl   │                            │
│  Power  │     TABLEAU DE BORD        │
│         │                            │
│ 📊 Dash │  [Statistiques colorées]   │
│ 👥 Cand │                            │
│ ➕ New  │                            │
└─────────┴────────────────────────────┘
```

---

## 🆘 Encore Rien?

### Dernière Solution: Tout Réinstaller

```bash
# 1. Fermez TOUS les terminaux (Ctrl+C)

# 2. Supprimez les node_modules
cd girl-power-app
rmdir /s /q backend\node_modules
rmdir /s /q frontend\node_modules

# 3. Réinstallez TOUT
cd backend
npm install
cd ..\frontend
npm install

# 4. Relancez
# Terminal 1:
cd ..\backend
npm start

# Terminal 2 (nouveau):
cd frontend
npm run dev

# 5. Ouvrez: http://localhost:3000
```

---

## 📞 Informations à Me Donner

Si vraiment rien ne marche, envoyez-moi:

1. **Ce que vous voyez dans le terminal Backend:**
   ```
   [Copiez-collez ici le texte du terminal backend]
   ```

2. **Ce que vous voyez dans le terminal Frontend:**
   ```
   [Copiez-collez ici le texte du terminal frontend]
   ```

3. **Ce que vous voyez dans le navigateur:**
   - Page blanche?
   - Fond gris?
   - Sidebar visible?
   - Erreur?

4. **URL dans la barre d'adresse:**
   ```
   [Quelle URL avez-vous tapé?]
   ```

---

## ✅ Checklist Finale

Avant de dire que ça ne marche pas:

- [ ] MySQL/XAMPP est démarré (vert)
- [ ] Terminal backend affiche "Server running on port 5000"
- [ ] Terminal frontend affiche "Local: http://localhost:3000"
- [ ] J'ai ouvert **http://localhost:3000** (pas autre chose)
- [ ] J'ai attendu 10 secondes
- [ ] J'ai rafraîchi avec F5
- [ ] J'ai vérifié la console (F12) - onglet Console
- [ ] J'ai vérifié l'onglet Network (F12)

---

## 🎯 Scripts Créés Pour Vous

J'ai créé ces fichiers pour faciliter le lancement:

1. **verifier.bat** ← Vérifie et lance tout
2. **test-serveurs.bat** ← Teste si les serveurs tournent
3. **start.bat** ← Lance les deux serveurs
4. **install.bat** ← Installe les dépendances

**Utilisez-les!** Double-cliquez dessus.

---

**💡 Dans 99% des cas, le problème est simplement que les serveurs ne sont pas lancés!**

**✅ Lancez-les et tout fonctionnera!**

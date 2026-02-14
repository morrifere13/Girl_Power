# ⚡ SOLUTION RAPIDE - Rien ne s'affiche

## 🚨 Problème: Page Blanche

### ✅ Solution en 5 Minutes

#### 1️⃣ Arrêtez Tout
Fermez tous les terminaux (Ctrl+C)

#### 2️⃣ Démarrez MySQL
- **XAMPP**: Ouvrez XAMPP → Start MySQL (attendez qu'il soit vert)
- **Standalone**: Lancez MySQL depuis Services

#### 3️⃣ Lancez le Backend

```bash
# Terminal 1
cd girl-power-app/backend
npm start
```

**✅ Attendez de voir:**
```
Server running on port 5000
```

**❌ Si erreur, faites:**
```bash
npm install
npm start
```

#### 4️⃣ Lancez le Frontend

```bash
# Terminal 2 (NOUVEAU terminal)
cd girl-power-app/frontend
npm run dev
```

**✅ Attendez de voir:**
```
Local: http://localhost:3000
```

**❌ Si erreur, faites:**
```bash
npm install
npm run dev
```

#### 5️⃣ Ouvrez le Navigateur

- Allez sur: **http://localhost:3000**
- Attendez 5-10 secondes
- Appuyez sur **F5** pour rafraîchir

---

## 🔴 Si Toujours Rien

### Option A: Page Blanche

**Ouvrez la Console (F12):**

1. Dans le navigateur, appuyez sur **F12**
2. Regardez l'onglet **Console**
3. Notez l'erreur en rouge

**Erreurs Courantes:**

**"Cannot find module"**
→ Fichier manquant
```bash
cd girl-power-app/frontend
npm install
npm run dev
```

**"Failed to fetch"**
→ Backend pas lancé
```bash
cd girl-power-app/backend
npm start
```

---

### Option B: Utiliser l'Ancienne Version

Si la nouvelle version ne fonctionne pas, revenez à l'ancienne:

```bash
# Ouvrez: girl-power-app/frontend/src/App.jsx
# Changez la ligne 5:

# DE:
import CandidateForm from './pages/CandidateFormNew'

# À:
import CandidateForm from './pages/CandidateForm'
```

Puis relancez:
```bash
cd girl-power-app/frontend
npm run dev
```

---

## 🔄 Réinstallation Express (3 min)

Si vraiment rien ne marche:

```bash
# 1. Backend
cd girl-power-app/backend
rm -rf node_modules
npm install

# 2. Frontend
cd ../frontend
rm -rf node_modules
npm install

# 3. Relancez tout
# Terminal 1:
cd girl-power-app/backend
npm start

# Terminal 2:
cd girl-power-app/frontend
npm run dev

# 4. Ouvrez: http://localhost:3000
```

---

## 📞 Checklist Ultra-Rapide

Avant de chercher plus loin:

- [ ] MySQL/XAMPP est vert (démarré)
- [ ] Terminal 1 affiche "Server running on port 5000"
- [ ] Terminal 2 affiche "Local: http://localhost:3000"
- [ ] J'ai attendu 10 secondes
- [ ] J'ai rafraîchi avec F5
- [ ] Pas d'erreur rouge dans la console (F12)

---

## 💡 Commande Magique

Si vous ne savez plus quoi faire:

```bash
# WINDOWS PowerShell
cd girl-power-app

# Installer tout
cd backend; npm install; cd ../frontend; npm install; cd ..

# Lancer (2 terminaux séparés)
# Terminal 1:
cd backend; npm start

# Terminal 2:
cd frontend; npm run dev
```

---

## 🎯 Test Simple

Pour vérifier que ça marche:

**Test 1: Backend**
Ouvrez: http://localhost:5000/api/health
Doit afficher: `{"status":"OK"}`

**Test 2: Frontend**
Ouvrez: http://localhost:3000
Doit afficher: Sidebar + Dashboard

---

## 📖 Documentation Complète

Pour plus de détails:
- **DEPANNAGE.md** - Guide complet
- **GUIDE_DEMARRAGE_RAPIDE.md** - Installation
- **README.md** - Documentation technique

---

**⚡ Dans 99% des cas, le problème est:**
1. MySQL pas démarré
2. Backend pas lancé
3. Frontend pas lancé
4. Mauvaise URL dans le navigateur

**✅ Vérifiez ces 4 points en premier!**

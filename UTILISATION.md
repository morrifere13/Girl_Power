# 🚀 Guide d'Utilisation Rapide - Girl Power

## ✨ Lancer l'Application (Toutes les Méthodes)

### Méthode 1: Commande NPM (Recommandée) ⚡

```bash
cd girl-power-app
npm run full
```

C'est tout! Les deux serveurs vont démarrer automatiquement.

---

### Méthode 2: Double-Clic sur run.bat 🖱️

1. Allez dans le dossier `girl-power-app`
2. Double-cliquez sur **`run.bat`**
3. Attendez 5 secondes
4. Le navigateur s'ouvre automatiquement!

---

### Méthode 3: Script Complet lancer-tout.bat 📋

1. Double-cliquez sur **`lancer-tout.bat`**
2. Suivez les instructions à l'écran
3. Appuyez sur une touche pour ouvrir le navigateur

---

### Méthode 4: Script Interactif verifier.bat 🔧

1. Double-cliquez sur **`verifier.bat`**
2. Choisissez l'option **4** (Lancer les DEUX serveurs)
3. Deux fenêtres s'ouvrent
4. Ouvrez http://localhost:3000

---

### Méthode 5: Manuel (Si vous préférez) 💻

**Terminal 1:**
```bash
cd girl-power-app/backend
npm start
```

**Terminal 2:**
```bash
cd girl-power-app/frontend
npm run dev
```

**Navigateur:**
```
http://localhost:3000
```

---

## 📋 Tous les Scripts NPM Disponibles

Depuis le dossier `girl-power-app`:

```bash
# Lancer tout (backend + frontend)
npm run full

# Même chose avec "dev"
npm run dev

# Même chose avec "start"
npm start

# Installer toutes les dépendances
npm run install-all

# Lancer uniquement le backend
npm run backend

# Lancer uniquement le frontend
npm run frontend
```

---

## 🎯 La Plus Simple: npm run full

```bash
# 1. Ouvrez PowerShell/CMD
# 2. Allez dans le dossier
cd C:\Users\Aidara\Desktop\Girl_Power_2026\girl-power-app

# 3. Lancez
npm run full

# 4. Attendez de voir les deux fenêtres s'ouvrir
# 5. Ouvrez http://localhost:3000
```

---

## 📁 Tous les Fichiers de Lancement

Dans le dossier `girl-power-app`:

| Fichier | Description | Comment l'utiliser |
|---------|-------------|-------------------|
| **run.bat** | Lance tout rapidement | Double-clic |
| **lancer-tout.bat** | Lance tout avec instructions | Double-clic |
| **verifier.bat** | Menu interactif | Double-clic → Choisir 4 |
| **start.bat** | Original, lance les deux | Double-clic |
| **package.json** | Scripts NPM | `npm run full` |

---

## ✅ Ce qui va se passer

Quand vous lancez avec **`npm run full`** ou les scripts `.bat`:

1. **Fenêtre 1 s'ouvre** - Backend
   - Affiche: `Server running on port 5000`

2. **Fenêtre 2 s'ouvre** - Frontend
   - Affiche: `Local: http://localhost:3000`

3. **Navigateur s'ouvre** (pour lancer-tout.bat)
   - URL: http://localhost:3000
   - Vous voyez la sidebar + dashboard

---

## 🛑 Arrêter l'Application

Pour arrêter les serveurs:

**Si lancé avec npm run full:**
- Fermez les deux fenêtres qui se sont ouvertes

**Si lancé manuellement:**
- Dans chaque terminal: **Ctrl + C**

---

## 🔧 Première Installation

Si c'est la première fois:

```bash
cd girl-power-app

# Installer toutes les dépendances
npm run install-all

# Puis lancer
npm run full
```

---

## 💡 Astuces

### Astuce 1: Créer un Raccourci
Faites un clic droit sur `run.bat` → Créer un raccourci → Placez-le sur le Bureau

### Astuce 2: Épingler à la Barre des Tâches
Épinglez le raccourci pour un accès ultra-rapide

### Astuce 3: Alias PowerShell
Ajoutez dans votre profil PowerShell:
```powershell
function girlpower { cd C:\Users\Aidara\Desktop\Girl_Power_2026\girl-power-app; npm run full }
```

Puis utilisez simplement: `girlpower`

---

## 📊 Tableau Comparatif

| Méthode | Avantages | Utilisation |
|---------|-----------|-------------|
| **npm run full** | • Une seule commande<br>• Standard NPM | Développeurs |
| **run.bat** | • Double-clic<br>• Ultra rapide | Tous |
| **lancer-tout.bat** | • Instructions<br>• Ouvre le navigateur | Débutants |
| **verifier.bat** | • Menu interactif<br>• Options multiples | Power users |

---

## 🎓 Pour les Développeurs

### Scripts package.json

Le fichier `package.json` à la racine contient:

```json
{
  "scripts": {
    "full": "run.bat",
    "dev": "run.bat",
    "start": "run.bat",
    "backend": "cd backend && npm start",
    "frontend": "cd frontend && npm run dev",
    "install-all": "cd backend && npm install && cd ../frontend && npm install"
  }
}
```

Les trois commandes (`full`, `dev`, `start`) font la même chose: lancer les deux serveurs.

---

## 🆘 En cas de Problème

### MySQL pas démarré
```
Erreur: ECONNREFUSED
Solution: Lancez XAMPP → Start MySQL
```

### Port déjà utilisé
```
Erreur: Port 5000 already in use
Solution: Fermez l'autre application ou changez le port
```

### Dépendances manquantes
```
Erreur: Cannot find module
Solution: npm run install-all
```

---

## 📞 Résumé Ultra-Rapide

**La commande magique:**
```bash
cd girl-power-app && npm run full
```

**Ou le fichier magique:**
```
Double-clic sur: run.bat
```

**Résultat:**
- Backend démarre ✅
- Frontend démarre ✅
- Vous êtes prêt! 🎉

---

**C'est tout! Profitez de Girl Power! 🚀**

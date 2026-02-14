# 🔧 DIAGNOSTIC - Page Blanche

## TEST 1: Vérifier si le Frontend tourne vraiment

Ouvrez cette URL dans votre navigateur:
```
http://localhost:3000/src/test.html
```

### Si vous voyez une belle page colorée avec des ✅:
→ Le problème vient de React/Vite. On va le réparer.

### Si vous voyez "Page introuvable" ou erreur:
→ Le frontend ne tourne pas vraiment.

---

## TEST 2: Console du Navigateur (IMPORTANT!)

1. Sur la page blanche, appuyez sur **F12**
2. Cliquez sur l'onglet **Console**
3. **Copiez TOUT ce qui est écrit** (surtout les lignes rouges)

Les erreurs courantes:

### Erreur: "Failed to fetch dynamically imported module"
```
Solution: Le build Vite a un problème
cd girl-power-app/frontend
rm -rf node_modules/.vite
rm -rf dist
npm run dev
```

### Erreur: "Cannot find module './components/Sidebar'"
```
Solution: Le fichier n'est pas trouvé
Vérifier que le fichier existe:
ls girl-power-app/frontend/src/components/Sidebar.jsx
```

### Erreur: "Unexpected token '<'"
```
Solution: Le serveur ne répond pas correctement
Arrêter et relancer le frontend
```

---

## TEST 3: Vérifier les Fichiers

Dans PowerShell:
```bash
cd girl-power-app/frontend/src

# Vérifier que les fichiers existent
dir components\Sidebar.jsx
dir pages\Dashboard.jsx
dir pages\CandidateFormNew.jsx
dir App.jsx
dir main.jsx
```

Si un fichier manque, dites-moi lequel!

---

## SOLUTION RAPIDE: Réinitialiser le Frontend

```bash
# Arrêter le frontend (Ctrl+C)

cd girl-power-app/frontend

# Supprimer le cache
rmdir /s /q node_modules\.vite
rmdir /s /q dist

# Relancer
npm run dev
```

---

## QUESTIONS À ME RÉPONDRE:

1. **Que voyez-vous dans la console (F12)?**
   Copiez-moi TOUT le texte, surtout les erreurs rouges.

2. **Que voyez-vous quand vous allez sur http://localhost:3000/src/test.html?**
   - Page colorée avec tests?
   - Page blanche?
   - Erreur?

3. **Les deux terminaux (backend + frontend) affichent quoi?**
   - Backend: "Server running on port 5000"?
   - Frontend: "Local: http://localhost:3000"?

---

## SI VRAIMENT BLOQUÉ: Version Simple Sans Sidebar

Je peux créer une version simple sans la sidebar pour tester si c'est elle qui pose problème.

Voulez-vous que je fasse ça?

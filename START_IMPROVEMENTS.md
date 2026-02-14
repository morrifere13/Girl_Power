# 🚀 DÉMARRAGE RAPIDE - Améliorations Critiques

**Temps estimé:** 30 minutes
**Difficulté:** Facile ⭐⭐☆☆☆

---

## ✅ ÉTAPE 1: Configuration Environnement (10 min)

### 1.1 Créer fichier .env

```bash
# Depuis le dossier girl-power-app/backend
cp .env.example .env
```

### 1.2 Éditer .env avec vos valeurs

Ouvrir `backend/.env` et remplir **au minimum**:

```env
# Database (remplacer avec vos valeurs)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_NAME=girl_power_db

# JWT Secret (GÉNÉRER UN NOUVEAU!)
# Exécutez cette commande pour générer:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=COLLEZ_ICI_LE_SECRET_GENERE

# Email (si vous utilisez Gmail)
EMAIL_USER=votre-email@gmail.com
EMAIL_PASSWORD=votre-app-password-gmail
```

**📌 Important:**
- Pour Gmail, créez un "App Password": https://myaccount.google.com/apppasswords
- Ne commitez JAMAIS le fichier `.env` sur Git!

---

## ✅ ÉTAPE 2: Activer Validation Env (5 min)

### 2.1 Modifier server.js

Ouvrir `backend/server.js` et ajouter **en haut du fichier** (ligne 1-2):

```javascript
require('dotenv').config();
const { validateEnv } = require('./config/env');

// Valider AVANT tout le reste
validateEnv();

// ... reste du code existant
```

### 2.2 Tester

```bash
cd backend
npm start
```

**Résultat attendu:**
```
✅ Variables d'environnement validées
🚀 Serveur démarré sur le port 5000
✅ Connecté à la base de données MySQL
```

**Si erreur:**
- Vérifiez que `.env` existe et est bien rempli
- Vérifiez que JWT_SECRET fait minimum 32 caractères

---

## ✅ ÉTAPE 3: Sécuriser CORS (5 min)

### 3.1 Modifier server.js

Chercher la ligne avec `app.use(cors({` (environ ligne 28-33) et remplacer par:

```javascript
// Configuration CORS sécurisée
const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL || 'https://girlpower.org']
    : ['http://localhost:3000', 'http://localhost:5173'];

app.use(cors({
    origin: (origin, callback) => {
        // Autoriser requêtes sans origin (Postman, mobile apps)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`⚠️  Origine bloquée par CORS: ${origin}`);
            callback(new Error('Non autorisé par CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

## ✅ ÉTAPE 4: Améliorer Rate Limiting (5 min)

### 4.1 Modifier server.js

Chercher la section avec `rateLimit` (environ ligne 44-56) et remplacer par:

```javascript
const { rateLimit } = require('express-rate-limit');

// Rate limiter général
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requêtes max par 15min
    message: 'Trop de requêtes, réessayez dans 15 minutes',
    standardHeaders: true,
    legacyHeaders: false
});

// Rate limiter strict pour authentification
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // 5 tentatives max par 15min
    skipSuccessfulRequests: true,
    message: 'Trop de tentatives de connexion'
});

// Appliquer les limiters
app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
```

---

## ✅ ÉTAPE 5: Ajouter Error Handler Global (5 min)

### 5.1 Modifier server.js

À la **FIN** du fichier, **APRÈS** toutes les routes, **AVANT** `app.listen()`:

```javascript
// Import error handlers
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Toutes vos routes ici...
app.use('/api/candidates', candidatesRoutes);
app.use('/api/projects', projectsRoutes);
// etc...

// ⚠️ AJOUTER CES 2 LIGNES APRÈS LES ROUTES
app.use(notFound);      // Gère les 404
app.use(errorHandler);  // Gère toutes les erreurs

// app.listen() en dernier
app.listen(PORT, async () => {
    // ...
});
```

---

## ✅ ÉTAPE 6: Tester Tout Fonctionne

### 6.1 Redémarrer le backend

```bash
# Ctrl+C pour arrêter
# Puis relancer:
npm start
```

**Vérifications:**
- ✅ Pas d'erreur au démarrage
- ✅ Message "Variables d'environnement validées"
- ✅ Connexion DB OK
- ✅ Serveur écoute sur port 5000

### 6.2 Tester depuis le frontend

```bash
cd ../frontend
npm run dev
```

**Tester:**
- Se connecter avec un utilisateur
- Naviguer entre les pages
- Créer/modifier une candidate

**Tout doit fonctionner normalement!**

---

## ❓ PROBLÈMES FRÉQUENTS

### Erreur: "JWT_SECRET must be at least 32 characters"

**Solution:** Générer un nouveau secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copier le résultat dans `.env` à la ligne `JWT_SECRET=`

---

### Erreur: "Cannot connect to MySQL"

**Vérifier:**
1. MySQL est démarré
2. Identifiants dans `.env` sont corrects
3. Base de données existe

```bash
# Créer la DB si elle n'existe pas
mysql -u root -p
CREATE DATABASE girl_power_db;
exit
```

---

### Erreur: "Module './config/env' not found"

**Solution:** Le fichier `backend/config/env.js` doit exister.
Vérifiez qu'il a bien été créé dans l'analyse.

---

### Warning: "NODE_ENV not set"

**Solution:** Ajouter dans `.env`:
```env
NODE_ENV=development
```

---

## 🎉 FÉLICITATIONS!

Vous avez implémenté les **améliorations critiques de sécurité**!

### Ce qui a changé:

✅ **Sécurité**
- JWT secret sécurisé avec validation
- CORS restreint aux origines autorisées
- Rate limiting efficace contre DDoS

✅ **Robustesse**
- Validation automatique configuration
- Gestion erreurs centralisée
- Messages d'erreur cohérents

✅ **Production-ready**
- Configuration via environnement
- Prêt pour déploiement sécurisé

---

## 📋 PROCHAINES ÉTAPES (Optionnel)

Maintenant que la base est sécurisée, vous pouvez:

1. **Optimiser performance** (code-splitting frontend)
   → Voir `GUIDE_REFACTORING_APP.md`

2. **Refactorer code dupliqué**
   → Utiliser `backend/utils/helpers.js`

3. **Améliorer queries DB**
   → Corriger les N+1 queries

4. **Ajouter tests**
   → Jest backend + Vitest frontend

**Consultez:** `PLAN_AMELIORATION_PROFESSIONNEL.md` pour le plan complet.

---

## 📝 CHECKLIST FINALE

- [ ] Fichier `.env` créé et rempli
- [ ] JWT_SECRET généré (32+ caractères)
- [ ] DB credentials corrects
- [ ] Email config (si utilisé)
- [ ] Validation env activée dans server.js
- [ ] CORS sécurisé configuré
- [ ] Rate limiting amélioré
- [ ] Error handlers ajoutés
- [ ] Backend redémarre sans erreur
- [ ] Frontend fonctionne normalement

**Tout coché? Parfait! 🎉**

---

**Temps total:** 30 minutes
**Difficulté:** Facile ⭐⭐☆☆☆
**Impact:** 🔒 Sécurité ++, 🏆 Production-ready

Continuez avec les autres améliorations à votre rythme!

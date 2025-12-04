# Déploiement Frontend sur Vercel

## Prérequis
- Compte Vercel (https://vercel.com)
- Repository Git séparé pour le frontend
- URL du backend déployé sur Render

## Étapes de déploiement

### 1. Déploiement avec Vercel (Recommandé - Plus simple)
1. Connectez votre repository Git à Vercel
2. Vercel détectera automatiquement que c'est une app React
3. Configurez les variables d'environnement :
   - `REACT_APP_API_URL` : `https://votre-backend-render.onrender.com/api`

### 2. Configuration build
Vercel utilisera automatiquement :
- Build command : `npm run build`
- Output directory : `build`

### 3. Variables d'environnement
Dans les settings de votre projet Vercel :
```
REACT_APP_API_URL=https://votre-backend-render.onrender.com/api
```

### 4. Routing pour SPA
Le fichier `vercel.json` gère automatiquement :
- Le routing client-side
- Le proxy des appels API vers le backend
- Les headers CORS

## Déploiement avec Docker (Alternative)

Si vous préférez utiliser Docker :

### 1. Build de l'image
```bash
docker build -t frontend .
```

### 2. Test local
```bash
docker run -p 80:80 frontend
```

### 3. Déploiement sur Vercel
1. Poussez votre image sur un registry (Docker Hub, GitHub Container Registry)
2. Utilisez le runtime Docker sur Vercel
3. Configurez les variables d'environnement

## Configuration finale

Après déploiement :
1. Mettez à jour `FRONTEND_URL` dans les variables d'environnement du backend Render
2. Testez la connexion entre frontend et backend
3. Vérifiez que l'authentification fonctionne

## URLs importantes
- Frontend : `https://votre-projet.vercel.app`
- Backend : `https://votre-backend.onrender.com`

## Dépannage
- Vérifiez les logs Vercel pour les erreurs de build
- Assurez-vous que `REACT_APP_API_URL` pointe vers le bon backend
- Testez les appels API dans les outils de développement du navigateur
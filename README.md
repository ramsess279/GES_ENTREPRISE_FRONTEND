# Gestion Employés Entreprise - Frontend

Application React pour la gestion des employés, des cycles de paie et des paiements.

## 🚀 Démarrage rapide

### Prérequis
- Node.js (version 16 ou supérieure)
- npm ou yarn
- Backend en cours d'exécution (voir README du backend)

### Installation
```bash
# Cloner le repository
git clone <repository-url>
cd frontend

# Installer les dépendances
npm install
```

### Démarrage
```bash
# Démarrer l'application en mode développement
npm start

# L'application sera accessible sur http://localhost:3000
```

### Build pour la production
```bash
# Créer une version optimisée pour la production
npm run build
```

## 🔐 Informations de connexion

### Super Admin
- **Email** : `rama.gueye@odc.sn`
- **Mot de passe** : `passer123`

### Admins d'entreprises

#### Sonatel SA
- **Email** : `fatou.ndiaye@sonatel.sn`
- **Mot de passe** : `admin123`
- **Entreprise** : Sonatel SA (Télécommunications)

#### Banque Atlantique Sénégal
- **Email** : `moussa.fall@banqueatlantique.sn`
- **Mot de passe** : `admin123`
- **Entreprise** : Banque Atlantique Sénégal (Banque)

#### Orange Sénégal
- **Email** : `admin@orange.sn`
- **Mot de passe** : `admin123`
- **Entreprise** : Orange Sénégal (Télécommunications)

### Caissiers

#### Sonatel SA
- **Email** : `caissier@sonatel.sn`
- **Mot de passe** : `caissier123`

#### Banque Atlantique Sénégal
- **Email** : `caissier@banqueatlantique.sn`
- **Mot de passe** : `caissier123`

#### Teyliom Group
- **Email** : `aissatou.ba@teyliom.sn`
- **Mot de passe** : `caissier123`

#### Senelec
- **Email** : `ousmane.sow@senelec.sn`
- **Mot de passe** : `caissier123`

#### Orange Sénégal
- **Email** : `caissier@orange.sn`
- **Mot de passe** : `caissier123`

### Vigiles

#### Sonatel SA
- **Email** : `vigile@sonatel.sn`
- **Mot de passe** : `vigile123`

#### Banque Atlantique Sénégal
- **Email** : `vigile@banqueatlantique.sn`
- **Mot de passe** : `vigile123`

#### Teyliom Group
- **Email** : `vigile@teyliom.sn`
- **Mot de passe** : `vigile123`

## 🏢 Entreprises disponibles

1. **Sonatel SA** - Télécommunications
2. **Banque Atlantique Sénégal** - Services bancaires
3. **Teyliom Group** - Services divers
4. **Senelec** - Électricité
5. **Orange Sénégal** - Télécommunications

## 📱 Fonctionnalités

- ✅ Gestion des employés
- ✅ Pointage et présence
- ✅ Cycles de paie
- ✅ Génération de bulletins
- ✅ Gestion des paiements
- ✅ Tableaux de bord
- ✅ Interface responsive

## 🛠️ Technologies utilisées

- **React** 18
- **React Router** pour la navigation
- **Tailwind CSS** pour le styling
- **Axios** pour les requêtes HTTP
- **Heroicons** pour les icônes
- **Context API** pour la gestion d'état

## 📁 Structure du projet

```
frontend/
├── public/
│   ├── index.html
│   └── ...
├── src/
│   ├── components/
│   │   ├── ui/          # Composants réutilisables
│   │   └── ...
│   ├── contexts/        # Contextes React
│   ├── hooks/           # Hooks personnalisés
│   ├── pages/           # Pages de l'application
│   ├── utils/           # Utilitaires
│   ├── App.js           # Composant principal
│   └── index.js         # Point d'entrée
├── package.json
└── README.md
```

## 🔧 Scripts disponibles

- `npm start` - Démarre le serveur de développement
- `npm run build` - Construit l'application pour la production
- `npm test` - Lance les tests
- `npm run eject` - Éjecte la configuration Create React App

## 🌐 API

L'application communique avec le backend via des appels API REST. Assurez-vous que le backend est en cours d'exécution sur le port configuré (par défaut : 3010).

## 📞 Support

Pour toute question ou problème, contactez l'équipe de développement.

---

**Note** : Les mots de passe des seeders sont fournis à des fins de développement uniquement. En production, assurez-vous de changer tous les mots de passe par défaut.
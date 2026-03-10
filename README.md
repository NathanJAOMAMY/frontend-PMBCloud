# PMBCloud Frontend

Application frontend React/TypeScript pour PMBCloud - Plateforme de gestion de fichiers et communication d'équipe.

## 🚀 Démarrage rapide

### Prérequis
- Node.js 20.x
- npm ou yarn

### Installation
```bash
# Cloner le repository
git clone <repository-url>
cd frontend_PMBCloud

# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp .env.example .env
# Éditer .env avec vos vraies valeurs
```

### Développement
```bash
# Démarrer le serveur de développement
npm run dev

# Construire pour la production
npm run build

# Aperçu de la build de production
npm run preview
```

### Tests et qualité
```bash
# Vérifier le linting
npm run lint

# Corriger automatiquement le linting
npm run lint:fix

# Vérifier les types TypeScript
npm run type-check
```

## 🏗️ Architecture

- **Framework**: React 18 avec TypeScript
- **Build tool**: Vite
- **State management**: Redux Toolkit
- **Routing**: React Router
- **Styling**: Tailwind CSS
- **API**: Axios avec retry logic
- **Authentication**: JWT + Supabase
- **Real-time**: Socket.io

## 📁 Structure du projet

```
src/
├── api/                 # Configuration API et services
├── components/          # Composants réutilisables
│   ├── Admin/          # Composants d'administration
│   ├── Chat/           # Composants de chat
│   ├── Files/          # Composants de gestion de fichiers
│   └── UI/             # Composants d'interface
├── context/            # Context React (Auth)
├── hooks/              # Hooks personnalisés
├── pages/              # Pages de l'application
├── redux/              # State management
├── utils/              # Utilitaires
└── data/               # Types et données statiques
```

## 🔧 Configuration

### Variables d'environnement
Créer un fichier `.env` basé sur `.env.example`:

```env
VITE_API_BASE_URL=http://localhost:3001
VITE_SUPABASE_KEY=your_supabase_key
VITE_APP_NAME=PMBCloud
VITE_ENABLE_PWA=false
```

### Secrets GitHub (pour CI/CD)
Voir [GITHUB_SECRETS_SETUP.md](./GITHUB_SECRETS_SETUP.md) pour la configuration des secrets requis.

## 🚀 Déploiement

### Production
Le projet est configuré pour le déploiement sur Render avec GitHub Actions.

### Docker
```bash
# Construire l'image
docker build -t pmbcloud-frontend .

# Exécuter le conteneur
docker run -p 8080:80 pmbcloud-frontend
```

## 🔒 Sécurité

- Rate limiting côté backend
- Validation des props React
- Audit automatique des vulnérabilités npm
- Secrets chiffrés dans GitHub Actions
- Headers de sécurité Nginx

## 📊 Monitoring

- Lighthouse pour les performances
- Tests automatisés CI/CD
- Audit de sécurité automatique

## 🤝 Contribution

1. Créer une branche feature
2. Commiter avec des messages descriptifs
3. Ouvrir une Pull Request
4. Attendre la validation CI/CD

## 📝 Scripts disponibles

- `npm run dev` - Serveur de développement
- `npm run build` - Build de production
- `npm run preview` - Aperçu build
- `npm run lint` - Linting ESLint
- `npm run type-check` - Vérification TypeScript

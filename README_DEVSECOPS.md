# PMBCloud Frontend - Guide DevOps & DevSecOps

## 📋 Résumé des améliorations appliquées

Ce projet a été renforcé avec une pipeline de sécurité complète et des meilleures pratiques DevOps/DevSecOps.

### ✅ Scans de Sécurité Activés

#### 1. **Container Security (Trivy)**
- Scan automatique de l'image Docker après build
- Détecte vulnérabilités OS (CVE)
- Résultats uploadés dans GitHub Security tab
- Seuil : bloque CRITICAL et HIGH

#### 2. **Software Composition Analysis (SCA)**
- `npm audit` : audit des dépendances npm
- **Dependabot** : PRs automatiques pour mises à jour
  - npm packages (hebdo)
  - GitHub Actions (hebdo)
  - Label: `dependencies`
- Rapport HTML généré : `audit-report.html`

#### 3. **Secret Scanning**
- Scan basique (grep) → remplacé par **detect-secrets**
- Baseline: `.secrets.baseline`
- Prévention de commits de secrets
- GitHub Secret Scanning (natif) : alertes auto

#### 4. **Code Analysis (SAST)**
- **CodeQL** (GitHub) : analyse statique JavaScript
  - Détecte injections, XSS, CSRF, etc.
  - Résultats : Security → Code scanning
- **Snyk** (optionnel, si token fourni)

#### 5. **SBOM Generation (Supply Chain)**
- **Syft** : génère Software Bill of Materials (CycloneDX)
- Fichier: `sbom.json`
- Utilisé pour traçabilité et compliance

### 🔒 Container Hardening

**Dockerfile**
- ✓ Multi-stage build (réduit surface)
- ✓ Image Alpine (minimal)
- ✓ User non-root (`nginx`)
- ✓ Permissions strictes
- ✓ Secrets via variables d'env

**Nginx Configuration** (`nginx.conf`)
```
Content-Security-Policy   → bloque scripts non-autorisés
X-Frame-Options: DENY     → anti-clickjacking
X-Content-Type-Options    → anti-MIME sniffing
X-XSS-Protection          → XSS browser protection
Referrer-Policy           → contrôle referer
```

### 📊 Pipeline CI/CD (`/.github/workflows/ci.yml`)

#### Jobs
1. **Build & Validation**
   - Checkout code
   - Setup Node 20.x
   - `npm ci` (install)
   - Validation structure (package.json, vite.config.js)
   - `npm run build` (Vite)

2. **Docker Image Build**
   - Build avec tags `:latest` et `:${{ github.sha }}`
   - Trivy scan (SARIF output)
   - SBOM generation (Syft)
   - Test runtime (curl check port 8080)

3. **Security Scans**
   - `npm audit` (dépendances)
   - `detect-secrets` (secrets en clair)
   - CodeQL (analyse statique)
   - Snyk (si `SNYK_TOKEN` fourni)

4. **Quality Gates**
   - Lighthouse CI (CSP, performance)
   - Build artifact validation

5. **Artifacts Export**
   - `dist/` (application)
   - `sbom.json` (Bill of Materials)
   - `trivy-results.sarif` (scan image)
   - `audit-report.html` (npm audit)
   - Rétention : 30 jours

---

## 🚀 Getting Started

### Prérequis
- Node.js 20.x
- Docker (optionnel, pour tests locaux)
- Git

### Installation
```bash
npm ci
```

### Build Local
```bash
npm run build
```

### Build Docker (local)
```bash
docker build -t pmbcloud-frontend:latest .
docker run -p 8080:8080 pmbcloud-frontend:latest
```

### Tests de Sécurité (local)
```bash
# Audit dépendances
npm audit --audit-level=high

# Scan secrets (si detect-secrets installé)
pip install detect-secrets
detect-secrets scan --all-files

# Scan image Docker (si Trivy installé)
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image pmbcloud-frontend:latest
```

---

## 🔐 Sécurité

### Signalement de Vulnérabilités
Consultez [SECURITY.md](./SECURITY.md) pour le processus complet.

**Résumé :**
1. Ne PAS créer de GitHub issue publique
2. Contactez l'équipe de sécurité directement
3. Délai de réponse : < 24h (CRITICAL)

### Gestion des Secrets
- **Ne JAMAIS committer les secrets**
- Utiliser GitHub Secrets (Actions tab → Secrets and variables)
- Secrets requis pour CI :
  - `SNYK_TOKEN` (optionnel pour Snyk)
  - `RENDER_API_KEY` (déploiement)
  - `RENDER_FRONTEND_SERVICE_ID` (déploiement)

---

## 📁 Structure de Fichiers Clé

```
.github/
├── workflows/
│   ├── ci.yml          ← Pipeline CI/CD sécurisée
│   └── deploy.yml      ← Déploiement Render
├── dependabot.yml      ← Maj dépendances auto
└── CODEOWNERS          ← Gouvernance PRs

Dockerfile             ← Image Docker sécurisée (multi-stage, user non-root)
docker-compose.yml     ← Orchestration locale
nginx.conf            ← Configuration Nginx (CSP, headers de sécurité)
.secrets.baseline     ← Baseline pour detect-secrets
.dockerignore         ← Exclusions Docker

SECURITY.md           ← Politique de sécurité complète
```

---

## 📈 Monitoring & Compliance

### Onglet Security (GitHub)
- **Code scanning** : Résultats CodeQL + Trivy
- **Dependabot alerts** : Vulnérabilités dépendances
- **Secret scanning** : Secrets détectés
- **Security advisories** : Alertes de la communauté

### Artifacts (Actions)
- Télécharger rapports après chaque build
- Archiver pour audit (30j min.)
- SBOM + Trivy SARIF pour compliance (ISO 27001, SOC2, etc.)

### Checklist Pré-Déploiement
```
□ CI pipeline PASSED (tous les jobs)
□ Pas de vulnérabilités HIGH/CRITICAL
□ SBOM généré et archivé
□ CSP headers appliqués
□ Pas de secrets détectés
□ Dockerfile optimisé (multi-stage, Alpine, non-root)
□ Nginx CSP + headers sécurité en place
```

---

## 🛠️ Maintenance

### Mise à jour dépendances
- **Automatique** : Dependabot crée des PRs (hebdo)
- **Manuel** : `npm update` ou `npm audit fix`
- **Vérifier** : CI doit passer après mise à jour

### Rotation des secrets
- Tous les 90 jours minimum
- Vérifier dans GitHub Settings → Secrets
- Notifier l'équipe de chaque rotation

### Audit de sécurité
- Mensuel : vérifier GitHub Security tab
- Trimestriel : review complet de la pipeline
- Annuel : audit externe (recommandé)

---

## 📚 Ressources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Docker Security](https://docs.docker.com/engine/security/)
- [GitHub Security Features](https://github.com/features/security)
- [CWE Top 25](https://cwe.mitre.org/top25/)

---

## 📞 Support

Pour questions ou incidents de sécurité :
- Slack : #security-team
- Email : security@pmbcloud.dev
- GitHub Issues : Pour non-sensible items uniquement

---

**Dernière mise à jour** : 6 février 2026  
**Mainteneur** : DevOps/DevSecOps Team

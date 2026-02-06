# Politique de Sécurité - PMBCloud Frontend

## Vue d'ensemble

Ce document décrit les pratiques de sécurité et les processus DevSecOps pour le projet PMBCloud Frontend.

## 1. Signalement des Vulnérabilités

### Responsabilité des développeurs
Si vous découvrez une vulnérabilité de sécurité :
1. **NE PAS** créer de GitHub issue publique
2. Contactez l'équipe de sécurité directement via email ou Slack
3. Fournissez les détails : description, impact, étapes de reproduction
4. Attendez une réponse avant de divulguer publiquement

### Délai de réponse
- **Critique :** < 24h
- **Haute :** < 3 jours
- **Moyenne :** < 1 semaine
- **Basse :** < 2 semaines

## 2. Pipeline CI/CD de Sécurité

### Scans automatisés à chaque commit (`.github/workflows/ci.yml`)

#### a) **npm audit** - Audit des dépendances
- Vérifie les vulnérabilités connues dans `package-lock.json`
- Génère un rapport HTML (`audit-report.html`)
- Seuil : alerte sur niveaux HIGH et CRITICAL

#### b) **Trivy** - Scan d'image Docker
- Analyse l'image construite pour vulnérabilités
- Format SARIF uploadé dans l'onglet "Security" de GitHub
- Seuil : bloque les vulnérabilités CRITICAL et HIGH

#### c) **Syft** - Génération SBOM
- Produit une liste de composants et leurs versions
- Format CycloneDX JSON (`sbom.json`)
- Utilisé pour la traçabilité des composants (Supply Chain Security)

#### d) **detect-secrets** - Scan de secrets
- Recherche les clés API, tokens, mots de passe en clair
- Baseline: `.secrets.baseline`
- Empêche la commutation de secrets dans le code

#### e) **CodeQL** - Analyse statique (SAST)
- Scanne le code JavaScript pour vulnérabilités
- Détecte les injections XSS, CSRF, etc.
- Résultats visibles dans l'onglet "Security" → "Code scanning"

#### f) **Snyk** (optionnel)
- SCA avancée et tests de vulnérabilités
- Nécessite `SNYK_TOKEN` en secret GitHub
- Continue-on-error : n'interrompt pas le pipeline si absent

### Dépendances avec Dependabot (`.github/dependabot.yml`)
- Crée automatiquement des PRs pour mises à jour npm et GitHub Actions
- Schedule : hebdomadaire (lundi 03:00 UTC)
- Limite : 5 PRs ouvertes max
- Chaque PR inclut les changements et impact

## 3. Sécurité du Conteneur

### Dockerfile - Bonnes pratiques appliquées
✓ **Multi-stage build** : réduit la taille et expose moins de code source
✓ **Image de base Alpine** : minimize attack surface
✓ **User non-root** : conteneur run avec user `nginx` (pas root)
✓ **Permissions strictes** : fichiers et répertoires owned par nginx
✓ **No secrets en clair** : secrets injectés via variables d'environnement uniquement

### Configuration Nginx (`nginx.conf`)
✓ **Content-Security-Policy (CSP)** : bloque les scripts non-autorisés
✓ **X-Frame-Options: DENY** : prévient clickjacking
✓ **X-Content-Type-Options: nosniff** : prévient MIME sniffing
✓ **X-XSS-Protection** : active la protection XSS du navigateur
✓ **Referrer-Policy** : contrôle les données de referer

## 4. Gestion des Secrets

### Bonnes pratiques
1. **Ne JAMAIS committer les secrets** en clair
2. **Utiliser GitHub Secrets** pour l'CI/CD
   - `SNYK_TOKEN` : token Snyk (optionnel)
   - `RENDER_API_KEY` : déploiement Render
   - `RENDER_FRONTEND_SERVICE_ID` : ID du service Render
3. **Rotation régulière** : tous les 90 jours minimum
4. **Accès minimaliste** : uniquement les workflows/personnes nécessaires

### Secret Scanning GitHub
- Automatique : GitHub scanne les commits pour secrets
- Alertes dans l'onglet "Security" → "Secret scanning"
- Notification immédiate si un secret public est détecté

## 5. Artefacts de Sécurité

### Artifacts conservés 30 jours dans Actions
- `dist/` : build application
- `sbom.json` : Software Bill of Materials (CycloneDX)
- `trivy-results.sarif` : résultats scan image
- `audit-report.html` : rapport npm audit

### Accès
- Téléchargeables depuis les détails du workflow GitHub
- À conserver pour audit et conformité

## 6. Conformité et Audits

### Checks avant déploiement
```bash
# Local (avant commit)
npm audit --audit-level=high
npm run lint  # ESLint si configuré
npm run test  # Tests unitaires si configurés

# Docker
docker build -t pmbcloud-frontend .
# Puis manuellement avec Trivy (optionnel)
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image pmbcloud-frontend:latest
```

### Checklist de sécurité pour déploiement
- [ ] Tous les tests passent (CI green)
- [ ] Pas de vulnérabilités HIGH/CRITICAL non-adressées
- [ ] SBOM généré et archivé
- [ ] CSP headers appliqués
- [ ] Pas de secrets dans le code
- [ ] Image signée (future : cosign)
- [ ] Accès RBAC minimal au conteneur

## 7. Incidents de Sécurité

### Processus post-incident
1. **Isolation** : déployer le fix immédiatement
2. **Notification** : informer les stakeholders affectés
3. **Root-cause analysis** : enquête et rapport
4. **Remédiation** : patch, test, déploiement
5. **Prévention** : ajouter check CI pour éviter récurrence

## 8. Formation et Ressources

### Ressources recommandées
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Docker Security](https://docs.docker.com/engine/security/)

### Mise à jour
- Réviser cette politique annuellement
- Adapter aux évolutions de menaces
- Documenter toute deviation approuvée

---

**Dernière mise à jour** : 6 février 2026  
**Propriétaire** : Équipe DevSecOps

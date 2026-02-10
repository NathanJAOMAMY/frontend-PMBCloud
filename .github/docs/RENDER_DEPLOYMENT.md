# Render Deployment Guide

## Vue d'ensemble

Ce projet inclut un **job GitHub Actions** qui déclenche automatiquement un redéploiement sur **Render** à chaque push sur la branche `main` après que le pipeline CI passe.

### Avantages de Render

✅ **Gratuit tier** : hosting Docker gratuit (avec limitations)  
✅ **GitHub integration** : redéploiement automatique  
✅ **Déploiement rapide** : ~2-5 minutes par redéploiement  
✅ **SSL/TLS auto** : certificats Let's Encrypt gratuits  
✅ **Monitoring basique** : logs, metrics, alerts  
✅ **Region sélectionnable** : impact latence  

---

## Configuration (5 min)

### 1. Créer une app sur Render

1. Accédez à https://dashboard.render.com
2. Cliquez **New** → **Web Service**
3. Connectez votre repo GitHub
4. **Build Command** : `npm run build` (Render auto-détecte)
5. **Start Command** : `npx serve -s dist -l 8080`
6. **Environment** : Node.js, plan Free
7. Créez l'app (elle va redéployer une première fois)

### 2. Récupérer RENDER_SERVICE_ID

```bash
# Dans le dashboard Render :
# 1. Ouvrez votre Web Service
# 2. L'URL est : https://dashboard.render.com/web/srv-xxxxxxxxxxxxxxxx
# 3. Copiez l'ID après "srv-" (ex: srv-xxxxxxxxxxxxxxxx)
```

Ou en ligne de commande avec l'API Render :
```bash
# Récupérer tous les services
curl -s "https://api.render.com/v1/services" \
  -H "Authorization: Bearer $RENDER_API_KEY" | jq '.[] | {id, name}'

# Copier l'ID du service frontend-PMBCloud
```

### 3. Configurer les secrets GitHub

```bash
# Dans GitHub Settings → Secrets and variables → Actions
# Ajouter les 2 secrets :

RENDER_API_KEY = votre-clé-api-render  # Déjà configuré ✓
RENDER_SERVICE_ID = srv-xxxxxxxxxxxxxxxx  # À copier depuis Render
```

#### Obtenir RENDER_API_KEY

1. Render Dashboard → Settings → API Keys
2. Créer une nouvelle clé (scope: services)
3. Copier la clé

#### Obtenir RENDER_SERVICE_ID

1. Render Dashboard → Web Services → votre app
2. L'URL affiche : `...srv-abc123def456...`
3. Copier l'ID complet `srv-abc123def456`

---

## Vérification (1 min)

### Test local

```bash
# Vérifier que vous avez les 2 secrets
# Settings → Secrets and variables → Actions
# ✓ RENDER_API_KEY
# ✓ RENDER_SERVICE_ID
```

### Test du déploiement

```bash
# 1. Push sur main
git add .
git commit -m "Test Render deployment"
git push origin main

# 2. Allez dans GitHub Actions
# → Voyez le workflow CI s'exécuter
# → Le job "Deploy to Render" devrait être green

# 3. Vérifiez Render Dashboard
# → Nouvel événement "GitHub trigger" dans Deploy log
```

---

## Monitoring après déploiement

### Logs en temps réel

```bash
# Render Dashboard → Web Service → Logs
# Affiche les logs de l'app (stdout + stderr)
```

### Vérifier la santé

```bash
# Tester l'endpoint
curl -I https://votre-app.onrender.com

# Réponse attendue : 200 ou 301 (redirection CSP)
```

### Drift détection

Si la prod ne correspond pas à main :
- Si quelqu'un a changé l'app directement dans Render (redéploiement manuel)
- Solution : re-push sur GitHub pour synchroniser

---

## Configuration Avancée

### Environment Variables en Production

Renderer variables stockées en secret :

```bash
# Render Dashboard → Environment
# Ajouter si besoin :
NODE_ENV = production
API_URL = https://votre-api.com
DEBUG = false
```

### Rollback rapide

```bash
# Si déploiement cassé :
# 1. Revert le commit ou push une fix
# 2. Render va auto-redéployer
# Ou manuellement : Render Dashboard → Redeploy
```

### Auto-redéploiement désactiver

Si vous voulez contrôler les déploiements manuellement :

1. Modifier `.github/workflows/ci.yml`
2. Changer la condition du job `deploy-render` :
```yaml
if: false  # Désactiver
# ou
if: github.event_name == 'workflow_dispatch'  # Manuel seulement
```

### Custom domain

```bash
# Ajouter votre domaine :
# Render Dashboard → Settings → Custom Domain
# Suivre les étapes pour configurer DNS (CNAME)
```

---

## Limitations & Workarounds

| Issue | Symptôme | Solution |
|-------|----------|----------|
| Build timeout (30 min) | Build ne finit pas | Réduire size bundle (voir lighthouserc.json) |
| Out of memory | App crash après deploy | Upgrade plan (Starter) ou optimiser RAM usage |
| Redéploiement lent | 5-10 min par deploy | Normal pour Free tier ; Starter = 2-3 min |
| Pas de HTTPS | Erreur CSP | Render génère auto HTTPS ; attendre 30s post-deploy |
| Conteneur stop aléatoire | App down sans raison | Free tier = spin-down inactif 15 min ; Starter = always-on |

---

## Intégration CI/CD

### Workflow actuel

```
Push main
    ↓
GitHub Actions CI
    ├─ Build app
    ├─ Security audit (SAST, container scan, etc.)
    └─ Falco runtime monitoring (60s)
    ↓
    ├─ Si SUCCESS → Deploy to Render
    │  ├─ Trigger deployment API
    │  ├─ Wait for live status (10 min max)
    │  └─ Post summary
    └─ Si FAIL → NO DEPLOY
```

### Slack Alerts

Pour recevoir notifications Render en Slack :

Renderer → Integrations → Slack Webhook (copier webhook)

Ajouter secret GitHub : `RENDER_SLACK_WEBHOOK` (si besoin de notifier)

---

## Troubleshooting

### Déploiement ne s'exécute pas

```bash
# Vérifier :
# 1. Vous avez poussé sur main (pas autre branch)
# 2. GitHub Actions workflow file valide (pas de syntax error)
# 3. CI passe (tous les jobs réussissent)

# Si encore échoue : GitHub Actions → Logs du job deploy-render
```

### Render API errors

```bash
# Erreur : "Unauthorized"
# → RENDER_API_KEY expiré ou invalide
# → Régénérer via Render Dashboard

# Erreur : "Not Found"
# → RENDER_SERVICE_ID incorrect
# → Copier l'ID exact depuis le dashboard

# Erreur : "Rate limited"
# → Attendre 60s ou Render → Deployment → manual Retry
```

### App crashe après deploy

```bash
# Render Dashboard → Logs
# Chercher : error, exception, fatal

# Commandes utiles :
npm run build  # Build localement pour test
npm run serve  # Tester le build localement
```

---

## Coûts

| Plan | CPU | RAM | Price | Auto-sleep |
|------|-----|-----|-------|-----------|
| Free | Shared | 0.5 GB | €0 | ✓ (15 min inactif) |
| Starter | 0.5 vCPU | 1 GB | €7/mois | ✗ |
| Standard | 1 vCPU | 4 GB | €25/mois | ✗ |

**Pour production** (sans interruptions) : minimum Starter (~€7/mois)

---

## Next Steps

- [x] Render Setup (this guide)
- [ ] Configure Falco + Prometheus en production
- [ ] Setup Grafana Cloud dashboards
- [ ] Configure alertes Slack pour Falco events
- [ ] Documenter runbook incident response

---

## Support

- **Render docs** : https://render.com/docs
- **API Reference** : https://api-docs.render.com/
- **Status page** : https://status.render.com
- **Questions** : #devops (Slack) ou devops@pmbcloud.dev

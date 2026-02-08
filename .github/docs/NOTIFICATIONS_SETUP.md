# Configuration des Notifications DevSecOps

Ce document explique comment configurer les alertes pour recevoir les notifications de sécurité en temps réel.

## 1️⃣ Slack - Notifications en temps réel

### Étapes de configuration

1. **Créer un Webhook Slack**
   - Accédez à https://api.slack.com/apps
   - Créez une nouvelle app ou ouvrez une existante
   - Naviguer à **Incoming Webhooks** → **Add New Webhook to Workspace**
   - Sélectionnez le channel (#security, #dev-alerts, etc.)
   - Copier l'URL Webhook

2. **Ajouter le secret GitHub**
   - Allez à **Settings → Secrets and variables → Actions**
   - Cliquez **New repository secret**
   - Nom : `SLACK_WEBHOOK`
   - Valeur : collez l'URL Webhook Slack

3. **Tester**
   ```bash
   # Déclencher un push/PR pour activer le workflow
   git push origin main
   ```

**Exemple de notification reçue :**
```
🔒 Security Scan Report
───────────────────────
CodeQL Issues: 5
Trivy Issues: 2
📊 View full report: [GitHub Actions]
🔗 Commit: abc123def...
👤 By: developer-name
```

---

## 2️⃣ Email - Notification automatique

### Étapes de configuration

1. **Ajouter un secret pour l'email (optionnel)**
   - Settings → Secrets and variables → Actions
   - Nom : `SECURITY_EMAIL`
   - Valeur : email@example.com (ou liste : email1@...,email2@...)

2. **Adapter le workflow** (modification dans `.github/workflows/ci.yml`)
   ```yaml
   - name: Send Email Alert
     if: env.SECURITY_EMAIL != '' && failure()
     uses: dawidd6/action-send-mail@v3
     with:
       server_address: ${{ secrets.EMAIL_SERVER }}
       server_port: 587
       username: ${{ secrets.EMAIL_USERNAME }}
       password: ${{ secrets.EMAIL_PASSWORD }}
       subject: "🔒 Security Alert - frontend-PMBCloud"
       to: ${{ env.SECURITY_EMAIL }}
       from: "security-bot@pmbcloud.dev"
       body: |
         Security issues detected during CI/CD scan:
         - CodeQL findings
         - Trivy container scan results
         
         Full report: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
   ```

---

## 3️⃣ Commentaires automatiques sur PR

Le workflow ajoute automatiquement un commentaire sur les PR avec le résumé des résultats :

```
## 🔒 Security Scan Report

| Tool | Issues Found |
|------|--------------|
| CodeQL (SAST) | 5 |
| Trivy (Container) | 2 |

### 📋 Recommendations
- Review findings above before merge
- Check Full Report
- Contact security team if urgent
```

---

## 4️⃣ Règles de protection de branche (Branch Protection)

Pour **bloquer les merges** si des problèmes critiques sont trouvés :

1. **Settings → Branches → Add rule**
2. **Branch name pattern** : `main`
3. Cocher :
   - ✅ Require status checks to pass before merging
   - ✅ CodeQL / Trivy / npm audit
4. Configurer escalade :
   - Nombre d'approbations requises
   - Demander révision d'un code owner

---

## 5️⃣ Script d'analyse SARIF

Le script `scripts/parse-sarif.js` :
- 📊 Parse les fichiers SARIF (CodeQL, Trivy)
- 🔢 Compte les issues par sévérité
- 📈 Génère un rapport formé pour Slack/PR
- 🚨 Exporte des métriques pour les gated checks

**Utilisation :**
```bash
node scripts/parse-sarif.js
```

**Sortie :**
```
📊 Security Scan Report
==================================================

📄 results/javascript.sarif
   Total Issues: 5
   By Severity:
     🟡 warning: 5

   Top Categories:
     • cwe: 3
     • performance: 2

==================================================
✅ Total Issues Found: 5
🔴 Critical Issues: 0
⚠️  Action: ALLOW_MERGE
```

---

## 6️⃣ Intégration SIEM / Dashboard interne

Pour centraliser les alertes de sécurité :

### Option A : DefectDojo (auto-hebergé)
```bash
# Importer les résultats SARIF
curl -X POST http://defectdojo-server/api/v2/import-scan/ \
  -H "Authorization: Token YOUR_TOKEN" \
  -F "file=@results/javascript.sarif" \
  -F "scan_type=SARIF"
```

### Option B : Webhook personnalisé
```bash
# Poster les résultats sur votre système interne
curl -X POST https://your-security-system.com/api/alerts \
  -H "Content-Type: application/json" \
  -d @results/javascript.sarif
```

---

## 📋 Checklist de mise en place

- [ ] Slack Webhook créé et configuré
- [ ] Secret `SLACK_WEBHOOK` ajouté à GitHub
- [ ] Commentaires PR fonctionnels (testés sur une PR)
- [ ] Branch protection rules activées sur `main`
- [ ] Email (optionnel) configuré
- [ ] Script parse-sarif.js testé localement
- [ ] Équipe notifiée des nouvelles alertes

---

## 🔗 Références

- [GitHub Secrets Management](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Slack Incoming Webhooks](https://api.slack.com/messaging/webhooks)
- [SARIF Format](https://sarifweb.azurewebsites.net/)
- [GitHub Branch Protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches)


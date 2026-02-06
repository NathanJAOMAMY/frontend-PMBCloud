# Branch Protection Configuration Guide

## 📋 Protect Your Main Branch

GitHub recommande de protéger la branche `main` pour prévenir les changements accidentels ou malveillants.

---

## 🔒 Étapes de Configuration

### ⚠️ Avant de Commencer: Branch Rulesets vs Classic Rules

GitHub propose **deux systèmes** pour protéger les branches:

| Aspect | **Branch Rulesets (Nouveau)** ✅ | **Classic Rules (Ancien)** |
|--------|-----------------------------------|---------------------------|
| **Recommandé pour** | Projets modernes (2024+) | Compatibilité legacy |
| **Flexibilité** | Plus d'options et de présets | Basique |
| **Statut** | **Avenir de GitHub** | En maintenance |
| **Environnement** | Toutes les branches + tags | Branche spécifique |
| **Exemple** | `refs/heads/main` | `main` |

**👉 Recommandation: Utilisez "Add branch ruleset" (nouveau)**

---

### 1. Accéder aux Paramètres de Branche
1. Allez sur votre repository GitHub
2. Settings → Rules (menu gauche, section "Code and release")
3. Cliquez sur **"Add branch ruleset"** (nouveau) OU "Add classic branch protection rule" (ancien)

### 2. Configurer les Règles

#### Pattern de Branche
```
Branch name pattern: main
```
(Cochez la case pour appliquer à `main`)

#### ✅ Recommandations DevSecOps pour PMBCloud Frontend

```
☑️ Require a pull request before merging
   ├─ Require approvals: 1 (au minimum)
   └─ Dismiss stale pull request approvals: ✓
   
☑️ Require status checks to pass before merging
   ├─ Require branches to be up to date before merging: ✓
   └─ Status checks that must pass:
       ├─ build
       ├─ docker-security (Trivy)
       ├─ dependencies (npm audit)
       ├─ secrets (detect-secrets)
       ├─ codeql
       └─ lighthouse-ci

☑️ Require conversation resolution before merging
   └─ (Toutes les discussions doivent être résolues)

☑️ Require code reviews before merging
   ├─ Number of approvals required: 1
   ├─ Require review from Code Owners: ✓
   └─ Require approval of the most recent reviewable push: ✓

☑️ Require signed commits
   └─ (Optionnel mais recommandé)

☑️ Restrict who can push to matching branches
   ├─ Allow force pushes: ❌ NONE
   ├─ Allow deletions: ❌ NO
   └─ (Seulement les admins peuvent bypasser)

☑️ Include administrators
   └─ ✓ (S'applique aussi aux admins)
```

---

## 📊 Configuration Recommandée (Minimale)

Si vous voulez une config simple mais efficace:

```
✅ Require a pull request before merging
   ├─ Require 1 approval
   └─ Dismiss stale approvals: YES

✅ Require status checks to pass
   ├─ Up to date before merging: YES
   └─ Required checks:
       ├─ build
       ├─ docker-security
       └─ secrets

✅ Require code reviews
   ├─ Include Code Owners: YES
   └─ Require latest push approval: YES

✅ Allow force pushes: NONE
✅ Allow deletions: NO
```

---

## 🚀 Configuration Complète (Enterprise)

Pour une sécurité maximale:

```
✅ Require a pull request before merging
   ├─ Require 2 approvals (dev + security)
   └─ Dismiss stale approvals: YES

✅ Require status checks to pass
   ├─ Up to date before merging: YES
   └─ Required checks: ALL (10+ checks)

✅ Require conversation resolution
   └─ YES (Toutes les discussions fermées)

✅ Require code reviews
   ├─ Number: 2 approvals
   ├─ Include Code Owners: YES
   └─ Require latest push approval: YES

✅ Require signed commits
   └─ YES (GPG signed commits)

✅ Allow force pushes: NONE
✅ Allow deletions: NO
✅ Include administrators: YES
✅ Require deployment to succeed: production
```

---

## 🔄 Workflow avec Branch Protection

### Processus de Merge Sécurisé

```
1. Developer crée une branch feature
   └─ git checkout -b feature/something

2. Code review via PR
   ├─ CI runs (all checks must pass)
   ├─ Code owner reviews
   ├─ 1+ approvals required
   └─ Conversations resolved

3. Security checks validés
   ├─ ✅ npm audit passed
   ├─ ✅ Trivy scan passed
   ├─ ✅ No secrets detected
   ├─ ✅ CodeQL passed
   └─ ✅ Build successful

4. Merge to main (après approvals)
   └─ Branche supprimée automatiquement

5. Main branch déployée automatiquement
   └─ via .github/workflows/deploy.yml
```

---

## ⚠️ Common Mistakes to Avoid

❌ **Ne PAS faire:**
- Disable "Require pull request" (bypasse tout)
- Allow force pushes (perd l'historique)
- Allow deletions (peut supprimer la branche)
- Require 0 approvals (no code review)
- Skip status checks (passe des bugs en prod)

✅ **À FAIRE:**
- Require PR + approvals + status checks
- Disable force push pour admins aussi
- Setup CODEOWNERS for auto-review
- Monitor branch protection logs

---

## 📝 GitHub UI Steps (Visual)

### Screenshot Path:
```
Repository → Settings → Branches → Add rule
     ↓
Enter pattern "main"
     ↓
Enable protection options (see above)
     ↓
Save changes
```

### API Alternative (GitHub CLI):

```bash
# List current rules
gh api repos/{owner}/{repo}/branches/main/protection

# Create protection rule
gh api repos/{owner}/{repo}/branches/main/protection \
  -f required_status_checks='{"strict":true,"contexts":["build","docker-security","secrets"]}' \
  -f enforce_admins=true \
  -f required_pull_request_reviews='{"dismiss_stale_reviews":true,"require_code_owner_reviews":true,"required_approving_review_count":1}'
```

---

## ✅ Validation

Une fois configuré, vous verrez:

✅ **Dans la PR:**
```
All checks have passed
- ✓ build
- ✓ docker-security  
- ✓ secrets
- ✓ codeql
- ✓ 1 approval required
```

✅ **Avant merge:**
```
✓ All conversations resolved
✓ All checks passed
✓ Code owner approval received
✓ Approvals required: 1/1
→ Merge button ENABLED
```

---

## 🔐 Security Best Practices Checklist

- [ ] Branch protection enabled for `main`
- [ ] PR required before merge
- [ ] CI status checks required
- [ ] Code owner review required
- [ ] Force push disabled
- [ ] Deletion disabled
- [ ] Include administrators in rules
- [ ] Dismiss stale approvals enabled
- [ ] Require latest push approval
- [ ] Signed commits enabled (optionnel)

---

## 📞 Support

If branch protection rules fail:
1. Check if all CI checks passed
2. Verify CODEOWNERS is correct
3. Ensure approvers have permissions
4. Contact @devops-team if blocked

---

**Reference:** [GitHub Docs - Branch Protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)

**Recommended Config for PMBCloud Frontend:**
- ✅ See "Configuration Recommandée (Minimale)" section above
- 🔄 Review quarterly
- 🚀 Enforce for all production branches

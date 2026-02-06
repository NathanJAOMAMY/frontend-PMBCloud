# GitHub Secrets Setup Guide

## 📋 Required Secrets for CI/CD Pipeline

This guide explains how to configure GitHub Secrets for the PMBCloud Frontend project.

## Access Control

1. Navigate to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Only repository administrators can configure secrets
4. Secrets are encrypted and only exposed to authorized workflows

## Required Secrets

### 1. **SNYK_TOKEN** (Optional, but recommended)
**Purpose:** Security scanning with Snyk (SCA + container scan)

**Steps to get token:**
1. Sign up at [snyk.io](https://snyk.io)
2. Dashboard → Settings → Auth Token
3. Copy the token

**Add to GitHub:**
1. Settings → Secrets → New repository secret
2. Name: `SNYK_TOKEN`
3. Value: (paste token)
4. Click "Add secret"

**Scope:** This token allows scanning this repository only (can be restricted further in Snyk dashboard)

---

### 2. **RENDER_API_KEY** (For Render deployment)
**Purpose:** Deploy application to Render.com (optional PaaS)

**Steps to get token:**
1. Log in to [render.com](https://render.com)
2. Account Settings → API Keys
3. Create new API key
4. Copy the key

**Add to GitHub:**
1. Settings → Secrets → New repository secret
2. Name: `RENDER_API_KEY`
3. Value: (paste API key)

**Security:** This key allows deploying to your account. **Never commit it or share publicly.**

**Rotation:** Change every 90 days minimum.

---

### 3. **RENDER_FRONTEND_SERVICE_ID** (For Render deployment)
**Purpose:** Target service ID for deployment

**Steps to get ID:**
1. Log in to [render.com](https://render.com)
2. Dashboard → Your Service → Settings
3. Copy the "Service ID"

**Add to GitHub:**
1. Settings → Secrets → New repository secret
2. Name: `RENDER_FRONTEND_SERVICE_ID`
3. Value: (paste service ID)

**Note:** This is your service identifier, not sensitive like API keys.

---

## Optional: GitHub Token (GITHUB_TOKEN)

The `GITHUB_TOKEN` is automatically provided by GitHub Actions for each workflow run. **Do NOT create a personal access token unless necessary.**

**When to use custom GitHub token:**
- You need write access beyond the current repository
- Cross-repository access required
- Fine-grained permissions needed

**If needed:**
1. Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token
3. Grant minimum required scopes (e.g., `repo`, `workflow`)
4. Add as secret `GH_TOKEN` or similar

---

## Viewing & Managing Secrets

### List Secrets
1. Settings → Secrets and variables → Actions
2. All secrets listed (values hidden)

### Update Secret
1. Click the secret name
2. Click "Update"
3. Enter new value
4. Click "Update secret"

### Delete Secret
1. Click the secret name
2. Click "Delete"
3. Confirm deletion

### View Secret Usage
1. Settings → Secrets → select secret
2. Shows which workflows use this secret
3. Helps track dependencies

---

## Security Best Practices

✅ **DO**
- [ ] Rotate secrets every 90 days
- [ ] Use minimum-privilege tokens
- [ ] Document which secret for which purpose
- [ ] Audit who has access
- [ ] Monitor for unauthorized access

❌ **DON'T**
- [ ] Share secrets in Slack/email
- [ ] Commit secrets to repositories
- [ ] Use personal credentials (use service accounts)
- [ ] Reuse secrets across multiple services
- [ ] Log or print secrets in CI output

---

## Troubleshooting

### Secret not available in workflow

**Problem:** Workflow uses `${{ secrets.MY_SECRET }}` but variable is undefined

**Solutions:**
1. Check secret name matches exactly (case-sensitive)
2. Verify secret is created in correct branch's settings
3. Ensure workflow has permission to access secrets
4. Re-run workflow after creating secret

### Accidentally exposed secret

**If secret leaked:**
1. **Immediately** rotate it in GitHub
2. **Immediately** regenerate it in the third-party service (Snyk, Render, etc.)
3. Check repository history for commits containing the secret
4. Contact security team if public repository

---

## Workflow Integration

Example usage in `.github/workflows/ci.yml`:

```yaml
- name: Snyk Security Scan
  if: env.SNYK_TOKEN != ''
  uses: snyk/actions/node@master
  env:
    SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

The syntax `${{ secrets.SNYK_TOKEN }}` retrieves the secret securely.

---

## Monitoring & Audit

### GitHub Security Log
Settings → Security log
- Shows secret creation/deletion
- Shows which workflows accessed secrets
- Useful for audit trails

### GitHub Audit Log (Enterprise)
If your organization uses GitHub Enterprise:
- More detailed audit logs available
- Track secret lifecycle
- Compliance reporting

---

## Contact & Support

For secret-related questions:
- Slack: #devops or #security-team
- Email: devops@pmbcloud.dev
- Escalate: @devops-lead

---

**Last Updated:** 6 February 2026  
**Maintainer:** DevOps Team

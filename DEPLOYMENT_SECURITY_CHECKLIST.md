# Deployment Security Checklist

Use this checklist before deploying to production.

## Pre-Deployment

- [ ] CI pipeline PASSED (all jobs successful)
- [ ] No CRITICAL vulnerabilities in Trivy scan
- [ ] No CRITICAL or HIGH vulnerabilities in npm audit
- [ ] CodeQL scan completed without blocking issues
- [ ] Snyk scan passed (if configured)
- [ ] SBOM generated and archived (`sbom.json`)
- [ ] All secrets rotated within last 90 days
- [ ] No hardcoded secrets in code (detected by detect-secrets)
- [ ] Dockerfile uses non-root user
- [ ] Nginx CSP headers configured
- [ ] All GitHub required checks passed

## Code Review

- [ ] At least 1 code review completed
- [ ] Security team approved (if `CODEOWNERS` requires)
- [ ] No suspicious dependencies added
- [ ] No `eval()`, `exec()`, or dynamic requires
- [ ] No hardcoded credentials, URLs with secrets, or API keys

## Container Security

- [ ] Docker image tagged with commit SHA: `pmbcloud-frontend:${{ github.sha }}`
- [ ] Base image (Alpine/nginx) up-to-date
- [ ] Image size optimized (multi-stage build)
- [ ] Trivy scan PASSED (CRITICAL/HIGH < threshold)
- [ ] No layer with sensitive data exposure
- [ ] File permissions correct (readable by nginx user only)

## Configuration

- [ ] Nginx CSP headers present and strict:
  - `default-src 'self'`
  - `script-src 'self'` (no 'unsafe-inline' in prod)
  - `style-src 'self'`
  - `img-src 'self' data: https:`
- [ ] X-Frame-Options: DENY
- [ ] X-Content-Type-Options: nosniff
- [ ] X-XSS-Protection: 1; mode=block
- [ ] Referrer-Policy configured
- [ ] HSTS enabled (if HTTPS only)

## Secret Management

- [ ] All secrets stored in GitHub Secrets (not in .env files)
- [ ] Service tokens have minimal required permissions (least privilege)
- [ ] Database credentials never in container image
- [ ] API keys injected via environment variables
- [ ] Secret rotation documented

## Deployment Targets

### Render (or similar PaaS)

- [ ] Environment variables configured (not in Dockerfile)
- [ ] Deployment key/API token not exposed
- [ ] Health checks configured
- [ ] Auto-rollback enabled for failed deployments
- [ ] Monitoring and alerting enabled

### Docker Registry (if using private registry)

- [ ] Image pushed with signed tags (cosign - future enhancement)
- [ ] Registry access restricted to authorized users
- [ ] Image retention policy configured
- [ ] Scan images at rest (registry-side scanning)

## Monitoring & Incidents

- [ ] Error tracking enabled (e.g., Sentry)
- [ ] Performance monitoring configured
- [ ] Security alerts configured (failed auth, unusual activity)
- [ ] Incident response plan reviewed
- [ ] Team notified of deployment

## Post-Deployment

- [ ] Health checks passing on production
- [ ] No errors in application logs
- [ ] CSP header validation (curl or browser DevTools)
- [ ] Security headers verified:
  ```bash
  curl -I https://your-app.com | grep -E "Content-Security-Policy|X-Frame-Options|X-Content-Type-Options"
  ```
- [ ] Functionality smoke tests passed
- [ ] Performance metrics baseline established
- [ ] User reports monitored for issues

## Compliance & Audit

- [ ] Deployment logged with timestamp, actor, version
- [ ] Change log updated
- [ ] Rollback plan documented
- [ ] Audit trail archived (for SOC2, ISO 27001, etc.)

## Incident Response (if needed)

- [ ] Root cause analysis initiated
- [ ] Rollback executed if necessary
- [ ] Stakeholders notified
- [ ] Patches developed and tested
- [ ] Prevention added to CI/CD pipeline

---

**Deployment Date** : _______________  
**Deployed By** : _______________  
**Approved By** : _______________  
**Ticket/Issue** : _______________  

**Notes** :
```




```

---

For more details, see [SECURITY.md](../SECURITY.md) and [CI Pipeline](../../.github/workflows/ci.yml)

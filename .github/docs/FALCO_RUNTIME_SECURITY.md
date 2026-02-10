# Falco - Runtime Security Monitoring

## Vue d'ensemble

**Falco** est un outil open-source de **runtime security** qui détecte les comportements suspects et les violations de sécurité en temps réel en surveillance les appels système.

### Ce que Falco détecte

✅ **Exécution de commandes suspectes** : shell, bash, nc, curl (injectées ou inattendues)  
✅ **Escalade de privilèges** : tentatives `sudo`/`su` depuis un conteneur  
✅ **Connexions outbound** : reverse shells ou tunneling non autorisé  
✅ **Modification de fichiers sensibles** : /etc, /root, /app/dist, etc.  
✅ **Activité système anormale** : file access patterns inhabituels, network scanning, etc.

---

## Intégration CI/CD

### Job Falco dans le Workflow

Le job `falco-runtime-security` s'exécute à chaque push/PR :

```yaml
falco-runtime-security:
  name: Falco Runtime Security Monitoring
  runs-on: ubuntu-latest
  needs: docker-build
```

**Étapes :**
1. Lance l'application conteneurisée avec les capabilities nécessaires
2. Exécute Falco en mode sidemount pour monitorer les appels système
3. Exécute pendant **60 secondes** (durée ajustable)
4. Capture et reporte les violations de sécurité
5. Upload les résultats (`falco-results/`) pour audit

### Artefacts générés

- `falco-events.log` : événements Falco (JSON/plain)
- `falco-summary.json` : rapport structuré des checks actifs

### Important - Limitation Render

Falco requiert un accès bas-niveau au noyau (eBPF/syscalls) et l'accès aux namespaces hôtes (proc, sys, docker socket). Les plateformes PaaS comme **Render** n'autorisent généralement pas ce niveau d'accès depuis un container applicatif. En pratique :

- Le job Falco inclus dans CI est un test ponctuel (60s) utile pour détecter comportements évidents durant la validation, mais **ne remplace pas** la surveillance continue en production.
- Pour la production sur Render, options :
  - Déployer Falco sur les nœuds hôtes (impossible sur Render managed).
  - Utiliser un service managé de runtime security (Datadog Runtime Security, etc.) si supporté.
  - Héberger l'application sur une infra où vous contrôlez l'hôte (VMs / Kubernetes) pour permettre Falco.

---

## Règles Falco Intégrées

Le workflow inclut 4 règles de sécurité essentielles :

### 1. Suspicious Command Execution
```
Condition: Spawn bash/sh/nc/curl à l'intérieur du conteneur
Priorité: WARNING
Action: Log événement pour analyse
```

### 2. Privilege Escalation
```
Condition: Tentative sudo/su du conteneur
Priorité: CRITICAL
Action: Block/Alert immédiat
```

### 3. Reverse Shell Detection
```
Condition: Connexion outbound anormale (port > 1024 vers port > 1024)
Priorité: HIGH
Action: Alert + Block si enabled
```

### 4. Sensitive File Modification
```
Condition: Écriture dans /etc, /root, /app/dist
Priorité: HIGH
Action: Audit trail + Alert
```

---

## Configuration pour la Production

### Déploiement sur Kubernetes

```bash
# 1. Installer Falco Helm Chart
helm repo add falcosecurity https://falcosecurity.github.io/charts
helm install falco falcosecurity/falco \
  --set falco.grpc.enabled=true \
  --set falco.grpcOutput.enabled=true \
  --set falco.ebpf.enabled=true
```

### Déploiement sur Host (systemd)

```bash
# 1. Installer Falco
curl https://falco.org/repo/falcosecurity-3739DA6.asc | apt-key add -
apt-add-repository https://download.falco.org/packages/deb
apt-get update
apt-get install -y falco

# 2. Configurer les règles personnalisées
cat > /etc/falco/rules.d/custom-rules.yaml << 'EOF'
# Règles pour votre app
EOF

# 3. Démarrer Falco
systemctl start falco
systemctl enable falco

# 4. Afficher les alertes en direct
journalctl -u falco -f
```

### Intégration SIEM / Centralisée

#### Via Syslog à ELK Stack

```yaml
# /etc/falco/falco.yaml
syslog_output:
  enabled: true
  address: syslog://elk-host:514
  facility: LOCAL0
```

#### Via Webhook à Slack/Teams

```yaml
# falco-sidecar configuration
webhook_output:
  enabled: true
  url: https://hooks.slack.com/services/YOUR/WEBHOOK
```

#### Via Falco Sidekick (agrégation multi-source)

```bash
# Agrégateur d'événements Falco → SIEM
docker run -d \
  -e SLACK_WEBHOOK_URL=https://... \
  -e DATADOG_API_KEY=... \
  falcosecurity/falco-sidekick
```

---

## Alertes à Configurer (Production)

### Slack Alert sur Détection CRITICAL

```json
{
  "condition": "rule.priority == 'CRITICAL'",
  "notification": "slack",
  "actions": [
    "alert_team",
    "create_jira_incident",
    "trigger_runbook"
  ]
}
```

### Datadog Integration

```bash
# Agent Falco → Datadog
export DD_API_KEY=xxxx
falco --k8s-api=https://k8s.example.com \
      --k8s-audit-endpoint=http://datadog-agent:8125
```

### Grafana Dashboard

Falco peut envoyer métriques Prometheus :

```yaml
falco:
  metrics:
    enabled: true
    port: 5555  # Prometheus scrape target
```

Dashboard exemple :
- Rules triggered / minute
- CPU % (de Falco lui-même)
- Events rate by severity
- Top rules by frequency

---

## Cas d'Usage Avancés

### 1. Policy as Code (Kubernetes)

```yaml
# PSP (Pod Security Policy) complément à Falco
apiVersion: policy/v1beta1
kind: PodSecurityPolicy
metadata:
  name: restricted
spec:
  privileged: false
  allowPrivilegeEscalation: false
  requiredDropCapabilities:
    - ALL
  allowedCapabilities:
    - NET_BIND_SERVICE
```

### 2. Runtime Enforcement

```bash
# Falco + OPA Gatekeeper pour blocker automatiquement
# À la détection CRITICAL, OPA rejette le pod
```

### 3. Anomaly Detection (ML)

```bash
# Falco EventGenerator pour baseline
# Falco machine learning plugin (experimental)
# Détecte déviations du comportement "normal"
```

---

## Limitations & Optimisations

### Performance

| Mode | CPU | Mémoire | Latence | Recommandation |
|------|-----|---------|---------|---|
| Syscalls native | 15-30% | 100-200MB | < 50µs | Production haute-charge |
| eBPF | 5-10% | 50-100MB | < 100µs | **Préféré** pour K8s |
| Kernel module | 8-12% | 80-150MB | < 50µs | Bare metal |

**CI/CD (GitHub Actions)** : Mode syscalls natif suffisant (60s only)

### False Positives

Réduire false positives via :
1. **Macros personnalisées** : `allowed_bash_commands`, etc.
2. **Exceptions** : `proc_name in (allowed_binaries)`
3. **Baseline** : générer baseline du comportement normal

---

## Checklist Production

- [ ] Falco déployé sur tous les nœuds K8s / VMs prod
- [ ] Centralisé vers SIEM (ELK, Splunk, Datadog)
- [ ] Alertes configurées (Slack, PagerDuty, etc.)
- [ ] Dashboard Grafana pour trending
- [ ] Rules tuned pour votre app (false positive rate < 1%)
- [ ] Audit trail archivé (30 jours min.)
- [ ] Plan d'escalade documenté
- [ ] Test incident response mensuel

---

## Liens Utiles

- **Docs Falco** : https://falco.org/docs/
- **Rules Repo** : https://github.com/falcosecurity/rules
- **Falco Sidekick** : https://github.com/falcosecurity/falcosidekick
- **Community Slack** : https://join.slack.com/t/falcocommunity/shared_invite

---

## Support

- Local tests : `falco-runtime-results/` artifacts after CI run
- Production deployment : Consulter `README_DEVSECOPS.md`
- Questions : #security-team (Slack)

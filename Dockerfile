# =============================================
# DOCKERFILE SÉCURISÉ - FRONTEND PMBCLOUD
# Adapté à votre configuration spécifique
# =============================================

# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app

# Installer les outils nécessaires pour la sécurité
RUN apk add --no-cache git

# Optimisation cache - copier package.json d'abord
COPY package*.json ./
RUN npm ci --silent --audit=false

# Copier les fichiers de configuration
COPY vite.config.js ./
COPY tsconfig.json ./
COPY . .

# Variables d'environnement pour le build
ARG VITE_API_BASE_URL=http://localhost:3001
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Builder l'application
RUN npm run build

# Nettoyage des fichiers inutiles
RUN find /app/dist -name "*.map" -delete

# Stage 2: Production
FROM nginxinc/nginx-unprivileged:alpine

# Installation de curl et gettext (pour envsubst) en tant que root temporairement
USER root
RUN apk add --no-cache curl gettext && \
    # Nettoyer le cache
    rm -rf /var/cache/apk/*

# Copier les fichiers buildés
COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html

# Copier les fichiers public restants (manifest, service-worker, etc.)
COPY --from=builder --chown=nginx:nginx /app/public /usr/share/nginx/html

# Copier la configuration nginx template et le script d'entrypoint
COPY --chown=nginx:nginx nginx.conf.template /etc/nginx/nginx.conf.template
COPY --chown=root:root docker-entrypoint.sh /docker-entrypoint.sh

# Rendre le script d'entrypoint exécutable
RUN chmod +x /docker-entrypoint.sh

# S'assurer que les permissions sont correctes
RUN chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    chmod -R 755 /var/cache/nginx && \
    chmod -R 755 /var/log/nginx && \
    chmod 755 /etc/nginx

# Le script d'entrypoint lance nginx qui switche vers l'utilisateur nginx
# Pas besoin de faire USER nginx ici puisque nginx.conf configurera l'utilisateur

# Health check (utilise le script créé)
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8080/ || exit 1

EXPOSE 8080

# Utiliser le script d'entrypoint pour substituer les variables et lancer nginx
ENTRYPOINT ["/docker-entrypoint.sh"]
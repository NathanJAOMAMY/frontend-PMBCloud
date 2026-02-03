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
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_KEY
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_KEY=${VITE_SUPABASE_KEY}

# Builder l'application
RUN npm run build

# Nettoyage des fichiers inutiles
RUN find /app/dist -name "*.map" -delete && \
    rm -rf /app/node_modules

# Stage 2: Production
FROM nginxinc/nginx-unprivileged:alpine

# Installation de curl pour health check (en tant que root temporairement)
USER root
RUN apk add --no-cache curl && \
    # Créer un script de health check simple
    echo '#!/bin/sh' > /docker-healthcheck.sh && \
    echo 'curl -f -s -o /dev/null -w "%{http_code}" http://localhost:8080/ | grep -q "200\|301\|302\|304"' >> /docker-healthcheck.sh && \
    chmod +x /docker-healthcheck.sh && \
    # Nettoyer le cache
    rm -rf /var/cache/apk/*

# Retour à l'utilisateur non-root
USER nginx

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -G appgroup -u 1001

# Copier les fichiers buildés
COPY --from=builder --chown=appuser:appgroup /app/dist /usr/share/nginx/html

# Copier la configuration nginx sécurisée
COPY nginx.conf /etc/nginx/nginx.conf

# Copier les fichiers buildés dans le répertoire nginx
COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html

# Changer les permissions
RUN chown -R appuser:appgroup /usr/share/nginx/html && \
    chown -R appuser:appgroup /var/cache/nginx && \
    chown -R appuser:appgroup /var/log/nginx && \
    chmod -R 755 /usr/share/nginx/html && \
    chmod 644 /usr/share/nginx/html/index.html && \
    # Supprimer les fichiers par défaut inutiles
    rm -f /usr/share/nginx/html/50x.html

# Sécurité: Supprimer les fichiers sensibles
RUN rm -f /docker-entrypoint.d/* && \
    rm -rf /var/cache/nginx/*

# Utiliser l'utilisateur non-root
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/ || exit 1

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
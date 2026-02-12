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
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Builder l'application
RUN npm run build

# Nettoyage des fichiers inutiles
RUN find /app/dist -name "*.map" -delete

# Stage 2: Production
FROM nginxinc/nginx-unprivileged:alpine

# Installation de curl pour health check (en tant que root temporairement)
USER root
RUN apk add --no-cache curl && \
    # Nettoyer le cache
    rm -rf /var/cache/apk/*

# Copier les fichiers buildés
COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html

# Backend API URL (must be set via build args or environment variable)
# Do NOT hardcode the URL here - set it via docker-compose or Render build args
ARG BACKEND_API_URL

# Copier et configurer nginx
COPY --chown=nginx:nginx nginx.conf /etc/nginx/nginx.conf

# Remplacer les variables d'environnement dans nginx.conf à la construction
RUN sed -i "s|\${BACKEND_API_URL}|${BACKEND_API_URL}|g" /etc/nginx/nginx.conf

# S'assurer que les permissions sont correctes

RUN chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    chmod -R 755 /var/cache/nginx && \
    chmod -R 755 /var/log/nginx

# Retour à l'utilisateur non privilégié
USER nginx

# Health check (utilise le script créé)
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8080/ || exit 1

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
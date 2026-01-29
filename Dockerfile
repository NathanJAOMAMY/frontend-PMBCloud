# =============================================
# DOCKERFILE SÉCURISÉ - FRONTEND PMBCLOUD
# Adapté à votre configuration spécifique
# =============================================

# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app

# Optimisation cache - copier package.json d'abord
COPY package*.json ./
RUN npm ci --silent

# Copier les fichiers de configuration
COPY vite.config.js ./
COPY tsconfig.json ./
COPY . .

# Variables d'environnement pour le build
ARG VITE_API_BASE_URL=http://localhost:3001
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Builder l'application - VOTRE COMMANDE SPÉCIFIQUE
RUN npm run build 

# Stage 2: Production
FROM nginx:alpine

# Installer curl pour health check
RUN apk add --no-cache curl

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -G appgroup -u 1001

# Copier les fichiers buildés
COPY --from=builder --chown=appuser:appgroup /app/dist /usr/share/nginx/html

# Copier la configuration nginx sécurisée
COPY nginx.conf /etc/nginx/nginx.conf

# Changer les permissions
RUN chown -R appuser:appgroup /usr/share/nginx/html && \
    chown -R appuser:appgroup /var/cache/nginx && \
    chown -R appuser:appgroup /var/log/nginx && \
    chmod -R 755 /usr/share/nginx/html

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
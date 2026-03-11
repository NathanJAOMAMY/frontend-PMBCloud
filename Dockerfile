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
# These ARG values are defaults; Render can override via --build-arg or .env
ARG VITE_API_BASE_URL=http://localhost:3001
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_KEY

# Set as ENV so they're available during npm run build
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_KEY=${VITE_SUPABASE_KEY}

# Create .env.production so Vite can access vars (for safety in build-time substitution)
RUN echo "Creating .env.production for Vite build..." && \
    ([ -n "$VITE_API_BASE_URL" ] && echo "VITE_API_BASE_URL=$VITE_API_BASE_URL" || echo "# VITE_API_BASE_URL not set") > .env.production && \
    ([ -n "$VITE_SUPABASE_URL" ] && echo "VITE_SUPABASE_URL=$VITE_SUPABASE_URL" || echo "# VITE_SUPABASE_URL not set") >> .env.production && \
    ([ -n "$VITE_SUPABASE_KEY" ] && echo "VITE_SUPABASE_KEY=$VITE_SUPABASE_KEY" || echo "# VITE_SUPABASE_KEY not set") >> .env.production && \
    echo "--- .env.production content ---" && cat .env.production && echo "---"

# Builder l'application
RUN npm run build

# Assurer que TOUS les fichiers public sont dans dist (logo.png, manifest.json, service-worker.js)
RUN echo "=== Files in dist after build ===" && ls -la dist/
RUN echo "=== Copying all files from public/ to dist/ ===" && cp -v public/logo.png public/manifest.json public/service-worker.js dist/ && echo "✓ All PWA files copied"
RUN echo "=== Verification: files in dist/ ===" && ls -la dist/ | grep -E "(logo|manifest|service-worker|index.html)"

# Nettoyage des fichiers inutiles
RUN find /app/dist -name "*.map" -delete && echo "✓ Source maps removed"

# Stage 2: Production
FROM nginxinc/nginx-unprivileged:alpine

# Installation de curl et gettext (pour envsubst) en tant que root temporairement
USER root
RUN apk add --no-cache curl gettext && \
    # Nettoyer le cache
    rm -rf /var/cache/apk/*

# Copier les fichiers buildés
COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html

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

# Health check uses the same port the server listens on. If PORT is not set we
# default to 8080 so local builds still work. Render will provide PORT env var.
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:${PORT}/health || exit 1

EXPOSE 8080

# Utiliser le script d'entrypoint pour substituer les variables et lancer nginx
ENTRYPOINT ["/docker-entrypoint.sh"]
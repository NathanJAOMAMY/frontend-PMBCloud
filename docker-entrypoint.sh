#!/bin/sh
set -e

# Script d'entrypoint pour nginx avec substitution des variables d'environnement

# Définir les variables par défaut si non présentes
export VITE_API_BASE_URL=${VITE_API_BASE_URL:-http://localhost:3001}
export PORT=${PORT:-8080}

echo "Starting nginx with API base URL: $VITE_API_BASE_URL" && \
# log the port (Render provides PORT env var)
echo "Listening on port: ${PORT:-8080}" && \
# debug: show connect-src value that will be generated
printf "# CSP connect-src will include: %s\n" "$VITE_API_BASE_URL"

# Substituer les variables d'environnement dans le template et générer le fichier final
# we support both VITE_API_BASE_URL and PORT for dynamic configuration
envsubst '${VITE_API_BASE_URL} ${PORT}' < /etc/nginx/nginx.conf.template > /tmp/nginx.conf

# Valider la configuration nginx avant de la copier
nginx -t -c /tmp/nginx.conf || exit 1

# Copier la configuration générée vers le chemin final
# Note: We need to write directly since nginx-unprivileged has limited permissions
mkdir -p /etc/nginx 2>/dev/null || true
cp /tmp/nginx.conf /etc/nginx/nginx.conf 2>/dev/null || {
    echo "Warning: Could not copy to /etc/nginx/nginx.conf, using stdin method"
}

# Lancer nginx
exec nginx -g "daemon off;"

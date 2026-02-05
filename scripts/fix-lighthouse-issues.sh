#!/bin/bash
echo "=== Fixing Lighthouse CSP and Console Errors ==="

# 1. Vérifier et nettoyer les console.log en production
echo "Cleaning console.log statements..."
find ./src -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) | while read -r file; do
  if [ -f "$file" ]; then
    # Commenter les console.log (garder pour debug)
    sed -i.bak "s/console\.log(/\/\/ console.log(/g" "$file"
    sed -i.bak "s/console\.warn(/\/\/ console.warn(/g" "$file"
    sed -i.bak "s/console\.info(/\/\/ console.info(/g" "$file"
    # Supprimer les fichiers .bak
    rm -f "${file}.bak"
  fi
done 2>/dev/null

# 2. Créer un wrapper pour les logs en production
echo "Creating production logger..."
mkdir -p ./src/utils
cat > ./src/utils/logger.js << 'EOF'
// Production-safe logger
export const logger = {
  log: (...args) => {
    if (import.meta.env.DEV || process.env.NODE_ENV === 'development') {
      console.log('[DEV]', ...args);
    }
  },
  error: (...args) => {
    console.error('[ERROR]', ...args);
  },
  warn: (...args) => {
    console.warn('[WARN]', ...args);
  },
  info: (...args) => {
    if (import.meta.env.DEV || process.env.NODE_ENV === 'development') {
      console.info('[INFO]', ...args);
    }
  }
};
EOF

echo "=== Applying fixes to nginx.conf ==="

# 3. Mettre à jour nginx.conf avec la CSP optimisée
if [ -f "nginx.conf" ]; then
  echo "Updating nginx.conf..."
  
  # Créer une sauvegarde
  cp nginx.conf nginx.conf.backup
  
  # Nouvelle CSP pour React/Vite - Utilisation de \x27 pour les guillemets simples
  CSP_LINE='    add_header Content-Security-Policy "default-src \x27self\x27; script-src \x27self\x27 \x27unsafe-inline\x27 \x27unsafe-eval\x27; style-src \x27self\x27 \x27unsafe-inline\x27; font-src \x27self\x27 data:; img-src \x27self\x27 data: blob: https:; connect-src \x27self\x27 ws: wss:; frame-src \x27self\x27; media-src \x27self\x27 data: blob:; worker-src \x27self\x27 blob:; manifest-src \x27self\x27; base-uri \x27self\x27; form-action \x27self\x27; frame-ancestors \x27none\x27;" always;'
  
  # Vérifier si CSP existe déjà
  if grep -q "Content-Security-Policy" nginx.conf; then
    # Remplacer l'existant
    sed -i.bak "/Content-Security-Policy/d" nginx.conf
    rm -f nginx.conf.bak
  fi
  
  # Insérer après X-XSS-Protection
  if grep -q "X-XSS-Protection" nginx.conf; then
    sed -i "/X-XSS-Protection/a\\$CSP_LINE" nginx.conf
    echo " CSP added after X-XSS-Protection"
  else
    # Sinon, ajouter dans la section http
    sed -i '/http {/a\\'"$CSP_LINE" nginx.conf
    echo " CSP added to http section"
  fi
  
  echo " nginx.conf updated"
  
  # Afficher la CSP ajoutée pour vérification
  echo "=== Updated CSP ==="
  grep -A1 "Content-Security-Policy" nginx.conf
  
else
  echo " nginx.conf not found"
  
  # Créer un nginx.conf minimal si non existant
  cat > nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    access_log /dev/stdout;
    error_log /dev/stderr;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    # CSP for React/Vite
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: blob: https:; connect-src 'self' ws: wss:; frame-src 'self'; media-src 'self' data: blob:; worker-src 'self' blob:; manifest-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';" always;

    server {
        listen 8080;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        location / {
            try_files $uri $uri/ /index.html;
        }

        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            access_log off;
        }
    }
}
EOF
  echo " nginx.conf created with CSP"
fi

echo "=== Creating .env.production ==="

# 4. Créer fichier d'environnement pour production
if [ ! -f ".env.production" ]; then
  cat > .env.production << 'EOF'
NODE_ENV=production
VITE_SUPABASE_URL=your_url_here
VITE_SUPABASE_ANON_KEY=your_key_here
VITE_APP_VERSION=1.0.0
EOF
  echo " .env.production created"
else
  echo " .env.production already exists"
fi

echo "=== Summary ==="
echo " Console logs cleaned"
echo " Production logger created"
echo " nginx.conf updated with optimal CSP"
echo " .env.production ready"
echo ""
echo "Next steps:"
echo "1. Rebuild: npm run build"
echo "2. Test locally: npm run preview"
echo "3. Run Lighthouse test: npm run lhci:audit"
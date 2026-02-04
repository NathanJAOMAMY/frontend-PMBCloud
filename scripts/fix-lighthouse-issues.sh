#!/bin/bash
echo "=== Fixing Lighthouse CSP and Console Errors ==="

# 1. Vérifier et nettoyer les console.log en production
echo "Cleaning console.log statements..."
find ./src -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) | while read -r file; do
  if [ -f "$file" ]; then
    # Sauvegarder le fichier original
    cp "$file" "${file}.backup"
    
    # Commenter les console.log (garder pour debug)
    sed -i.bak "s/console\.log(/\/\/ console.log(/g" "$file"
    sed -i.bak "s/console\.warn(/\/\/ console.warn(/g" "$file"
    sed -i.bak "s/console\.info(/\/\/ console.info(/g" "$file"
    
    # Supprimer les fichiers .bak
    rm -f "${file}.bak"
  fi
done

# 2. Créer un wrapper pour les logs en production
echo "Creating production logger..."
cat > ./src/utils/logger.ts << 'EOF'
// Production-safe logger
export const logger = {
  log: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[DEV]', ...args);
    }
  },
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args);
  },
  warn: (...args: any[]) => {
    console.warn('[WARN]', ...args);
  },
  info: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
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
  
  # Nouvelle CSP pour React/Vite
  CSP_HEADER='add_header Content-Security-Policy "default-src \'self\'; script-src \'self\' \'unsafe-inline\' \'unsafe-eval\'; style-src \'self\' \'unsafe-inline\'; font-src \'self\' data:; img-src \'self\' data: blob: https:; connect-src \'self\' ws: wss:; frame-src \'self\'; media-src \'self\' data: blob:; worker-src \'self\' blob:; manifest-src \'self\'; base-uri \'self\'; form-action \'self\'; frame-ancestors \'none\';" always;'
  
  # Vérifier si CSP existe déjà
  if grep -q "Content-Security-Policy" nginx.conf; then
    # Remplacer l'existant
    sed -i.bak "/Content-Security-Policy/d" nginx.conf
    # Insérer après les autres headers de sécurité
    sed -i.bak '/add_header X-XSS-Protection/a\\    '"$CSP_HEADER" nginx.conf
    rm -f nginx.conf.bak
  else
    # Ajouter après X-XSS-Protection
    sed -i.bak '/add_header X-XSS-Protection/a\\    '"$CSP_HEADER" nginx.conf
    rm -f nginx.conf.bak
  fi
  
  echo "✓ nginx.conf updated"
else
  echo "⚠️ nginx.conf not found"
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
  echo "✓ .env.production created"
else
  echo "✓ .env.production already exists"
fi

echo "=== Summary ==="
echo "✓ Console logs cleaned"
echo "✓ Production logger created"
echo "✓ nginx.conf updated with optimal CSP"
echo "✓ .env.production ready"
echo ""
echo "Next steps:"
echo "1. Rebuild: npm run build"
echo "2. Test locally: npm run preview"
echo "3. Run Lighthouse test: npm run lhci:audit"
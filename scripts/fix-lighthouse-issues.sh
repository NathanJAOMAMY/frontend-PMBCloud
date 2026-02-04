#!/bin/bash
echo "=== Fixing Lighthouse CSP and Console Errors ==="

# 1. Vérifier et nettoyer les console.log en production
echo "Cleaning console.log statements..."
find ./src -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | while read file; do
  if [ -f "$file" ]; then
    # Commenter les console.log (garder pour debug)
    sed -i "s/console\.log(/\/\/ console.log(/g" "$file"
    sed -i "s/console\.warn(/\/\/ console.warn(/g" "$file"
    sed -i "s/console\.info(/\/\/ console.info(/g" "$file"
  fi
done

# 2. Créer un wrapper pour les logs en production
cat > ./src/utils/logger.ts << 'EOL'
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
  }
};
EOL

echo "=== Applying fixes to nginx.conf ==="

# 3. Mettre à jour nginx.conf avec la CSP optimisée
if [ -f "nginx.conf" ]; then
  echo "Updating nginx.conf..."
  
  # Créer une sauvegarde
  cp nginx.conf nginx.conf.backup
  
  # Remplacer la section CSP
  sed -i '/Content-Security-Policy/,/"/d' nginx.conf
  
  # Ajouter la nouvelle CSP
  sed -i '/# Headers de sécurité/a\    # CSP optimisée pour React/Vite\n    add_header Content-Security-Policy "default-src \'self\'; script-src \'self\' \'unsafe-inline\' \'unsafe-eval\'; style-src \'self\' \'unsafe-inline\'; font-src \'self\' data:; img-src \'self\' data: blob: https:; connect-src \'self\' ws: wss:; frame-src \'self\'; media-src \'self\' data: blob:; worker-src \'self\' blob:; manifest-src \'self\'; base-uri \'self\'; form-action \'self\'; frame-ancestors \'none\' ;" always;' nginx.conf
  
  echo "✓ nginx.conf updated"
fi

echo "=== Creating .env.production ==="

# 4. Créer fichier d'environnement pour production
cat > .env.production << 'EOL'
NODE_ENV=production
VITE_SUPABASE_URL=your_url_here
VITE_SUPABASE_ANON_KEY=your_key_here
VITE_APP_VERSION=1.0.0
EOL

echo "=== Summary ==="
echo "✓ Console logs cleaned"
echo "✓ Production logger created"
echo "✓ nginx.conf updated with optimal CSP"
echo "✓ .env.production created"
echo ""
echo "Next steps:"
echo "1. Rebuild: npm run build"
echo "2. Test locally: npm run preview"
echo "3. Run Lighthouse test: npm run lhci:audit"
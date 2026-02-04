#!/bin/bash
echo "=== Fixing Lighthouse CSP Issue ==="

# 1. Vérifiez et corrigez nginx.conf
if [ -f "nginx.conf" ]; then
  echo "Updating nginx.conf with CSP headers..."
  
  # Créez une sauvegarde
  cp nginx.conf nginx.conf.backup
  
  # Ajoutez CSP si manquante
  if ! grep -q "Content-Security-Policy" nginx.conf; then
    cat >> nginx.conf << 'EOL'

    # Headers de sécurité (ajoutés pour Lighthouse)
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
EOL
    echo "✓ CSP headers added to nginx.conf"
  else
    echo "✓ CSP headers already present"
  fi
fi

# 2. Créez un fichier de test pour vérifier
echo "Creating test HTML file..."
cat > test-csp.html << 'EOL'
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Security-Policy" content="default-src 'self';">
    <title>Test CSP</title>
</head>
<body>
    <h1>Test Page for CSP</h1>
    <script>
        // Script inline nécessite 'unsafe-inline' ou nonce/hash
        console.log('Test page loaded');
    </script>
</body>
</html>
EOL

echo "=== Fixing Console Errors ==="

# 3. Vérifiez les erreurs JS courantes
echo "Checking for common JavaScript issues..."

# Recherchez les console.log en production
if grep -r "console\." ./src --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" | grep -v "console.error" | head -5; then
  echo "⚠️  Found console.log statements. Consider removing for production."
fi

echo "=== Setup complete ==="
echo "Next steps:"
echo "1. Rebuild your Docker image: docker build -t pmbcloud-frontend ."
echo "2. Test locally: docker run -p 8080:8080 pmbcloud-frontend"
echo "3. Check CSP headers: curl -I http://localhost:8080"
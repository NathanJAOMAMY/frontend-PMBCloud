# scripts/prepare-lighthouse.sh
#!/bin/bash

# Build l'application
npm run build

# Démarrer le serveur de test
npx serve@latest -s dist -l 8080 --cors &
SERVER_PID=$!

# Attendre que le serveur soit prêt
sleep 15

# Tester les headers
echo "Testing headers..."
curl -I http://localhost:8080

# Lancer Lighthouse une fois pour vérifier
npx lighthouse http://localhost:8080 --output=json --output-path=./lh-report.json --chrome-flags="--headless"

# Arrêter le serveur
kill $SERVER_PID

echo "Lighthouse preparation complete"
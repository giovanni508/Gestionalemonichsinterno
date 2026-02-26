#!/bin/bash

echo "🚀 Avvio Monichs Gestionale..."

# 1. Avvia PostgreSQL (se non già attivo)
if ! pg_isready -q 2>/dev/null; then
  echo "📦 Avvio PostgreSQL..."
  brew services start postgresql@16 2>/dev/null || pg_ctlcluster 16 main start 2>/dev/null
  sleep 2
fi
echo "✅ PostgreSQL attivo"

# 2. Verifica che il database esista, altrimenti crealo
if ! psql -d monichs_pm -c "SELECT 1" &>/dev/null; then
  echo "📦 Creazione database..."
  createuser -s monichs 2>/dev/null
  createdb monichs_pm -O monichs 2>/dev/null
  psql -d monichs_pm -c "ALTER USER monichs WITH PASSWORD 'monichs';" 2>/dev/null
  echo "✅ Database creato"
else
  echo "✅ Database già esistente"
fi

# 3. Installa dipendenze se manca node_modules
if [ ! -d "node_modules" ]; then
  echo "📦 Installazione dipendenze..."
  npm install
fi
echo "✅ Dipendenze OK"

# 4. Sincronizza schema database
echo "📦 Sincronizzazione database..."
npx prisma db push --skip-generate 2>/dev/null
npx prisma generate 2>/dev/null
echo "✅ Schema sincronizzato"

# 5. Seed (solo se il database è vuoto)
USER_COUNT=$(psql -d monichs_pm -t -c "SELECT COUNT(*) FROM \"User\";" 2>/dev/null | tr -d ' ')
if [ "$USER_COUNT" = "0" ] || [ -z "$USER_COUNT" ]; then
  echo "📦 Popolamento dati iniziali..."
  npx prisma db seed
  echo "✅ Dati caricati"
else
  echo "✅ Dati già presenti ($USER_COUNT utenti)"
fi

# 6. Avvia il server
echo ""
echo "========================================="
echo "  🌐 Server in avvio su http://localhost:3000"
echo "  📧 Login: gio@monichs.com"
echo "  🔑 Password: admin123"
echo "  ⏹  Per fermare: Ctrl+C"
echo "========================================="
echo ""

npm run dev

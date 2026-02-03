#!/bin/bash

# 🚀 Deploy Automático Simplificado - Cantina Control
# Execute após configurar a Cloudflare API Key

set -e

echo "=========================================="
echo "🚀 Deploy Automático - Cantina Control"
echo "=========================================="
echo ""

PROJECT_NAME="cantina-control"
DB_NAME="cantina-control-production"

# Verificar se wrangler está instalado
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler não encontrado. Instalando..."
    npm install -g wrangler
fi

# Fazer login
echo "🔐 Verificando autenticação..."
if ! wrangler whoami &> /dev/null; then
    echo "Fazendo login..."
    wrangler login
fi

echo "✅ Autenticado com sucesso!"
echo ""

# Criar D1 database
echo "📊 Criando banco D1..."
DB_OUTPUT=$(wrangler d1 create $DB_NAME 2>&1 || echo "Database já existe")

if echo "$DB_OUTPUT" | grep -q "database_id"; then
    DATABASE_ID=$(echo "$DB_OUTPUT" | grep "database_id" | grep -o '"[^"]*"' | sed -n 2p | tr -d '"')
    echo "✅ Database criado: $DATABASE_ID"
    echo ""
    echo "⚠️  IMPORTANTE: Atualize o wrangler.jsonc com este database_id:"
    echo "   $DATABASE_ID"
    echo ""
    read -p "Pressione ENTER após atualizar o arquivo wrangler.jsonc..."
else
    echo "⚠️  Database já existe ou erro ao criar. Continuando..."
fi

# Aplicar migrations
echo ""
echo "📝 Aplicando migrations..."
wrangler d1 migrations apply $DB_NAME

# Popular dados
echo ""
echo "🌱 Populando banco com dados iniciais..."
wrangler d1 execute $DB_NAME --file=./seed.sql

# Criar projeto Pages (se não existir)
echo ""
echo "📦 Criando projeto Pages..."
wrangler pages project create $PROJECT_NAME --production-branch main 2>&1 || echo "Projeto já existe"

# Build
echo ""
echo "🔨 Building projeto..."
npm run build

# Deploy
echo ""
echo "🚀 Fazendo deploy..."
wrangler pages deploy dist --project-name $PROJECT_NAME

# JWT Secret
echo ""
echo "🔐 Configurando JWT_SECRET..."
echo "cantina-control-secret-production-2024" | wrangler pages secret put JWT_SECRET --project-name $PROJECT_NAME

echo ""
echo "=========================================="
echo "✅ Deploy Concluído!"
echo "=========================================="
echo ""
echo "📍 URL do seu site:"
echo "   https://$PROJECT_NAME.pages.dev"
echo ""
echo "⚠️  AÇÃO NECESSÁRIA:"
echo "   1. Acesse: https://dash.cloudflare.com"
echo "   2. Workers & Pages → $PROJECT_NAME"
echo "   3. Settings → Functions → D1 database bindings"
echo "   4. Add binding:"
echo "      - Variable name: DB"
echo "      - D1 database: $DB_NAME"
echo "   5. Save"
echo ""
echo "🔑 Login:"
echo "   Email: admin@cantina.com"
echo "   Senha: admin123"
echo ""
echo "=========================================="

#!/bin/bash

# 🚀 Script de Deploy - Cantina Control
# Este script automatiza o processo de deploy no Cloudflare Pages

set -e

echo "=========================================="
echo "🚀 Deploy Cantina Control - Cloudflare"
echo "=========================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para mensagens
info() {
    echo -e "${GREEN}✓${NC} $1"
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

# Verificar se wrangler está instalado
if ! command -v wrangler &> /dev/null; then
    error "Wrangler CLI não encontrado!"
    echo "Instale com: npm install -g wrangler"
    exit 1
fi

info "Wrangler CLI encontrado"

# Verificar se está logado
echo ""
echo "Verificando autenticação..."
if ! wrangler whoami &> /dev/null; then
    warn "Você não está logado no Cloudflare"
    echo "Fazendo login..."
    wrangler login
else
    info "Já autenticado no Cloudflare"
fi

# Menu principal
echo ""
echo "Escolha uma opção:"
echo "1) Setup completo (primeira vez)"
echo "2) Apenas deploy (já configurado)"
echo "3) Aplicar migrations no banco"
echo "4) Configurar JWT_SECRET"
echo "5) Ver status dos deploys"
read -p "Opção: " option

case $option in
    1)
        echo ""
        echo "=========================================="
        echo "📦 SETUP COMPLETO"
        echo "=========================================="
        
        # Pedir nome do projeto
        read -p "Nome do projeto [cantina-control]: " PROJECT_NAME
        PROJECT_NAME=${PROJECT_NAME:-cantina-control}
        
        # Criar D1 database
        echo ""
        info "Criando banco D1..."
        DB_OUTPUT=$(wrangler d1 create ${PROJECT_NAME}-production)
        echo "$DB_OUTPUT"
        
        DATABASE_ID=$(echo "$DB_OUTPUT" | grep "database_id" | awk -F'"' '{print $4}')
        
        if [ -z "$DATABASE_ID" ]; then
            error "Erro ao criar database. Verifique a saída acima."
            exit 1
        fi
        
        info "Database ID: $DATABASE_ID"
        
        # Atualizar wrangler.jsonc
        echo ""
        warn "AÇÃO NECESSÁRIA:"
        echo "Atualize o arquivo wrangler.jsonc:"
        echo "database_id: \"$DATABASE_ID\""
        read -p "Pressione ENTER após atualizar o arquivo..."
        
        # Aplicar migrations
        echo ""
        info "Aplicando migrations..."
        wrangler d1 migrations apply ${PROJECT_NAME}-production
        
        # Seed data
        echo ""
        info "Populando banco com dados iniciais..."
        wrangler d1 execute ${PROJECT_NAME}-production --file=./seed.sql
        
        # Criar projeto Pages
        echo ""
        info "Criando projeto Pages..."
        wrangler pages project create $PROJECT_NAME --production-branch main
        
        # Build
        echo ""
        info "Fazendo build..."
        npm run build
        
        # Deploy
        echo ""
        info "Fazendo deploy..."
        wrangler pages deploy dist --project-name $PROJECT_NAME
        
        # JWT Secret
        echo ""
        warn "Configure o JWT_SECRET:"
        wrangler pages secret put JWT_SECRET --project-name $PROJECT_NAME
        
        echo ""
        info "Setup completo!"
        echo ""
        echo "Próximos passos:"
        echo "1. Acesse: https://$PROJECT_NAME.pages.dev"
        echo "2. Configure o D1 binding no dashboard Cloudflare"
        echo "3. Login: admin@cantina.com / admin123"
        ;;
        
    2)
        echo ""
        echo "=========================================="
        echo "🚀 DEPLOY"
        echo "=========================================="
        
        read -p "Nome do projeto [cantina-control]: " PROJECT_NAME
        PROJECT_NAME=${PROJECT_NAME:-cantina-control}
        
        # Build
        echo ""
        info "Fazendo build..."
        npm run build
        
        # Deploy
        echo ""
        info "Fazendo deploy..."
        wrangler pages deploy dist --project-name $PROJECT_NAME
        
        echo ""
        info "Deploy concluído!"
        echo "Acesse: https://$PROJECT_NAME.pages.dev"
        ;;
        
    3)
        echo ""
        echo "=========================================="
        echo "📊 MIGRATIONS"
        echo "=========================================="
        
        read -p "Nome do banco [cantina-control-production]: " DB_NAME
        DB_NAME=${DB_NAME:-cantina-control-production}
        
        echo ""
        info "Aplicando migrations..."
        wrangler d1 migrations apply $DB_NAME
        
        echo ""
        read -p "Deseja popular com dados seed? (s/n): " SEED
        if [ "$SEED" = "s" ]; then
            info "Populando banco..."
            wrangler d1 execute $DB_NAME --file=./seed.sql
        fi
        
        echo ""
        info "Migrations concluídas!"
        ;;
        
    4)
        echo ""
        echo "=========================================="
        echo "🔐 JWT SECRET"
        echo "=========================================="
        
        read -p "Nome do projeto [cantina-control]: " PROJECT_NAME
        PROJECT_NAME=${PROJECT_NAME:-cantina-control}
        
        echo ""
        info "Configurando JWT_SECRET..."
        wrangler pages secret put JWT_SECRET --project-name $PROJECT_NAME
        
        echo ""
        info "JWT_SECRET configurado!"
        ;;
        
    5)
        echo ""
        echo "=========================================="
        echo "📊 STATUS DOS DEPLOYS"
        echo "=========================================="
        
        read -p "Nome do projeto [cantina-control]: " PROJECT_NAME
        PROJECT_NAME=${PROJECT_NAME:-cantina-control}
        
        echo ""
        info "Últimos deploys:"
        wrangler pages deployment list --project-name $PROJECT_NAME
        ;;
        
    *)
        error "Opção inválida"
        exit 1
        ;;
esac

echo ""
echo "=========================================="
echo "✅ Concluído!"
echo "=========================================="

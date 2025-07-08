#!/bin/bash
# scripts/setup.sh - Initial project setup

echo "🌞 LuminaSol - Configuração Inicial do Projeto"
echo "================================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Por favor, instale Node.js 18+ primeiro."
    exit 1
fi

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js versão 18+ é necessária. Versão atual: $(node -v)"
    exit 1
fi

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL não encontrado. Você pode usar Docker para isso."
fi

echo "✅ Node.js $(node -v) encontrado"

# Setup Backend
echo ""
echo "📦 Configurando Backend..."
cd backend

# Copy environment file
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Arquivo .env criado (configure suas variáveis)"
fi

# Install dependencies
npm install
echo "✅ Dependências do backend instaladas"

# Setup Frontend
echo ""
echo "🎨 Configurando Frontend..."
cd ../frontend

# Copy environment file
if [ ! -f .env.local ]; then
    cp .env.example .env.local
    echo "✅ Arquivo .env.local criado"
fi

# Install dependencies
npm install
echo "✅ Dependências do frontend instaladas"

cd ..

echo ""
echo "🐳 Para usar Docker:"
echo "   docker-compose up -d"
echo ""
echo "📚 Para desenvolvimento manual:"
echo "   1. Configure PostgreSQL"
echo "   2. Edite os arquivos .env"
echo "   3. Execute 'npm run migrate' no backend"
echo "   4. Execute 'npm run seed' no backend"
echo "   5. Execute 'npm run dev' em ambas as pastas"
echo ""
echo "🎉 Configuração concluída!"

---

#!/bin/bash
# scripts/deploy.sh - Production deployment script

echo "🚀 LuminaSol - Deploy para Produção"
echo "=================================="

# Exit on any error
set -e

# Variables
PROJECT_NAME="luminasol"
BACKUP_DIR="/var/backups/$PROJECT_NAME"
DATE=$(date +%Y%m%d_%H%M%S)

echo "📋 Verificando pré-requisitos..."

# Check if running as root (for production server)
if [ "$EUID" -eq 0 ]; then
    echo "⚠️  Executando como root. Certifique-se de que isso é intencional."
fi

# Check if git is available
if ! command -v git &> /dev/null; then
    echo "❌ Git não encontrado"
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não encontrado"
    exit 1
fi

echo "✅ Pré-requisitos verificados"

# Create backup directory
mkdir -p $BACKUP_DIR

echo "💾 Criando backup do banco de dados..."
# Backup database
docker-compose exec -T postgres pg_dump -U postgres luminasol > "$BACKUP_DIR/database_$DATE.sql"
echo "✅ Backup criado: $BACKUP_DIR/database_$DATE.sql"

echo "📥 Atualizando código..."
# Pull latest code
git pull origin main

echo "🏗️  Construindo imagens..."
# Build new images
docker-compose build --no-cache

echo "🔄 Atualizando containers..."
# Update containers with zero downtime
docker-compose up -d --force-recreate

echo "🗄️  Executando migrações..."
# Run database migrations
docker-compose exec backend npm run migrate

echo "🧹 Limpando imagens antigas..."
# Clean up old images
docker image prune -f

echo "🔍 Verificando saúde dos serviços..."
# Check service health
sleep 10
docker-compose ps

# Test if services are responding
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Backend respondendo"
else
    echo "❌ Backend não está respondendo"
    exit 1
fi

if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend respondendo"
else
    echo "❌ Frontend não está respondendo"
    exit 1
fi

echo ""
echo "🎉 Deploy concluído com sucesso!"
echo "📊 Backend: http://localhost:3001"
echo "🌐 Frontend: http://localhost:3000"

---

#!/bin/bash
# scripts/backup.sh - Database backup script

echo "💾 LuminaSol - Backup do Banco de Dados"
echo "======================================"

# Variables
BACKUP_DIR="/var/backups/luminasol"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/luminasol_backup_$DATE.sql"
LOG_FILE="$BACKUP_DIR/backup.log"

# Create backup directory
mkdir -p $BACKUP_DIR

echo "$(date): Iniciando backup..." >> $LOG_FILE

# Create database backup
if docker-compose exec -T postgres pg_dump -U postgres luminasol > $BACKUP_FILE; then
    echo "$(date): Backup criado com sucesso: $BACKUP_FILE" >> $LOG_FILE
    echo "✅ Backup criado: $BACKUP_FILE"
    
    # Compress the backup
    gzip $BACKUP_FILE
    echo "✅ Backup comprimido: $BACKUP_FILE.gz"
    
    # Keep only last 30 days of backups
    find $BACKUP_DIR -name "*.gz" -mtime +30 -delete
    echo "🧹 Backups antigos removidos"
    
else
    echo "$(date): Erro ao criar backup" >> $LOG_FILE
    echo "❌ Erro ao criar backup"
    exit 1
fi

# Optional: Upload to cloud storage
# aws s3 cp "$BACKUP_FILE.gz" s3://your-bucket/backups/

echo "$(date): Backup concluído" >> $LOG_FILE
echo "🎉 Backup concluído!"

---

#!/bin/bash
# scripts/restore.sh - Database restore script

if [ $# -eq 0 ]; then
    echo "❌ Uso: $0 <arquivo_backup>"
    exit 1
fi

BACKUP_FILE=$1

echo "🔄 LuminaSol - Restauração do Banco de Dados"
echo "=========================================="

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Arquivo de backup não encontrado: $BACKUP_FILE"
    exit 1
fi

echo "⚠️  ATENÇÃO: Esta operação irá substituir todos os dados atuais!"
read -p "Deseja continuar? (s/N): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "❌ Operação cancelada"
    exit 1
fi

echo "🛑 Parando aplicação..."
docker-compose down

echo "🗄️  Recriando banco de dados..."
docker-compose up -d postgres
sleep 10

# Drop and recreate database
docker-compose exec postgres psql -U postgres -c "DROP DATABASE IF EXISTS luminasol;"
docker-compose exec postgres psql -U postgres -c "CREATE DATABASE luminasol;"

echo "📥 Restaurando dados..."
if [[ $BACKUP_FILE == *.gz ]]; then
    gunzip -c $BACKUP_FILE | docker-compose exec -T postgres psql -U postgres luminasol
else
    docker-compose exec -T postgres psql -U postgres luminasol < $BACKUP_FILE
fi

echo "🚀 Reiniciando aplicação..."
docker-compose up -d

echo "🎉 Restauração concluída!"

---

# Makefile
.PHONY: help setup dev build deploy backup restore clean test lint format

# Default target
help:
	@echo "🌞 LuminaSol - Comandos Disponíveis"
	@echo "================================="
	@echo "setup     - Configuração inicial do projeto"
	@echo "dev       - Iniciar ambiente de desenvolvimento"
	@echo "build     - Construir imagens Docker"
	@echo "deploy    - Deploy para produção"
	@echo "backup    - Backup do banco de dados"
	@echo "restore   - Restaurar banco de dados"
	@echo "test      - Executar testes"
	@echo "lint      - Verificar código"
	@echo "format    - Formatar código"
	@echo "clean     - Limpar containers e imagens"

setup:
	@chmod +x scripts/setup.sh
	@./scripts/setup.sh

dev:
	@echo "🚀 Iniciando ambiente de desenvolvimento..."
	@docker-compose -f docker-compose.dev.yml up -d

build:
	@echo "🏗️  Construindo imagens Docker..."
	@docker-compose build

deploy:
	@chmod +x scripts/deploy.sh
	@./scripts/deploy.sh

backup:
	@chmod +x scripts/backup.sh
	@./scripts/backup.sh

restore:
	@chmod +x scripts/restore.sh
	@read -p "Arquivo de backup: " backup_file; \
	./scripts/restore.sh $$backup_file

test:
	@echo "🧪 Executando testes..."
	@cd backend && npm test
	@cd frontend && npm test

lint:
	@echo "🔍 Verificando código..."
	@cd backend && npm run lint
	@cd frontend && npm run lint

format:
	@echo "🎨 Formatando código..."
	@cd backend && npm run format
	@cd frontend && npm run format

clean:
	@echo "🧹 Limpando containers e imagens..."
	@docker-compose down -v
	@docker system prune -f

---

# .env.production (exemplo)
# Production environment variables

NODE_ENV=production

# Database
DB_HOST=your-postgres-host
DB_PORT=5432
DB_NAME=luminasol_prod
DB_USER=luminasol_user
DB_PASSWORD=your-secure-password
DB_SSL=true

# API URLs
API_URL=https://api.luminasol.com.br
FRONTEND_URL=https://orcamentos.luminasol.com.br

# JWT
JWT_SECRET=your-super-secure-jwt-secret-512-bits
JWT_EXPIRATION=7d
JWT_REFRESH_EXPIRATION=30d

# Email
EMAIL_HOST=smtp.your-provider.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=noreply@luminasol.com.br
EMAIL_PASS=your-app-password
EMAIL_FROM="LuminaSol <noreply@luminasol.com.br>"

# File Storage
UPLOAD_PATH=/var/uploads
MAX_FILE_SIZE=10485760

# Monitoring
LOG_LEVEL=info
ENABLE_METRICS=true

# External APIs
WHATSAPP_API_URL=https://api.whatsapp.com
WHATSAPP_TOKEN=your-whatsapp-token

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

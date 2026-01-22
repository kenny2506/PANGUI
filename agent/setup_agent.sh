#!/bin/bash
# Pangui Monitor - Script de Instalación del Agente (Debian)
# Uso: export SERVER_URL="http://IP_CENTRAL:3000" && bash setup_agent.sh

if [ -z "$SERVER_URL" ]; then
    echo "Error: Debes definir la variable SERVER_URL."
    exit 1
fi

# 0. Instalar Git si no existe
if ! command -v git > /dev/null; then
    apt-get update && apt-get install -y git
fi

# 1. Asegurar repositorio
PROJECT_NAME="PANGUI"
if [ ! -d ".git" ]; then
    if [ -d "$PROJECT_NAME" ]; then
        cd "$PROJECT_NAME"
    else
        git clone https://github.com/kenny2506/PANGUI.git
        cd "$PROJECT_NAME"
    fi
fi

PROJECT_ROOT=$(pwd)

echo "Configurando Agente Pangui..."

# 2. Verificar/Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get update && apt-get install -y nodejs

# 3. Instalar PM2 e dependencias
npm install -g pm2
cd "$PROJECT_ROOT/agent"
npm install

# 4. Iniciar agente
cd "$PROJECT_ROOT"
pm2 delete pangui-agent 2>/dev/null || true
pm2 start agent/monitor.js --name "pangui-agent" --update-env
pm2 save

echo "Agente Pangui conectado."

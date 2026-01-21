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

# 1. Clonar el repositorio si no existe
if [ ! -d ".git" ]; then
    git clone https://github.com/kenny2506/PANGUI.git .
fi

echo "Configurando Agente Pangui..."

# 2. Verificar/Instalar Node.js
if ! command -v node > /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get update && apt-get install -y nodejs
fi

# 3. Instalar PM2 e dependencias
npm install -g pm2
cd agent
npm install

# 4. Iniciar agente
pm2 start monitor.js --name "pangui-agent" --update-env
pm2 save

echo "Agente Pangui conectado."

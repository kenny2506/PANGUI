#!/bin/bash
# Pangui Monitor - Script de Instalación del Agente (Debian)
# Uso: export SERVER_URL="http://IP_CENTRAL:3000" && bash setup_agent.sh

# --- Verificación de permisos de Root ---
if [ "$EUID" -ne 0 ]; then 
  echo "Por favor, ejecuta este script como root (sudo)."
  exit 1
fi

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
# Si ya existe la carpeta .git, asumimos que estamos dentro o necesitamos entrar
if [ -d "$PROJECT_NAME" ]; then
    cd "$PROJECT_NAME"
    # Opcional: git pull origin main (para actualizar si ya existe)
else
    # Si no estamos dentro y no existe la carpeta, clonamos
    if [ ! -d ".git" ]; then
        git clone https://github.com/kenny2506/PANGUI.git
        cd "$PROJECT_NAME"
    fi
fi

PROJECT_ROOT=$(pwd)

echo "Configurando Agente Pangui..."

# 2. Verificar/Instalar Node.js 20
# Nota: Se agregó comprobación para no reinstalar si ya existe la versión correcta
if ! command -v node > /dev/null || [[ $(node -v) != v20* ]]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get update && apt-get install -y nodejs
fi

# 3. Instalar PM2 y dependencias
if ! command -v pm2 > /dev/null; then
    npm install -g pm2
fi

cd "$PROJECT_ROOT/agent"
npm install

# 4. Iniciar agente
cd "$PROJECT_ROOT"
# Eliminamos proceso previo si existe para evitar duplicados al reinstalar
pm2 delete pangui-agent 2>/dev/null || true

# Iniciamos el proceso pasando la variable de entorno
SERVER_URL=$SERVER_URL pm2 start agent/pangui_agent.js --name "pangui-agent" --update-env

# --- SECCIÓN NUEVA: PERSISTENCIA (Startup) ---
echo "Configurando inicio automático en Debian (Systemd)..."

# Detectamos el usuario actual y su home para configurar PM2
CURRENT_USER=$(whoami)
CURRENT_HOME=$(eval echo ~$CURRENT_USER)

# 1. Generar y ejecutar el script de inicio para Systemd
# Esto evita tener que copiar y pegar manualmente el comando
pm2 startup systemd -u "$CURRENT_USER" --hp "$CURRENT_HOME"

# 2. Guardar la lista de procesos actual (Freeze)
pm2 save

echo "---------------------------------------------------"
echo "Agente Pangui instalado y configurado."
echo "El servicio se iniciará automáticamente al reiniciar el servidor."
echo "Estado actual:"
pm2 status

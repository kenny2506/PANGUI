#!/bin/bash

# =================================================================
# SCRIPT DE INSTALACIÓN AUTOMÁTICA DEL AGENTE PANGUI
# =================================================================

# Colores para la terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}====================================================${NC}"
echo -e "${BLUE}   🛸 INSTALADOR AUTOMÁTICO DE AGENTE PANGUI   ${NC}"
echo -e "${BLUE}====================================================${NC}"

# 1. Verificar si es root
if [ "$EUID" -ne 0 ]; then 
  echo -e "${RED}[ERROR] Por favor, ejecuta el script como root (sudo).${NC}"
  exit
fi

# 2. Instalar Node.js y Git si no existen
if ! command -v node &> /dev/null; then
    echo -e "${GREEN}[1/5] Instalando Node.js...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
else
    echo -e "${GREEN}[OK] Node.js ya está instalado.${NC}"
fi

if ! command -v git &> /dev/null; then
    echo -e "${GREEN}[2/5] Instalando Git...${NC}"
    apt-get install -y git
fi

# 3. Instalar PM2 globalmente
if ! command -v pm2 &> /dev/null; then
    echo -e "${GREEN}[3/5] Instalando PM2...${NC}"
    npm install pm2 -g
else
    echo -e "${GREEN}[OK] PM2 ya está instalado.${NC}"
fi

# 4. Configurar el Agente
echo -e "${GREEN}[4/5] Configurando repositorio...${NC}"
INSTALL_DIR="/var/www/aware/utilidades/pangui"
mkdir -p $INSTALL_DIR
cd $INSTALL_DIR

if [ -d ".git" ]; then
    echo -e "${BLUE}Repositorio existente. Actualizando...${NC}"
    git fetch --all
    git reset --hard origin/main
else
    git clone https://github.com/kenny2506/PANGUI.git .
fi

cd agent
echo -e "${GREEN}Instalando dependencias de Node...${NC}"
npm install --unsafe-perm

# 5. Lanzar el Agente
echo -e "${BLUE}====================================================${NC}"
read -p "Introduce la IP del Servidor de Monitoreo (Ej: 158.69.139.196): " MONITOR_IP

if [ -z "$MONITOR_IP" ]; then
    echo -e "${RED}[!] No se introdujo IP. Se usará localhost:3000 por defecto.${NC}"
    MONITOR_IP="localhost"
fi

SERVER_URL="http://${MONITOR_IP}:3000"

# Detener si ya existe una instancia
pm2 delete pangui-agent &> /dev/null

# Iniciar agente
SERVER_URL=$SERVER_URL pm2 start pangui_agent.js --name "pangui-agent"
pm2 save

echo -e "${BLUE}====================================================${NC}"
echo -e "${GREEN}🚀 ¡AGENTE INSTALADO Y CORRIENDO!${NC}"
echo -e "${GREEN}Nombre en PM2: pangui-agent${NC}"
echo -e "${GREEN}Conectado a: $SERVER_URL${NC}"
echo -e "${BLUE}====================================================${NC}"
echo -e "Puedes ver los logs con: ${BLUE}pm2 logs pangui-agent${NC}"

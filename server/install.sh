#!/bin/bash
# Pangui Monitor - Script de Instalación del Servidor Central (Debian)
# Uso: curl -sL https://raw.githubusercontent.com/kenny2506/PANGUI/main/server/install.sh | bash

echo "Iniciando Instalación de Pangui Monitor desde GitHub..."

# 0. Instalar Git si no existe
if ! command -v git > /dev/null; then
    echo "Instalando Git..."
    apt-get update && apt-get install -y git
fi

# 1. Asegurar que estamos en el directorio del proyecto
PROJECT_NAME="PANGUI"
if [ ! -d ".git" ]; then
    if [ -d "$PROJECT_NAME" ]; then
        cd "$PROJECT_NAME"
    else
        echo "Clonando repositorio Pangui..."
        git clone https://github.com/kenny2506/PANGUI.git
        cd "$PROJECT_NAME"
    fi
fi

# Guardar la ruta raíz absoluta del proyecto
PROJECT_ROOT=$(pwd)

# 2. Actualizar sistema e instalar dependencias nucleares (Node.js 20 necesario para Vite 7)
echo "Instalando Node.js 20 y Nginx..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get update
apt-get install -y nodejs build-essential nginx

# 3. Instalar PM2 globalmente
echo "Instalando PM2..."
npm install -g pm2

# 4. Preparar Backend
echo "Instalando dependencias del servidor backend..."
cd "$PROJECT_ROOT/server"
npm install

# 5. Preparar Frontend (Client)
echo "Construyendo aplicación Frontend..."
cd "$PROJECT_ROOT/client"
npm install
# Asegurar permisos de ejecución para vite
chmod +x node_modules/.bin/vite
npm run build

# 6. Configurar Nginx
echo "Configurando Nginx..."
tee /etc/nginx/sites-available/pangui <<EOF
server {
    listen 80;
    server_name _;

    location / {
        root $PROJECT_ROOT/client/dist;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

ln -sf /etc/nginx/sites-available/pangui /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

# 7. Configurar Firewall
if command -v ufw > /dev/null; then
    ufw allow 'Nginx Full'
    ufw allow 3000/tcp
fi

# 8. Iniciar Servidor con PM2
echo "Iniciando servidor con PM2..."
cd "$PROJECT_ROOT"
pm2 delete pangui-server 2>/dev/null || true
pm2 start server/index.js --name "pangui-server"
pm2 save

echo "¡Pangui Monitor instalado con éxito!"
echo "Accede a la IP de tu servidor en el navegador."

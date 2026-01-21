#!/bin/bash
# Pangui Monitor - Script de Instalación del Servidor Central (Debian)
# Uso: curl -sL https://raw.githubusercontent.com/kenny2506/PANGUI/main/server/install.sh | bash

echo "🐧 Iniciando Instalación de Pangui Monitor desde GitHub..."

# 0. Instalar Git si no existe
if ! command -v git > /dev/null; then
    echo "📦 Instalando Git..."
    sudo apt-get update && sudo apt-get install -y git
fi

# 1. Clonar el repositorio
if [ ! -d ".git" ]; then
    echo "📂 Clonando repositorio Pangui..."
    git clone https://github.com/kenny2506/PANGUI.git .
fi

# 2. Actualizar sistema e instalar dependencias nucleares
echo "📦 Instalando Node.js y Nginx..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get update
sudo apt-get install -y nodejs build-essential nginx

# 3. Instalar PM2 globalmente
echo "🚀 Instalando PM2..."
sudo npm install -g pm2

# 4. Preparar Backend
echo "🛠️ Instalando dependencias del servidor backend..."
cd server
npm install

# 5. Preparar Frontend (Client)
echo "🌐 Construyendo aplicación Frontend..."
cd ../client
npm install
npm run build
cd ../server

# 6. Configurar Nginx
echo "🔌 Configurando Nginx..."
PROJECT_ROOT=$(dirname "$(pwd)")
sudo tee /etc/nginx/sites-available/pangui <<EOF
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

sudo ln -sf /etc/nginx/sites-available/pangui /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

# 7. Configurar Firewall
sudo ufw allow 'Nginx Full'
sudo ufw allow 3000/tcp

# 8. Iniciar Servidor con PM2
pm2 start index.js --name "pangui-server"
pm2 save

echo "🎉 ¡Pangui Monitor instalado con éxito!"
echo "Accede a la IP de tu servidor en el navegador."

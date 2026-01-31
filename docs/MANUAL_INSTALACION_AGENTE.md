# 📖 Manual de Despliegue de Agentes Pangui

Este manual explica cómo instalar el agente de monitoreo en cualquier servidor Linux utilizando el script automático o el método manual.

---

## 🚀 Opción 1: Instalación de un Solo Paso (Recomendada)

Hemos creado un script que hace todo por ti (instala Node.js, Git, PM2 y configura el agente).

1. Conéctate a tu servidor remoto por SSH.
2. Ejecuta este comando:
```bash
curl -sSL https://raw.githubusercontent.com/vaxas/PANGUI/main/install_agent.sh | sudo bash
```
3. El script te pedirá la **IP del Servidor de Monitoreo**. Introdúcela y ¡listo!

---

## 🛠️ Opción 2: Instalación Manual Paso a Paso

Si prefieres hacerlo manualmente, sigue estos pasos:

### 1. Preparar el Entorno
```bash
# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs git

# Instalar PM2 globalmente
sudo npm install pm2 -g
```

### 2. Descargar el Agente
```bash
mkdir -p /var/www/aware/utilidades/pangui
cd /var/www/aware/utilidades/pangui
git clone https://github.com/vaxas/PANGUI.git .
cd agent
npm install
```

### 3. Configurar Servicios a Monitorear
Edita el archivo si quieres ocultar servicios que el servidor no necesite (ej. AwareCCM):
```bash
nano pangui_agent.js
```
Ajusta el bloque `MONITOR_SERVICES`:
```javascript
const MONITOR_SERVICES = {
    asterisk: true,
    awareccm: false, // Desactivar si no se usa
    raco: true,
    inka: true  // Detecta automáticamente whatsapp.jar
};
```

### 4. Iniciar el Agente
```bash
# Cambia 0.0.0.0 por la IP de tu monitor
sudo SERVER_URL="http://IP_DE_TU_MONITOR:3000" pm2 start pangui_agent.js --name "pangui-agent"
sudo pm2 save
```

---

## 🔍 Comandos de Verificación

* **Ver estado del agente**: `pm2 status`
* **Ver logs en tiempo real**: `pm2 logs pangui-agent`
* **Reiniciar agente**: `pm2 restart pangui-agent`
* **Detener agente**: `pm2 stop pangui-agent`

---

## ⚠️ Requisitos de Red (Firewall)
El **Servidor Central** debe permitir tráfico entrante en el puerto **3000**.
Ejecuta esto en el servidor del monitor:
```bash
sudo ufw allow 3000/tcp
```

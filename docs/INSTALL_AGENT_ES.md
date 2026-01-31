# 🛸 Guía de Instalación: Agente Pangui

Esta guía permite desplegar el agente de monitoreo en cualquier servidor remoto para que reporte datos en tiempo real al panel central.

## 1. Requisitos Previos (Solo una vez)
Asegúrate de tener instalados los componentes básicos. Si no los tienes, ejecuta:

```bash
# Actualizar repositorios e instalar NodeJS + Git
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs git

# Instalar PM2 para que el agente corra siempre de fondo
sudo npm install pm2 -g
```

## 2. Descarga y Preparación del Agente
Ejecuta estos pasos en el servidor que quieres monitorear:

```bash
# Crear directorio de trabajo
mkdir -p /var/www/aware/utilidades/pangui
cd /var/www/aware/utilidades/pangui

# Clonar solo el repositorio
git clone https://github.com/vaxas/PANGUI.git .

# Entrar a la carpeta del agente e instalar dependencias
cd agent
npm install
```

## 3. Configuración del Monitoreo Manual
Antes de arrancar, decide qué servicios quieres mostrar en el monitor para este servidor específico.

1. Abre el archivo de configuración:
   `nano pangui_agent.js`

2. Busca el bloque `MONITOR_SERVICES` y ponlo a tu gusto:
   ```javascript
   const MONITOR_SERVICES = {
       asterisk: true,  // ¿Monitorear Asterisk?
       awareccm: true,  // ¿Monitorear AwareCCM?
       raco: true,      // ¿Monitorear Raco / Racodialer?
       inka: true       // ¿Monitorear Inka (whatsapp.jar)?
   };
   ```

## 4. Despliegue del Agente
Debes indicarle al agente la IP de tu **Servidor de Monitoreo Central** (el que tiene la web).

```bash
# Sustituye la IP por la de tu servidor de monitoreo
# Ejemplo: SERVER_URL="http://158.69.139.196:3000"
sudo SERVER_URL="http://IP_DEL_MONITOR:3000" pm2 start pangui_agent.js --name "pangui-agent"

# Guardar la configuración de PM2 para que inicie tras reinicios
sudo pm2 save
```

## 5. Verificación y Logs
Para asegurarte de que el agente está hablando correctamente con el servidor central:

```bash
# Ver logs en tiempo real
sudo pm2 logs pangui-agent
```

**Deberías ver:**
* `[OK] Conectado con éxito al Servidor Central`
* `[Metrics] Enviado: NOMBRE_SERVIDOR | RAM: 15% | ...`

---

## 🛠️ Solución de Problemas (FAQ)

### 1. "No veo el servidor en el monitor"
* **Cortafuegos:** El servidor central debe tener el puerto **3000** abierto. En el monitor devuelve: `sudo ufw allow 3000/tcp`.

### 2. "Error: MODULE_NOT_FOUND"
* Asegúrate de haber ejecutado `npm install` dentro de la carpeta `agent` del servidor remoto.

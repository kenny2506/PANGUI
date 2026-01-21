# Pangui Monitor

Monitor de servicios en tiempo real optimizado para servidores Debian.

## Instalación Rápida (Servidor Central)
Para instalar todo el entorno (Node, Nginx, PM2, Backend y Frontend) en un servidor Debian limpio (como root):

```bash
mkdir -p pangui && cd pangui
curl -sL https://raw.githubusercontent.com/kenny2506/PANGUI/main/server/install.sh | bash
```

## Instalación del Agente (Nodos Remotos)
En cada servidor Debian que desees monitorear (como root):

```bash
mkdir -p pangui && cd pangui
export SERVER_URL="http://IP_DE_TU_SERVER_CENTRAL:3000"
curl -sL https://raw.githubusercontent.com/kenny2506/PANGUI/main/agent/setup_agent.sh | bash
```

## Credenciales por defecto
- **Usuario:** admin
- **Contraseña:** password123

---
*Pangui Monitor - Fleet Control v1.2*

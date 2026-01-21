# Cómo iniciar Pangui

## 1. Servidor Central
Abre una terminal en `pangui/server` y ejecuta:
```bash
$env:Path = "C:\Program Files\nodejs;" + $env:Path # Solo si no está en el PATH
npm start # O node index.js
```

## 2. Agente (En cada servidor Debian)
Abre una terminal en `pangui/agent` y ejecuta:
```bash
node monitor.js
```

## 3. Frontend
Abre una terminal en `pangui/client` y ejecuta:
```bash
npm run dev
```

## Credenciales por defecto:
- **Usuario:** `admin`
- **Contraseña:** `password123`

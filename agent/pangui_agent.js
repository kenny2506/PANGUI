const io = require('socket.io-client');
const si = require('systeminformation');
const { exec } = require('child_process');
const os = require('os');

/**
 * CONFIGURACIÓN DEL SERVIDOR CENTRAL
 */
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';
const HOSTNAME = os.hostname();
const INTERVAL = 3000;

/**
 * CONFIGURACIÓN DE MONITOREO MANUAL
 * Cambia a 'false' los servicios que NO quieras vigilar en este servidor.
 */
const MONITOR_SERVICES = {
    asterisk: true,
    awareccm: true,
    raco: true,
    inka: true
};

console.log(`🐧 Pangui Agent iniciado en ${HOSTNAME}`);
console.log(`🔗 Conectando a: ${SERVER_URL}`);

const socket = io(SERVER_URL);

socket.on('connect', () => {
    console.log(`[OK] Conectado con éxito al Servidor Central en: ${SERVER_URL}`);
    socket.emit('join-agent', { hostname: HOSTNAME });
});

socket.on('disconnect', (reason) => {
    console.warn(`[!] Desconectado del servidor. Motivo: ${reason}`);
});

socket.on('connect_error', (err) => {
    console.error(`[ERROR] No se pudo conectar a ${SERVER_URL}: ${err.message}`);
});

function checkStatus(serviceName) {
    return new Promise((resolve) => {
        let pattern = serviceName;
        if (serviceName === 'inka') pattern = 'inka|whatsapp.jar';
        if (serviceName === 'raco') pattern = 'raco|racodialer';

        const isProcessBased = ['raco', 'inka', 'awareccm'].includes(serviceName);

        if (isProcessBased) {
            exec(`ps -eo args | grep -v grep | grep -Ei "${pattern}"`, (error, stdout) => {
                const isActive = stdout.trim().length > 0;
                resolve(isActive ? 'active' : 'inactive');
            });
        } else {
            exec(`systemctl is-active ${serviceName}`, (error, stdout) => {
                resolve(stdout.trim());
            });
        }
    });
}

async function reportMetrics() {
    try {
        const [cpu, mem, disk, net, osInfo] = await Promise.all([
            si.currentLoad(),
            si.mem(),
            si.fsSize(),
            si.networkInterfaces(),
            si.osInfo()
        ]);

        let ip = '0.0.0.0';
        const publicInterface = net.find(n => !n.internal && n.ip4 && !n.ip4.startsWith('127.'));
        if (publicInterface) {
            ip = publicInterface.ip4;
        }

        const services = {};
        for (const [service, enabled] of Object.entries(MONITOR_SERVICES)) {
            if (enabled) {
                services[service] = await checkStatus(service);
            }
        }

        const usedReal = (mem.active > 0) ? mem.active : (mem.total - mem.available);
        const ramUsagePercent = ((usedReal / mem.total) * 100).toFixed(1);

        const uptimeSeconds = os.uptime();
        const days = Math.floor(uptimeSeconds / 86400);
        const hours = Math.floor((uptimeSeconds % 86400) / 3600);
        const minutes = Math.floor((uptimeSeconds % 3600) / 60);
        const uptimeStr = `${days}d ${hours}h ${minutes}m`;

        const metrics = {
            hostname: HOSTNAME,
            ip: ip,
            os: `${osInfo.distro} ${osInfo.release}` || 'Linux',
            cpu: cpu.currentLoad.toFixed(1),
            ram: {
                total: mem.total,
                usagePercent: ramUsagePercent
            },
            disk: {
                use: disk.length > 0 ? disk[0].use.toFixed(1) : '0'
            },
            services: services,
            uptime: uptimeStr,
            timestamp: Date.now()
        };

        socket.emit('metrics', metrics);
        console.log(`[Metrics] Enviado: ${HOSTNAME} | RAM: ${ramUsagePercent}% | Servicios: ${Object.keys(services).join(', ')}`);
    } catch (error) {
        console.error('Error recolectando métricas:', error);
    }
}

setInterval(reportMetrics, INTERVAL);
reportMetrics();

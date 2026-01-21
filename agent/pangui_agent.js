const io = require('socket.io-client');
const si = require('systeminformation');
const { exec } = require('child_process');
const os = require('os');

/**
 * CONFIGURACIÓN DEL SERVIDOR CENTRAL
 * Cambia 'localhost' por la IP pública o dominio de tu servidor Pangui
 */
const SERVER_URL = 'http://TU_IP_CENTRAL:3000';
const HOSTNAME = os.hostname();
const INTERVAL = 3000; // Intervalo de actualización (ms)

console.log(`🐧 Pangui Agent iniciado en ${HOSTNAME}`);
console.log(`🔗 Conectando a: ${SERVER_URL}`);

const socket = io(SERVER_URL);

socket.on('connect', () => {
    console.log('[OK] Conectado al Servidor Central');
    socket.emit('join-agent', { hostname: HOSTNAME });
});

socket.on('connect_error', (err) => {
    console.error(`[ERROR] Conexión fallida: ${err.message}`);
});

function checkStatus(serviceName) {
    return new Promise((resolve) => {
        // En Debian usamos systemctl para validar servicios
        exec(`systemctl is-active ${serviceName}`, (error, stdout) => {
            resolve(stdout.trim()); // Retorna 'active', 'inactive', 'failed', etc.
        });
    });
}

async function reportMetrics() {
    try {
        const cpu = await si.currentLoad();
        const mem = await si.mem();
        const disk = await si.fsSize();
        const net = await si.networkInterfaces();

        // Obtener IP local (la primera que no sea interna)
        const ip = net.find(n => !n.internal && n.ip4)?.ip4 || '0.0.0.0';

        const asteriskStatus = await checkStatus('asterisk');
        const nginxStatus = await checkStatus('nginx');
        const racoStatus = await checkStatus('raco');
        const inkaStatus = await checkStatus('inka');

        const metrics = {
            hostname: HOSTNAME,
            ip: ip,
            os: 'Debian 11',
            cpu: cpu.currentLoad.toFixed(1),
            ram: {
                total: mem.total,
                usagePercent: ((mem.active / mem.total) * 100).toFixed(1)
            },
            disk: {
                use: disk[0] ? disk[0].use.toFixed(1) : 0
            },
            services: {
                asterisk: asteriskStatus,
                nginx: nginxStatus,
                raco: racoStatus,
                inka: inkaStatus,
                ssh: 'active'
            },
            uptime: Math.floor(os.uptime() / 86400) + 'd ' + Math.floor((os.uptime() % 86400) / 3600) + 'h',
            timestamp: Date.now()
        };

        socket.emit('metrics', metrics);
    } catch (e) {
        console.error('Error reportando métricas:', e);
    }
}

setInterval(reportMetrics, INTERVAL);
reportMetrics();

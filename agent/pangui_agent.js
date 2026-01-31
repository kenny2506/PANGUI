const io = require('socket.io-client');
const si = require('systeminformation');
const { exec } = require('child_process');
const os = require('os');

/**
 * CONFIGURACIÓN DEL SERVIDOR CENTRAL
 * Cambia 'localhost' por la IP pública o dominio de tu servidor Pangui
 */
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';
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
        if (serviceName === 'raco' || serviceName === 'inka') {
            // Buscamos en todo el comando (incluyendo argumentos de java)
            const pattern = serviceName === 'raco' ? 'raco' : 'inka';
            exec(`ps -eo args | grep -v grep | grep -i "${pattern}"`, (error, stdout) => {
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

        // ... ip logic ...
        let ip = '0.0.0.0';
        const publicInterface = net.find(n => !n.internal && n.ip4 && !n.ip4.startsWith('127.'));
        if (publicInterface) {
            ip = publicInterface.ip4;
        }

        const asteriskStatus = await checkStatus('asterisk');
        const nginxStatus = await checkStatus('nginx');
        const racoStatus = await checkStatus('raco');
        const inkaStatus = await checkStatus('inka');

        // RAM: Usar 'active' es lo más preciso en Linux para ver el consumo real sin cache.
        // Si 'active' falla, usamos (total - available).
        const usedReal = (mem.active > 0) ? mem.active : (mem.total - mem.available);
        const ramUsagePercent = ((usedReal / mem.total) * 100).toFixed(1);

        console.log(`[DEBUG] RAM: Total=${(mem.total / 1024 / 1024).toFixed(0)}MB, Active=${(mem.active / 1024 / 1024).toFixed(0)}MB, Available=${(mem.available / 1024 / 1024).toFixed(0)}MB -> ${ramUsagePercent}%`);
        console.log(`[DEBUG] SERVICIOS: Raco:${racoStatus}, Inka:${inkaStatus}, Asterisk:${asteriskStatus}`);

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
            services: {
                asterisk: asteriskStatus,
                nginx: nginxStatus,
                raco: racoStatus,
                inka: inkaStatus
            },
            uptime: uptimeStr,
            timestamp: Date.now()
        };

        socket.emit('server-metrics', metrics);
        console.log(`[Metrics] Enviado: ${HOSTNAME} | IP: ${ip} | CPU: ${metrics.cpu}% | RAM: ${metrics.ram.usagePercent}%`);
    } catch (error) {
        console.error('Error recolectando métricas:', error);
    }
}

setInterval(reportMetrics, INTERVAL);
reportMetrics();

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
        // Para raco e inka, buscar el proceso directamente (no son servicios de systemd)
        if (serviceName === 'raco') {
            // raco es en realidad racodialer (proceso Java)
            exec(`pgrep -f racodialer`, (error, stdout) => {
                resolve(stdout.trim() ? 'active' : 'inactive');
            });
        } else if (serviceName === 'inka') {
            // Buscar proceso inka
            exec(`pgrep -f inka`, (error, stdout) => {
                resolve(stdout.trim() ? 'active' : 'inactive');
            });
        } else {
            // Para asterisk, nginx, etc., usar systemctl
            exec(`systemctl is-active ${serviceName}`, (error, stdout) => {
                resolve(stdout.trim()); // Retorna 'active', 'inactive', 'failed', etc.
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

        // Obtener IP: primero intentar la IP pública, luego la privada
        let ip = '0.0.0.0';
        const publicInterface = net.find(n => !n.internal && n.ip4 && !n.ip4.startsWith('127.'));
        if (publicInterface) {
            ip = publicInterface.ip4;
        }

        const asteriskStatus = await checkStatus('asterisk');
        const nginxStatus = await checkStatus('nginx');
        const racoStatus = await checkStatus('raco');
        const inkaStatus = await checkStatus('inka');

        // Debug: mostrar estado de servicios
        console.log(`[Services] asterisk:${asteriskStatus} nginx:${nginxStatus} raco:${racoStatus} inka:${inkaStatus}`);

        // Calcular uptime en formato legible
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
                // Usar available para calcular el uso real (excluye buff/cache)
                usagePercent: (((mem.total - mem.available) / mem.total) * 100).toFixed(1)
            },
            disk: {
                use: disk.length > 0 ? disk[0].use.toFixed(1) : '0'
            },
            services: {
                asterisk: asteriskStatus,
                nginx: nginxStatus,
                raco: racoStatus,
                inka: inkaStatus,
                ssh: 'active'
            },
            uptime: uptimeStr,
            timestamp: Date.now()
        };

        socket.emit('metrics', metrics);
        console.log(`[Metrics] Enviado: ${HOSTNAME} | IP: ${ip} | CPU: ${metrics.cpu}% | RAM: ${metrics.ram.usagePercent}%`);
    } catch (e) {
        console.error('Error reportando métricas:', e);
    }
}

setInterval(reportMetrics, INTERVAL);
reportMetrics();

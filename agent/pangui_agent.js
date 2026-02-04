const io = require('socket.io-client');
const si = require('systeminformation');
const { exec } = require('child_process');
const os = require('os');

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';
const HOSTNAME = os.hostname();
const INTERVAL = 3000;

const MONITOR_SERVICES = {
    asterisk: true,
    awareccm: true,
    raco: true,
    inka: false
};

console.log(`🐧 Pangui Agent iniciado en ${HOSTNAME}`);
const socket = io(SERVER_URL);

socket.on('connect', () => {
    console.log(`[OK] Conectado con éxito al Servidor Central`);
    socket.emit('join-agent', { hostname: HOSTNAME });
});

function checkStatus(serviceName) {
    return new Promise((resolve) => {
        let command;

        if (serviceName === 'awareccm') {
            // Filtro triple: nombre del servicio - sin postgres - sin el propio grep
            command = `ps -ef | grep "${serviceName}" | grep -v "postgres" | grep -v "grep"`;
        } else if (serviceName === 'inka') {
            command = `ps -ef | grep -Ei "inka|whatsapp.jar|core.jar" | grep -v "grep"`;
        } else if (serviceName === 'raco') {
            command = `ps -ef | grep -Ei "raco|racodialer" | grep -v "grep"`;
        } else {
            exec(`systemctl is-active ${serviceName}`, (error, stdout) => {
                resolve(stdout ? stdout.trim() : 'inactive');
            });
            return;
        }

        exec(command, (error, stdout) => {
            const isActive = stdout && stdout.trim().length > 0;
            resolve(isActive ? 'active' : 'inactive');
        });
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

        const services = {};
        for (const [service, enabled] of Object.entries(MONITOR_SERVICES)) {
            if (enabled) {
                services[service] = await checkStatus(service);
            }
        }

        const usedReal = (mem.active > 0) ? mem.active : (mem.total - mem.available);
        const ramUsagePercent = ((usedReal / mem.total) * 100).toFixed(1);

        const metrics = {
            hostname: HOSTNAME,
            cpu: cpu.currentLoad.toFixed(1),
            ram: { total: mem.total, usagePercent: ramUsagePercent },
            disk: { use: disk.length > 0 ? disk[0].use.toFixed(1) : '0' },
            services: services,
            uptime: `${Math.floor(os.uptime() / 3600)}h ${Math.floor((os.uptime() % 3600) / 60)}m`,
            timestamp: Date.now()
        };

        socket.emit('metrics', metrics);
        console.log(`[Metrics] ${new Date().toLocaleTimeString()} | RAM: ${ramUsagePercent}% | awareccm: ${services.awareccm}`);
    } catch (error) {
        console.error('Error recolectando métricas:', error);
    }
}

setInterval(reportMetrics, INTERVAL);
reportMetrics();

const io = require('socket.io-client');
const si = require('systeminformation');
const os = require('os');

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';
const socket = io(SERVER_URL);

// Configuración de la flota simulada
const SIMULATED_SERVERS = [
    { hostname: 'debian-db-prod', os: 'Debian 11 (Bullseye)', ip: '192.168.1.10' },
    { hostname: 'debian-voip-01', os: 'Debian 11 (Bullseye)', ip: '192.168.1.11' },
    { hostname: 'debian-voip-02', os: 'Debian 11 (Bullseye)', ip: '192.168.1.12' },
    { hostname: 'debian-web-frontend', os: 'Debian 11 (Bullseye)', ip: '192.168.1.15' },
    { hostname: 'debian-backup-node', os: 'Debian 10 (Buster)', ip: '192.168.1.20' }
];

console.log(`🚀 Iniciando Simulador de Flota Pangio en ${SERVER_URL}`);

socket.on('connect', () => {
    console.log('[Socket] Conectado al cluster central');
});

// Función para generar métricas aleatorias pero realistas
function generateMetrics(serverBase) {
    const isCriticalChance = Math.random() > 0.85; // 15% de probabilidad de estado crítico aleatorio

    return {
        ...serverBase,
        cpu: (Math.random() * (isCriticalChance ? 40 : 20) + (isCriticalChance ? 60 : 10)).toFixed(1),
        ram: {
            total: 16000000000,
            usagePercent: (Math.random() * 30 + (isCriticalChance ? 65 : 15)).toFixed(1)
        },
        disk: { use: (Math.random() * 20 + 40).toFixed(1) },
        services: {
            asterisk: isCriticalChance && Math.random() > 0.5 ? 'inactive' : 'active',
            raco: isCriticalChance && Math.random() > 0.7 ? 'failed' : 'active',
            inka: isCriticalChance && Math.random() > 0.7 ? 'failed' : 'active',
            ssh: 'active',
            nginx: Math.random() > 0.1 ? 'active' : 'failed'
        },
        uptime: '15d 4h 23m',
        timestamp: Date.now()
    };
}

// Enviar actualizaciones para cada servidor cada 3 segundos
setInterval(async () => {
    // La flota simulada ha sido deshabilitada para mostrar solo conexiones reales
    // SIMULATED_SERVERS.forEach(server => socket.emit('metrics', generateMetrics(server)));

    // Enviar métricas del host actual optimizado
    try {
        const [cpu, mem] = await Promise.all([si.currentLoad(), si.mem()]);
        socket.emit('metrics', {
            hostname: os.hostname(),
            os: 'Windows (Dev Mode)',
            ip: '127.0.0.1',
            cpu: cpu.currentLoad.toFixed(1),
            ram: {
                total: mem.total,
                usagePercent: ((mem.active / mem.total) * 100).toFixed(1)
            },
            disk: { use: 50 },
            services: { asterisk: 'active', raco: 'active', inka: 'active', ssh: 'active' },
            uptime: '2h 15m',
            timestamp: Date.now()
        });
    } catch (e) {
        console.error('Error in simulation gather:', e);
    }
}, 3000);

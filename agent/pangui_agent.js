const io = require('socket.io-client');
const si = require('systeminformation');
const { exec } = require('child_process');
const fs = require('fs');
const os = require('os');
const util = require('util');
const execPromise = util.promisify(exec);

const SERVER_URL = process.env.SERVER_URL || 'http://158.69.139.196:3000';
const HOSTNAME = os.hostname();
const INTERVAL = 3000;

let cachedDiskInfo = [];
let cachedCertInfo = null;
let lastHeavyCheck = 0;

const getRealIP = () => {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) return net.address;
        }
    }
    return '127.0.0.1';
};

const socket = io(SERVER_URL);
socket.on('connect', () => { socket.emit('join-agent', { hostname: HOSTNAME }); });

const getAsteriskPJSIP = async () => {
    try {
        await execPromise('pidof asterisk');
        const { stdout: agentsOut } = await execPromise("asterisk -rx 'agent show online' | grep 'Defined agents' || echo ''");
        const { stdout: channelsCount } = await execPromise("asterisk -rx 'pjsip show channels' | grep 'Objects found' | awk '{print $3}' || echo '0'");
        const am = agentsOut.match(/Defined agents:\s*(\d+).*Logged in:\s*(\d+).*Talking:\s*(\d+)/);
        
        // --- DETECCIÓN DE TRONCALES POR ESTADO AVAIL ---
        const { stdout: endpointsRaw } = await execPromise("asterisk -rx 'pjsip show endpoints' | grep -E 'Endpoint:' || echo ''");
        const { stdout: contactsRaw } = await execPromise("asterisk -rx 'pjsip show contacts' || echo ''");
        const { stdout: allChannels } = await execPromise("asterisk -rx 'pjsip show channels' || echo ''");
        
        const trunks = endpointsRaw.split('\n').filter(l => l.trim()).map(line => {
            const name = line.split(':')[1]?.trim().split(' ')[0];
            if (!/^[a-zA-Z]/.test(name)) return null; // Filtro solo letras

            const onCall = (allChannels.match(new RegExp(name, 'g')) || []).length;
            
            // Verificamos si en la lista de contactos aparece como "Avail"
            const contactLine = contactsRaw.split('\n').find(cl => cl.includes(name));
            const isOnline = contactLine && contactLine.toLowerCase().includes('avail');

            return { trunkname: name, oncall: onCall, status: isOnline ? 'Online' : 'Offline' };
        }).filter(t => t !== null);

        return {
            agents: { registrados: am ? am[1] : 0, conectados: am ? am[2] : 0, hablando: channelsCount.trim() },
            trunks
        };
    } catch (e) { return null; }
};

const getServices = async () => {
    const core = ['racodialer', 'asterisk', 'awareccm', 'inkacore'];
    const results = {};
    const { stdout: ps } = await execPromise('ps -eo comm,pid --no-headers');
    for (const s of core) {
        let pid = "0";
        if (s === 'inkacore') pid = tryRead('/opt/inka/core.pid');
        else if (s === 'racodialer') pid = tryRead('/opt/racodialer/racodialer.pid');
        else if (s === 'awareccm') pid = tryRead('/opt/awareccm/awareccm.pid');
        else {
            const m = ps.split('\n').find(l => l.includes(s));
            if (m) pid = m.trim().split(/\s+/)[1];
        }
        if (pid !== "0" && pid) {
            try {
                const { stdout: info } = await execPromise(`ps -p ${pid} -o pcpu,pmem --no-headers`);
                const [cpu, mem] = info.trim().split(/\s+/);
                results[s] = { status: 'active', cpu, mem };
            } catch { results[s] = 'inactive'; }
        } else { results[s] = 'inactive'; }
    }
    return results;
};

const tryRead = (f) => { try { return fs.readFileSync(f, 'utf8').trim(); } catch(e) { return "0"; } };

async function report() {
    try {
        const now = Date.now();
        if (now - lastHeavyCheck > 300000) {
            const disks = await si.fsSize();
            cachedDiskInfo = disks.map(d => ({ sistema: d.fs, size: (d.size/1e9).toFixed(1)+'G', usado: (d.used/1e9).toFixed(1)+'G', porc_uso: d.use.toFixed(1)+'%' }));
            const { stdout: cOut } = await execPromise('certbot certificates 2>/dev/null || echo ""');
            const n = cOut.match(/Certificate Name: (.*)/), d = cOut.match(/Expiry Date: (.*?) \(/);
            cachedCertInfo = n ? { dominio: n[1].trim(), fecha_expiracion: d[1].trim() } : null;
            lastHeavyCheck = now;
        }
        const aster = await getAsteriskPJSIP();
        const svcs = await getServices();
        const [cpu, mem] = await Promise.all([si.currentLoad(), si.mem()]);
        socket.emit('metrics', {
            hostname: HOSTNAME, ip: getRealIP(), timestamp: now,
            uptime: `${Math.floor(os.uptime()/86400)}d ${Math.floor((os.uptime()%86400)/3600)}h ${Math.floor((os.uptime()%3600)/60)}m`,
            cpu: cpu.currentLoad.toFixed(1),
            ram: { usagePercent: ((mem.active/mem.total)*100).toFixed(1) },
            hdd: cachedDiskInfo, certificado: cachedCertInfo,
            servicios: { asterisk: svcs.asterisk, awareccm: svcs.awareccm, raco: svcs.racodialer, inka: svcs.inkacore },
            asterisk: aster
        });
    } catch (e) { console.error(e); }
}
setInterval(report, INTERVAL);
report();

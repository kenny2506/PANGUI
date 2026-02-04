import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Login from './components/Login';
import ServerCard from './components/ServerCard';
import { Power, LayoutGrid, Radio, Zap, AlertCircle, Activity, Search } from 'lucide-react';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [servers, setServers] = useState({});
  const [tick, setTick] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!token) return;
    const socket = io(import.meta.env.VITE_API_URL || '');

    socket.on('connect', () => {
      console.log("Conectado al servidor de monitoreo");
      socket.emit('join-client');
    });

    socket.on('server-update', (data) => {
      setServers(prev => ({ ...prev, [data.hostname]: data }));
    });

    socket.on('server-offline', (data) => {
      setServers(prev => {
        const updated = { ...prev };
        if (updated[data.hostname]) {
          updated[data.hostname] = { ...updated[data.hostname], timestamp: 0 };
        }
        return updated;
      });
    });

    return () => socket.disconnect();
  }, [token]);

  const { serverList, totalNodes, alertNodes } = React.useMemo(() => {
    if (!token) return { serverList: [], totalNodes: 0, alertNodes: 0 };

    const list = Object.values(servers);

    const checkIsCritical = (s) => {
      const services = s.services || {};
      
      // Alerta por desconexión (> 5 seg)
      const isOffline = (Date.now() - (s.timestamp || 0)) > 5000;
      
      // Alerta por Recursos: CPU/RAM > 85% o DISCO > 80%
      const highResources = 
        s.cpu > 85 || 
        parseFloat(s.ram?.usagePercent || 0) > 85 ||
        parseFloat(s.storage?.usagePercent || s.disk?.usagePercent || 0) > 80;

      // Alerta de Servicios caídos
      const hasServiceDown = Object.values(services).some(status => status !== 'active');

      return isOffline || highResources || hasServiceDown;
    };

    const alertCount = list.filter(checkIsCritical).length;
    const filteredList = list.filter(server => 
      server.hostname.toLowerCase().includes(searchQuery.toLowerCase())
    );

    filteredList.sort((a, b) => {
      const aC = checkIsCritical(a);
      const bC = checkIsCritical(b);
      if (aC && !bC) return -1;
      if (!aC && bC) return 1;
      return a.hostname.localeCompare(b.hostname);
    });

    return { serverList: filteredList, totalNodes: list.length, alertNodes: alertCount };
  }, [servers, token, tick, searchQuery]);

  if (!token) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-slate-200">
        <Login onLogin={(t) => { localStorage.setItem('token', t); setToken(t); }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 selection:bg-blue-500/30">
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 blur-[150px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[35%] h-[35%] bg-indigo-600 blur-[150px] rounded-full animate-pulse"></div>
      </div>

      <nav className="sticky top-0 z-50 glass m-4 rounded-3xl border border-white/5 py-3 px-6 flex justify-between items-center max-w-[1600px] xl:mx-auto shadow-2xl bg-slate-900/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2 rounded-xl shadow-lg shadow-blue-600/20">
            <Radio size={22} className="text-white" />
          </div>
          <h1 className="text-xl font-black tracking-tighter text-white italic">
            PANGUI <span className="text-blue-500">MONITOR</span>
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-slate-900/60 rounded-xl border border-white/5">
            <Search size={16} className="text-slate-400" />
            <input
              type="text"
              placeholder="Buscar servidor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm text-slate-200 w-40 focus:w-60 transition-all"
            />
          </div>
          
          <button
            onClick={() => { localStorage.removeItem('token'); setToken(null); }}
            className="w-10 h-10 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all flex items-center justify-center"
          >
            <Power size={18} />
          </button>
        </div>
      </nav>

      <main className="px-6 lg:px-12 max-w-[1600px] mx-auto pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 mt-4">
          <StatCard icon={<LayoutGrid />} label="SERVERS" value={`${totalNodes} Activos`} color="blue" />
          <StatCard icon={<Zap />} label="OPTIMO" value={`${totalNodes - alertNodes} Saludables`} color="emerald" />
          <StatCard 
            icon={<AlertCircle />} 
            label="CRITICO" 
            value={`${alertNodes} Fallando`} 
            color="red" 
            isAlert={alertNodes > 0} 
          />
        </div>

        {totalNodes === 0 ? (
          <EmptyState icon={<Activity />} title="Estableciendo Conexión..." description="Esperando telemetría." />
        ) : serverList.length === 0 ? (
          <EmptyState icon={<Search />} title="Sin resultados" description={`No hay servidores con "${searchQuery}"`} />
        ) : (
          <div className="flex flex-col gap-6">
            {serverList.map((server) => (
              <ServerCard key={server.hostname} server={server} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// Componentes Auxiliares (StatCard y EmptyState) se mantienen igual...
function StatCard({ icon, label, value, color, isAlert }) {
  const colors = {
    blue: "from-blue-600/10 text-blue-400 hover:border-blue-500/30",
    emerald: "from-emerald-600/10 text-emerald-400 hover:border-emerald-500/30",
    red: "from-red-600/10 text-red-400 hover:border-red-500/30"
  };
  return (
    <div className={`glass p-4 rounded-[1.8rem] bg-gradient-to-br ${colors[color] || colors.blue} flex items-center gap-4 transition-all`}>
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-current/10">
        {React.cloneElement(icon, { size: 24 })}
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
        <span className={`text-2xl font-black ${isAlert ? 'text-red-400 animate-pulse' : 'text-white'}`}>{value}</span>
      </div>
    </div>
  );
}

function EmptyState({ icon, title, description }) {
  return (
    <div className="glass rounded-[3.5rem] py-40 flex flex-col items-center justify-center border-dashed border-2 border-slate-700/30">
      <div className="w-24 h-24 bg-blue-600/10 rounded-full flex items-center justify-center mb-6">
        {React.cloneElement(icon, { size: 48, className: "text-blue-500" })}
      </div>
      <h3 className="text-2xl font-bold mb-2">{title}</h3>
      <p className="text-slate-500 text-center px-6">{description}</p>
    </div>
  );
}

export default App;

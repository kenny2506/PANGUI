import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Login from './components/Login';
import ServerCard from './components/ServerCard';
import { Power, LayoutGrid, Radio, Zap, AlertCircle, Activity } from 'lucide-react';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [servers, setServers] = useState({});

  useEffect(() => {
    if (!token) return;
    // Conecta a la URL de la API si está definida, de lo contrario, usa el origen actual
    const socket = io(import.meta.env.VITE_API_URL || '');
    socket.on('connect', () => socket.emit('join-client'));
    socket.on('server-update', (data) => {
      setServers(prev => ({ ...prev, [data.hostname]: data }));
    });
    return () => socket.disconnect();
  }, [token]);

  const { serverList, totalNodes, alertNodes } = React.useMemo(() => {
    // Si no hay token, no procesamos nada para evitar errores
    if (!token) return { serverList: [], totalNodes: 0, alertNodes: 0 };

    const list = Object.values(servers);

    const checkIsCritical = (s) => {
      const services = s.services || {};
      return (
        s.cpu > 80 ||
        parseFloat(s.ram.usagePercent) > 80 ||
        (services.asterisk && services.asterisk !== 'active') ||
        (services.raco && services.raco !== 'active') ||
        (services.inka && services.inka !== 'active')
      );
    };

    const alertCount = list.filter(checkIsCritical).length;

    // Priorizar críticos arriba
    list.sort((a, b) => {
      const aC = checkIsCritical(a);
      const bC = checkIsCritical(b);
      if (aC && !bC) return -1;
      if (!aC && bC) return 1;
      return a.hostname.localeCompare(b.hostname);
    });

    return {
      serverList: list,
      totalNodes: list.length,
      alertNodes: alertCount
    };
  }, [servers]);

  if (!token) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-slate-200 selection:bg-blue-500/30">
        <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 blur-[150px] rounded-full animate-float"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[35%] h-[35%] bg-indigo-600 blur-[150px] rounded-full animate-float" style={{ animationDelay: '-3s' }}></div>
        </div>
        <Login onLogin={(t) => { localStorage.setItem('token', t); setToken(t); }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 selection:bg-blue-500/30">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 blur-[150px] rounded-full animate-float"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[35%] h-[35%] bg-indigo-600 blur-[150px] rounded-full animate-float" style={{ animationDelay: '-3s' }}></div>
      </div>

      <nav className="sticky top-0 z-50 glass m-4 mb-4 rounded-3xl border-white/5 py-3 px-6 flex justify-between items-center max-w-[1600px] xl:mx-auto shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2 rounded-xl shadow-xl shadow-blue-600/20 ring-1 ring-white/10">
            <Radio size={22} className="text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-black tracking-tighter leading-none text-white italic">PANGUI <span className="text-blue-500">MONITOR</span></h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-4 px-4 py-1.5 bg-slate-900/60 rounded-xl border border-white/5">
            <div className="flex flex-col items-center">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Status</span>
              <span className="text-emerald-400 text-[10px] font-black leading-none">STABLE</span>
            </div>
            <div className="w-[1px] h-4 bg-white/10" />
            <div className="flex flex-col items-center">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Alerts</span>
              <span className={`text-[10px] font-black leading-none ${alertNodes > 0 ? 'text-red-400' : 'text-slate-400'}`}>{alertNodes}</span>
            </div>
          </div>
          <button
            onClick={() => {
              setServers({});
              localStorage.removeItem('token');
              setToken(null);
            }}
            className="w-10 h-10 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all shadow-lg flex items-center justify-center font-bold"
            title="Desconectar"
          >
            <Power size={18} />
          </button>
        </div>
      </nav>

      <main className="px-6 lg:px-12 max-w-[1600px] mx-auto pb-10">
        {/* Global Statistics Compacted */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 mt-4">
          <div className="glass p-4 rounded-[1.8rem] bg-gradient-to-br from-blue-600/10 to-transparent flex items-center gap-4 group hover:border-blue-500/30 transition-all">
            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
              <LayoutGrid size={24} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Servers</span>
              <span className="text-2xl font-black text-white">{totalNodes} Active</span>
            </div>
          </div>

          <div className="glass p-4 rounded-[1.8rem] bg-gradient-to-br from-emerald-600/10 to-transparent flex items-center gap-4 group hover:border-emerald-500/30 transition-all">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <Zap size={24} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Optimal Status</span>
              <span className="text-2xl font-black text-white">{totalNodes - alertNodes} Healthy</span>
            </div>
          </div>

          <div className="glass p-4 rounded-[1.8rem] bg-gradient-to-br from-red-600/10 to-transparent flex items-center gap-4 group hover:border-red-500/30 transition-all shadow-red-500/5">
            <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-400 group-hover:scale-110 transition-transform">
              <AlertCircle size={24} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Critical Alarms</span>
              <span className={`text-2xl font-black ${alertNodes > 0 ? 'text-red-400' : 'text-slate-400'}`}>{alertNodes} Failing</span>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        {totalNodes === 0 ? (
          <div className="glass rounded-[3.5rem] py-40 flex flex-col items-center justify-center border-dashed border-2 border-slate-700/30 bg-white/2">
            <div className="w-24 h-24 bg-blue-600/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
              <Activity size={48} className="text-blue-500" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Estableciendo Conexión...</h3>
            <p className="text-slate-500 font-medium text-center px-6">Esperando que los nodos remotos comiencen a transmitir datos de telemetría.</p>
          </div>
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

export default App;

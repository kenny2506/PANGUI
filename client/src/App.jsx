import React, { useState, useEffect, useMemo } from 'react';
import io from 'socket.io-client';
import Login from './components/Login';
import ServerCard from './components/ServerCard';
import { Power, Radio, Search, Moon, Sun, LayoutGrid, Zap, AlertCircle } from 'lucide-react';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [servers, setServers] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => { localStorage.setItem('theme', theme); }, [theme]);

  useEffect(() => {
    if (!token) return;
    const socket = io('http://158.69.139.196:3000');
    socket.on('server-update', (data) => setServers(p => ({ ...p, [data.hostname]: data })));
    return () => socket.disconnect();
  }, [token]);

  const stats = useMemo(() => {
    const list = Object.values(servers);
    
    // Función para determinar severidad
    const getSeverity = (s) => {
      const isOff = (Date.now() - (s.timestamp || 0)) > 8000;
      const hasErr = Object.values(s.servicios || {}).some(v => (v.status || v) !== 'active');
      if (isOff) return 2; // Máxima prioridad
      if (hasErr) return 1; // Prioridad media
      return 0; // Saludable
    };

    const filtered = list
      .filter(s => s.hostname.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => {
        // ORDENAR POR ALERTA PRIMERO
        const sevA = getSeverity(a);
        const sevB = getSeverity(b);
        if (sevA !== sevB) return sevB - sevA;
        return a.hostname.localeCompare(b.hostname);
      });

    const alerts = list.filter(s => getSeverity(s) > 0).length;
    return { list: filtered, total: list.length, alerts };
  }, [servers, searchQuery]);

  if (!token) return <Login onLogin={setToken} />;
  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#0f172a] text-slate-200' : 'bg-[#f0f7ff] text-slate-800'}`}>
      {/* NAVBAR RESPONSIVE */}
      <nav className={`sticky top-0 z-50 m-2 md:m-4 rounded-3xl md:rounded-full border py-3 px-4 md:px-6 flex justify-between items-center max-w-[1600px] xl:mx-auto shadow-xl backdrop-blur-md ${isDark ? 'bg-[#1e293b]/90 border-white/5' : 'bg-white/90 border-blue-100'}`}>
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 md:p-2 rounded-lg text-white"><Radio size={18} /></div>
          <h1 className="text-sm md:text-xl font-black italic tracking-tighter shrink-0">PANGUI <span className="text-blue-500">MONITOR</span></h1>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
          <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} className={`p-2 rounded-full ${isDark ? 'bg-slate-800 text-yellow-400' : 'bg-white text-slate-600 border border-blue-100'}`}>
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          <div className={`hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full border ${isDark ? 'bg-slate-800/50 border-white/5' : 'bg-white border-blue-100'}`}>
            <Search size={16} className="text-slate-400" />
            <input type="text" placeholder="Buscar..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-transparent border-none outline-none text-sm w-32 focus:w-48 transition-all" />
          </div>

          <button onClick={() => {localStorage.removeItem('token'); setToken(null);}} className="flex items-center justify-center bg-red-500 text-white p-2 rounded-lg md:rounded-full hover:bg-red-600 transition-all shadow-lg shadow-red-500/20">
            <Power size={18} />
          </button>
        </div>
      </nav>

      <main className="px-4 md:px-12 max-w-[1600px] mx-auto flex flex-col gap-2 mt-4 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
           <StatBox label="Nodos" value={stats.total} color="blue" isDark={isDark} icon={<LayoutGrid />} />
           <StatBox label="Saludables" value={stats.total - stats.alerts} color="emerald" isDark={isDark} icon={<Zap />} />
           <StatBox label="Alertas" value={stats.alerts} color="red" isDark={isDark} icon={<AlertCircle />} isAlert={stats.alerts > 0} />
        </div>
        {stats.list.map((s) => (
          <ServerCard key={s.hostname} server={s} isExpanded={expandedId === s.hostname} onToggle={() => setExpandedId(p => p === s.hostname ? null : s.hostname)} theme={theme} />
        ))}
      </main>
    </div>
  );
}

const StatBox = ({ label, value, color, isDark, icon, isAlert }) => (
    <div className={`p-4 rounded-[2rem] border flex items-center gap-4 ${isDark ? 'bg-[#1e293b]/50 border-white/5' : 'bg-white border-blue-100 shadow-sm'}`}>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${color === 'red' ? 'bg-red-500/10 text-red-500' : color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-500'}`}>{React.cloneElement(icon, { size: 24 })}</div>
      <div>
        <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{label}</div>
        <div className={`text-2xl font-black ${isAlert ? 'animate-pulse text-red-500' : (isDark ? 'text-white' : 'text-slate-800')}`}>{value}</div>
      </div>
    </div>
);

export default App;

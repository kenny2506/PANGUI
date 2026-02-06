import React, { useEffect, useRef, useState } from 'react';
import { Cpu, HardDrive, Activity, Shield, Globe, Clock, Volume2, VolumeX, ChevronDown, Phone, ShieldCheck } from 'lucide-react';

const ServerCard = React.memo(({ server, isExpanded, onToggle, theme }) => {
  const audioRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const isDark = theme === 'dark';
  const isOffline = (Date.now() - (server.timestamp || 0)) > 8000;
  const services = server.servicios || {};
  const isCritical = isOffline || Object.values(services).some(s => (s?.status || s) !== 'active') || parseFloat(server.cpu) > 85;

  useEffect(() => {
    if (isCritical && !isMuted && !isOffline && audioRef.current) {
        audioRef.current.play().catch(() => {});
    } else if (audioRef.current) { audioRef.current.pause(); }
  }, [isCritical, isMuted, isOffline]);

  return (
    <div className={`transition-all duration-300 border mb-2 overflow-hidden ${isExpanded ? 'rounded-3xl md:rounded-[2.5rem]' : 'rounded-3xl md:rounded-full'} ${isDark ? (isExpanded ? 'bg-[#1e293b] border-blue-500/40' : 'bg-[#1e293b]/40 border-white/5') : 'bg-white border-blue-100 shadow-sm'} ${isCritical ? 'border-red-500/50 bg-red-500/5' : ''}`}>
      <audio ref={audioRef} loop src="https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3" />

      {/* CABECERA RESPONSIVE */}
      <div onClick={onToggle} className="p-3 md:p-4 px-4 md:pl-6 flex flex-col md:flex-row md:items-center cursor-pointer relative z-10 gap-3">
        
        {/* IDENTIDAD */}
        <div className="flex items-center gap-3 md:w-[22%]">
          <div className="relative shrink-0">
            <div className={`w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center ${isCritical ? 'bg-red-500/20 text-red-400' : 'bg-blue-600/20 text-blue-400'}`}>
              {isExpanded ? <ChevronDown size={20} /> : <Shield size={20} />}
            </div>
            {isCritical && (
              <button onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }} className="absolute -top-1.5 -right-1.5 p-1 bg-slate-800 rounded-full border border-white/10 shadow-xl z-50">
                {isMuted ? <VolumeX size={10} className="text-red-400" /> : <Volume2 size={10} className="text-emerald-400 animate-pulse" />}
              </button>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className={`font-black text-base md:text-xl truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>
              {server.hostname}
              <span className={`inline-block w-2 h-2 rounded-full ml-2 ${isOffline ? 'bg-red-600 animate-ping' : (isCritical ? 'bg-red-500' : 'bg-emerald-500')}`} />
            </h3>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
               <span className="flex items-center gap-1 font-mono tracking-tighter"><Globe size={10}/> {isOffline ? 'OFFLINE' : server.ip}</span>
               <span className="text-blue-400 flex items-center gap-1"><Clock size={10}/> {isOffline ? '-' : server.uptime}</span>
            </div>
          </div>
        </div>

        {/* MÉTRICAS (Stack en móvil) */}
        {!isOffline ? (
          <div className="grid grid-cols-3 md:flex md:flex-[3] gap-2 md:gap-3">
            <MetricBox icon={Cpu} label="CPU" value={`${server.cpu}%`} percent={server.cpu} color="blue" isDark={isDark} />
            <MetricBox icon={Activity} label="RAM" value={`${server.ram?.usagePercent}%`} percent={server.ram?.usagePercent} color="purple" isDark={isDark} />
            <MetricBox icon={HardDrive} label="HDD" value={server.hdd?.[0]?.porc_uso || '0%'} percent={parseFloat(server.hdd?.[0]?.porc_uso)} color="emerald" isDark={isDark} />
          </div>
        ) : (
          <div className="flex-1 text-center text-red-500/40 font-black text-[10px] uppercase tracking-widest">Sin señal de datos</div>
        )}

        {/* SERVICIOS (Ocultos en móvil compactado si es necesario) */}
        {!isExpanded && !isOffline && (
           <div className="hidden lg:grid grid-cols-2 gap-x-4 gap-y-1 pl-6 border-l border-white/10 min-w-[200px] ml-auto">
              {['asterisk', 'awareccm', 'raco', 'inka'].map(k => (
                <div key={k} className="flex items-center justify-between gap-2">
                   <span className="text-[9px] font-bold uppercase italic text-slate-400">{k}</span>
                   <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${(services[k]?.status || services[k]) === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                     {(services[k]?.status || services[k]) === 'active' ? 'OK' : 'ERR'}
                   </span>
                </div>
              ))}
           </div>
        )}
      </div>

      {/* PANEL EXPANDIDO */}
      <div className={`grid transition-all duration-300 ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden px-4 md:px-8 pb-6 pt-4 border-t border-white/5">
          {!isOffline && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={`p-4 rounded-2xl border ${isDark ? 'bg-blue-900/5 border-blue-500/10' : 'bg-white border-blue-100 shadow-sm'}`}>
                    <h4 className="text-xs font-black text-blue-500 uppercase mb-4 flex items-center gap-2"><Phone size={14}/> Troncales PJSIP</h4>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                        <StatBlock label="Agentes" value={server.asterisk?.agents?.registrados || 0} color="white" isDark={isDark} />
                        <StatBlock label="Online" value={server.asterisk?.agents?.conectados || 0} color="emerald" isDark={isDark} />
                        <StatBlock label="Llamadas" value={server.asterisk?.agents?.hablando || 0} color="blue" isDark={isDark} />
                    </div>
                    <div className="max-h-40 overflow-y-auto rounded-lg border border-white/5 font-mono text-[10px]">
                        <table className="w-full text-left">
                            <thead className={isDark ? 'bg-white/5 text-slate-500' : 'bg-slate-50'}>
                                <tr><th className="p-2 uppercase tracking-tighter">Troncal</th><th className="p-2 text-right uppercase tracking-tighter">Canales</th><th className="p-2 text-right uppercase tracking-tighter">Estado</th></tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {server.asterisk?.trunks?.map((t, i) => (
                                    <tr key={i} className="hover:bg-blue-500/5 transition-colors">
                                        <td className="p-2 font-bold text-slate-400">{t.trunkname}</td>
                                        <td className="p-2 text-right text-emerald-500 font-bold">{t.oncall}</td>
                                        <td className={`p-2 text-right font-black ${t.status === 'Online' ? 'text-emerald-500' : 'text-red-500'}`}>{t.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="space-y-4">
                   {server.certificado && (
                      <div className={`p-4 rounded-2xl border flex justify-between items-center ${isDark ? 'bg-indigo-900/10 border-indigo-500/10' : 'bg-white border-indigo-100 shadow-sm'}`}>
                         <div className="flex items-center gap-3 text-indigo-400"><ShieldCheck size={20}/>
                            <div><div className="text-[9px] font-bold opacity-50 uppercase tracking-tighter">Certificado SSL</div><div className="text-xs font-mono text-white font-bold">{server.certificado.dominio}</div></div>
                         </div>
                         <span className="text-[9px] font-black text-slate-500 font-mono">{server.certificado.fecha_expiracion}</span>
                      </div>
                   )}
                   <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900/40 border-white/5' : 'bg-white border-blue-100 shadow-sm'}`}>
                      <h4 className="text-[10px] font-black text-slate-500 uppercase mb-3 flex items-center gap-2"><HardDrive size={14}/> Almacenamiento</h4>
                      {server.hdd?.map((d, i) => (
                        <div key={i} className="mb-3 last:mb-0">
                            <div className="flex justify-between text-[9px] font-bold text-slate-400 mb-1 font-mono"><span>{d.sistema}</span><span>{d.size} ({d.porc_uso})</span></div>
                            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden shadow-inner"><div className="h-full bg-blue-600 rounded-full" style={{width: d.porc_uso}}></div></div>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
          )}
        </div>
      </div>
    </div>
  );
});

const MetricBox = ({ icon: Icon, label, value, percent, color, isDark }) => {
    const bg = { blue: 'bg-blue-500', purple: 'bg-purple-500', emerald: 'bg-emerald-500' };
    return (
        <div className={`p-1.5 md:p-2 md:px-4 rounded-xl md:rounded-2xl border flex-1 ${isDark ? 'bg-black/20 border-white/[0.03]' : 'bg-white border-blue-100'}`}>
            <div className="flex justify-between items-center mb-0.5 md:mb-1 px-0.5 md:px-1">
              <span className="text-[8px] md:text-[9px] font-bold text-slate-400 flex items-center gap-1 md:gap-1.5 uppercase tracking-widest"><Icon size={10}/> {label}</span>
              <span className={`text-[9px] md:text-[10px] font-black ${isDark ? 'text-white' : 'text-slate-700'}`}>{value}</span>
            </div>
            <div className={`w-full h-1 md:h-1.5 rounded-full overflow-hidden shadow-inner ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}><div className={`h-full rounded-full transition-all duration-700 ${bg[color]}`} style={{ width: `${percent}%` }} /></div>
        </div>
    );
};

const StatBlock = ({ label, value, color, isDark }) => (
    <div className={`p-2 rounded-xl border text-center ${isDark ? 'bg-slate-900/60 border-white/5' : 'bg-slate-50 border-blue-100 shadow-sm'}`}>
        <div className={`text-base md:text-xl font-black ${color === 'emerald' ? 'text-emerald-500' : color === 'blue' ? 'text-blue-500' : isDark ? 'text-white' : 'text-slate-800'}`}>{value}</div>
        <div className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">{label}</div>
    </div>
);

export default ServerCard;

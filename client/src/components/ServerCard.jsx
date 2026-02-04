import React, { useEffect, useRef, useState } from 'react';
import { Cpu, HardDrive, Activity, Shield, Globe, Clock, Volume2, VolumeX } from 'lucide-react';

const ServerCard = React.memo(({ server }) => {
  const audioRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [, setTick] = useState(0);
  
  const ALERT_THRESHOLD = 85;
  const OFFLINE_THRESHOLD = 5000; 

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Lógica de estados
  const isOffline = (Date.now() - (server.timestamp || 0)) > OFFLINE_THRESHOLD;
  const hasServiceFail = Object.values(server.services || {}).some(status => status !== 'active');
  const hasHighLoad = server.cpu > ALERT_THRESHOLD || parseFloat(server.ram?.usagePercent || 0) > ALERT_THRESHOLD;
  
  const isCritical = hasServiceFail || hasHighLoad || isOffline;

  useEffect(() => {
    if (isCritical && !isMuted && audioRef.current) {
      audioRef.current.play().catch(() => {
        console.warn("Interacción requerida para activar audio");
      });
    } else if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [isCritical, isMuted]);

  const MetricItem = ({ icon: Icon, label, value, percent, colorClass, bgClass }) => (
    <div className="bg-black/20 p-2.5 rounded-xl border border-white/[0.03] flex flex-col gap-1.5 group/item">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1.5 text-slate-400 text-[9px] font-bold uppercase tracking-wider">
          <Icon size={12} className={`${colorClass} group-hover/item:scale-110 transition-transform`} />
          {label}
        </div>
        <span className={`text-xs font-black tabular-nums ${percent > ALERT_THRESHOLD ? 'text-red-400 animate-pulse' : 'text-white/90'}`}>
          {value}
        </span>
      </div>
      <div className="w-full bg-slate-900/80 rounded-full h-1.5 p-[1px] border border-white/5 shadow-inner">
        <div
          className={`h-full transition-all duration-1000 cubic-bezier(0.34, 1.56, 0.64, 1) rounded-full relative overflow-hidden ${bgClass}`}
          style={{ width: `${Math.max(2, percent)}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />
        </div>
      </div>
    </div>
  );

  return (
    <div className={`glass p-1 rounded-[2rem] transition-all duration-500 ${isCritical ? 'critical-glow border-red-500/50 shadow-lg shadow-red-500/10' : 'hover:border-blue-500/40 border-white/5'}`}>
      <audio ref={audioRef} loop src="https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3" />

      <div className={`bg-[#1e293b]/60 backdrop-blur-md rounded-[1.9rem] p-4 h-full flex flex-col lg:flex-row lg:items-center lg:gap-6 ${isOffline ? 'opacity-80' : ''}`}>

        {/* ID Section: Left */}
        <div className="lg:w-[22%] flex items-center gap-3 mb-4 lg:mb-0">
          <div className={`relative w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${isCritical ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
            <Shield size={24} />
            {isCritical && (
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className="absolute -top-2 -right-2 bg-slate-800 p-1 rounded-full border border-white/10 hover:bg-slate-700 transition-colors"
              >
                {isMuted ? <VolumeX size={12} className="text-red-400" /> : <Volume2 size={12} className="text-emerald-400 animate-bounce" />}
              </button>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-bold text-lg text-white truncate leading-none">{server.hostname}</h3>
              <div className={`w-2 h-2 rounded-full ${isOffline ? 'bg-red-600 animate-ping' : (isCritical ? 'bg-red-500' : 'bg-emerald-500')} shadow-[0_0_8px_currentcolor] shrink-0`} />
              {isOffline && <span className="text-[10px] font-black text-red-400 animate-pulse">OFFLINE</span>}
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                <Globe size={10} /> {server.ip}
              </span>
              <span className="text-[9px] text-blue-400 font-bold flex items-center gap-1 bg-blue-500/5 px-1.5 py-0.5 rounded border border-blue-500/10">
                <Clock size={10} /> {server.uptime}
              </span>
            </div>
          </div>
        </div>

        {/* Metrics Section: Center */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4 lg:mb-0">
          <MetricItem icon={Cpu} label="CPU" value={`${server.cpu}%`} percent={server.cpu} colorClass="text-blue-400" bgClass="bg-blue-500" />
          <MetricItem icon={Activity} label="RAM" value={`${server.ram.usagePercent}%`} percent={server.ram.usagePercent} colorClass="text-purple-400" bgClass="bg-purple-500" />
          <MetricItem icon={HardDrive} label="DISK" value={`${server.disk.use}%`} percent={server.disk.use} colorClass="text-emerald-400" bgClass="bg-emerald-500" />
        </div>

        {/* Services Section: Right */}
        <div className="lg:w-[28%] bg-slate-900/40 p-3 rounded-xl border border-white/5">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {Object.entries(server.services || {}).map(([name, status]) => (
              <div key={name} className="flex justify-between items-center group/svc">
                <span className="text-[10px] font-bold text-slate-300 italic capitalize flex items-center gap-1">
                  <div className={`w-1 h-1 rounded-full ${status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  {name}
                </span>
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-1 ${isOffline ? 'bg-slate-800 text-slate-500' : (status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400 animate-pulse border border-red-500/20')}`}>
                  {isOffline ? '??' : (status === 'active' ? 'OK' : 'FAIL')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

export default ServerCard;

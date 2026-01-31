import React, { useEffect, useRef } from 'react';
import { Cpu, HardDrive, Activity, AlertCircle, Zap, Shield, Globe, Clock } from 'lucide-react';

const ServerCard = React.memo(({ server }) => {
    const audioRef = useRef(null);
    const ALERT_THRESHOLD = 85;
    const OFFLINE_THRESHOLD = 5000; // 5 segundos sin señal

    // Detección de pérdida de conexión
    const isOffline = (Date.now() - (server.timestamp || 0)) > OFFLINE_THRESHOLD;

    const hasAsteriskFail = server.services.asterisk !== 'active';
    const hasRacoFail = server.services.raco && server.services.raco !== 'active';
    const hasInkaFail = server.services.inka && server.services.inka !== 'active';
    const hasHighLoad = server.cpu > ALERT_THRESHOLD || parseFloat(server.ram.usagePercent) > ALERT_THRESHOLD;

    // Es crítico si falla algo o si se pierde la conexión
    const isCritical = hasAsteriskFail || hasRacoFail || hasInkaFail || hasHighLoad || isOffline;

    useEffect(() => {
        if (isCritical && audioRef.current) {
            audioRef.current.play().catch(() => { });
        } else if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    }, [isCritical]);

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
                    className={`h-full transition-all duration-1000 cubic-bezier(0.34, 1.56, 0.64, 1) rounded-full relative overflow-hidden ${bgClass} shadow-[0_0_10px_-3px_rgba(0,0,0,0.5)]`}
                    style={{ width: `${Math.max(2, percent)}%` }}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />
                </div>
            </div>
        </div>
    );

    return (
        <div className={`glass p-1 rounded-[2rem] transition-all duration-500 hover:scale-[1.002] ${isCritical ? 'critical-glow shadow-red-500/10 shadow-lg' : 'hover:border-blue-500/40'}`}>
            <audio ref={audioRef} loop src="https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3" />

            <div className="bg-[#1e293b]/60 backdrop-blur-md rounded-[1.9rem] p-4 h-full flex flex-col lg:flex-row lg:items-center lg:gap-6">
                {/* ID Section: Left */}
                <div className="lg:w-[22%] flex items-center gap-3 mb-4 lg:mb-0">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${isCritical ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                        <Shield size={24} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="font-bold text-lg text-white truncate leading-none" title={server.hostname}>{server.hostname}</h3>
                            <div className={`w-2 h-2 rounded-full ${isOffline ? 'bg-red-500 animate-ping' : (isCritical ? 'bg-red-500 shadow-red-500/50' : 'bg-emerald-500 shadow-emerald-500/50')} shadow-lg shrink-0`} />
                            {isOffline && <span className="text-[10px] font-black text-red-400 animate-pulse">SIN SEÑAL</span>}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                <Globe size={10} /> {server.ip || '0.0.0.0'}
                            </span>
                            <span className="text-[9px] text-blue-400 font-bold flex items-center gap-1 bg-blue-500/5 px-1.5 py-0.5 rounded border border-blue-500/10">
                                <Clock size={10} /> {server.uptime || '0h 0m'}
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
                            <div key={name} className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-slate-300 italic capitalize">{name}</span>
                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${isOffline ? 'bg-slate-800 text-slate-500' : (status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400 animate-pulse')}`}>
                                    {isOffline ? 'S/S' : (status === 'active' ? 'UP' : 'DOWN')}
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

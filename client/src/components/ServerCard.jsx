import React, { useEffect, useRef } from 'react';
import { Cpu, HardDrive, Activity, AlertCircle, Zap, Shield, Globe, Clock } from 'lucide-react';

const ServerCard = React.memo(({ server }) => {
    const audioRef = useRef(null);
    const ALERT_THRESHOLD = 85;

    const hasAsteriskFail = server.services.asterisk !== 'active';
    const hasRacoFail = server.services.raco && server.services.raco !== 'active';
    const hasInkaFail = server.services.inka && server.services.inka !== 'active';
    const hasHighLoad = server.cpu > ALERT_THRESHOLD || parseFloat(server.ram.usagePercent) > ALERT_THRESHOLD;
    const isCritical = hasAsteriskFail || hasRacoFail || hasInkaFail || hasHighLoad;

    useEffect(() => {
        if (isCritical && audioRef.current) {
            audioRef.current.play().catch(() => { });
        }
    }, [isCritical]);

    const MetricItem = ({ icon: Icon, label, value, percent, colorClass, bgClass }) => (
        <div className="bg-black/20 p-4 rounded-2xl border border-white/[0.03] flex flex-col gap-3 group/item">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">
                    <Icon size={14} className={`${colorClass} group-hover/item:scale-110 transition-transform`} />
                    {label}
                </div>
                <span className={`text-sm font-black tabular-nums ${percent > ALERT_THRESHOLD ? 'text-red-400 animate-pulse' : 'text-white/90'}`}>
                    {value}
                </span>
            </div>
            <div className="w-full bg-slate-900/80 rounded-full h-2.5 p-[2px] border border-white/5 shadow-inner">
                <div
                    className={`h-full transition-all duration-1000 cubic-bezier(0.34, 1.56, 0.64, 1) rounded-full relative overflow-hidden ${bgClass} shadow-[0_0_15px_-3px_rgba(0,0,0,0.5)]`}
                    style={{ width: `${Math.max(2, percent)}%` }}
                >
                    {/* Glossy effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />
                </div>
            </div>
        </div>
    );

    return (
        <div className={`glass p-1 rounded-[2.5rem] transition-all duration-500 hover:scale-[1.01] ${isCritical ? 'critical-glow shadow-red-500/20 shadow-xl' : 'hover:border-blue-500/40'}`}>
            <audio ref={audioRef} loop src="https://assets.mixkit.co/active_storage/sfx/995/995-preview.mp3" />

            <div className="bg-[#1e293b]/60 backdrop-blur-md rounded-[2.4rem] p-6 h-full flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div className="flex gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isCritical ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                            <Shield size={24} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex justify-between items-start">
                                <h3 className="font-bold text-lg text-white truncate leading-tight pr-2" title={server.hostname}>{server.hostname}</h3>
                                <div className="flex flex-col items-end gap-1 shrink-0">
                                    <div className={`w-3 h-3 rounded-full ${isCritical ? 'bg-red-500 shadow-red-500/50' : 'bg-emerald-500 shadow-emerald-500/50'} shadow-lg mr-1`} />
                                    <span className={`text-[9px] font-black uppercase tracking-tighter ${isCritical ? 'text-red-400' : 'text-emerald-400'}`}>
                                        {isCritical ? 'Alert' : 'Online'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                                    <Globe size={10} /> {server.ip || '0.0.0.0'}
                                </span>
                                <span className="text-[10px] py-0.5 px-2 bg-slate-800 text-slate-400 rounded-md font-bold">
                                    DEBIAN 11
                                </span>
                                <span className="text-[10px] py-0.5 px-2 bg-blue-500/10 text-blue-400 rounded-md font-bold border border-blue-500/20 whitespace-nowrap">
                                    {server.uptime || '0h 0m'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 mb-6">
                    <MetricItem icon={Cpu} label="CPU Load" value={`${server.cpu}%`} percent={server.cpu} colorClass="text-blue-400" bgClass="bg-blue-500" />
                    <MetricItem icon={Activity} label="Memory" value={`${server.ram.usagePercent}%`} percent={server.ram.usagePercent} colorClass="text-purple-400" bgClass="bg-purple-500" />
                    <MetricItem icon={HardDrive} label="Storage" value={`${server.disk.use}%`} percent={server.disk.use} colorClass="text-emerald-400" bgClass="bg-emerald-500" />
                </div>

                {/* Services Status */}
                <div className="mt-auto bg-slate-900/40 p-4 rounded-2xl border border-white/5">
                    <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
                        <span>Critical Services</span>
                        <span>Status</span>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-300 italic">Asterisk PBX</span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${server.services.asterisk === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400 animate-pulse'}`}>
                                {server.services.asterisk === 'active' ? 'UP' : 'DOWN'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-300 italic">Raco</span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${(server.services.raco === 'active' || !server.services.raco) ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400 animate-pulse'}`}>
                                {server.services.raco === 'failed' ? 'DOWN' : 'UP'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-300 italic">Inka</span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${(server.services.inka === 'active' || !server.services.inka) ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400 animate-pulse'}`}>
                                {server.services.inka === 'failed' ? 'DOWN' : 'UP'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-300 italic">Core Switch</span>
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400">
                                UP
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase">
                    <div className="flex items-center gap-1.5 grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
                        <Clock size={12} /> <span className="mt-0.5">{server.uptime || '12d 5h 30m'}</span>
                    </div>
                    <span className="opacity-40 font-mono">NODE_{server.hostname.split('-').pop().toUpperCase()}</span>
                </div>
            </div>
        </div>
    );
});

export default ServerCard;

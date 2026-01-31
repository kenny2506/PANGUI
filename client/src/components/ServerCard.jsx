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
        <div className={`glass p-1 rounded-[2.5rem] transition-all duration-500 hover:scale-[1.005] ${isCritical ? 'critical-glow shadow-red-500/20 shadow-xl' : 'hover:border-blue-500/40'}`}>
            <audio ref={audioRef} loop src="https://assets.mixkit.co/active_storage/sfx/995/995-preview.mp3" />

            <div className="bg-[#1e293b]/60 backdrop-blur-md rounded-[2.4rem] p-6 h-full flex flex-col lg:flex-row lg:items-stretch lg:gap-8">
                {/* Header / Identity Section */}
                <div className="lg:w-[25%] flex flex-col justify-center gap-4 mb-6 lg:mb-0">
                    <div className="flex gap-4 items-center">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${isCritical ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                            <Shield size={28} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between mb-1">
                                <h3 className="font-bold text-xl text-white truncate leading-none pr-2" title={server.hostname}>{server.hostname}</h3>
                                <div className={`w-2.5 h-2.5 rounded-full ${isCritical ? 'bg-red-500 shadow-red-500/50' : 'bg-emerald-500 shadow-emerald-500/50'} shadow-lg shrink-0`} />
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1.5 bg-slate-800/50 px-2 py-0.5 rounded-md">
                                    <Globe size={11} /> {server.ip || '0.0.0.0'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <span className="text-[10px] py-1 px-2.5 bg-slate-800 text-slate-400 rounded-lg font-bold">
                            DEBIAN 11
                        </span>
                        <span className="text-[10px] py-1 px-2.5 bg-blue-500/10 text-blue-400 rounded-lg font-bold border border-blue-500/20 flex items-center gap-1.5 whitespace-nowrap">
                            <Clock size={11} /> {server.uptime || '0h 0m'}
                        </span>
                    </div>
                </div>

                {/* Metrics Section */}
                <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 lg:mb-0 self-center">
                    <MetricItem icon={Cpu} label="CPU" value={`${server.cpu}%`} percent={server.cpu} colorClass="text-blue-400" bgClass="bg-blue-500" />
                    <MetricItem icon={Activity} label="RAM" value={`${server.ram.usagePercent}%`} percent={server.ram.usagePercent} colorClass="text-purple-400" bgClass="bg-purple-500" />
                    <MetricItem icon={HardDrive} label="DISK" value={`${server.disk.use}%`} percent={server.disk.use} colorClass="text-emerald-400" bgClass="bg-emerald-500" />
                </div>

                {/* Services Section */}
                <div className="lg:w-[25%] w-full bg-slate-900/40 p-4 rounded-2xl border border-white/5 flex flex-col justify-center">
                    <div className="flex justify-between items-center text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">
                        <span>Services</span>
                        <span>Status</span>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-300 italic">Asterisk</span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${server.services.asterisk === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400 animate-pulse'}`}>
                                {server.services.asterisk === 'active' ? 'UP' : 'DOWN'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-300 italic">Raco</span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${server.services.raco === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400 animate-pulse'}`}>
                                {server.services.raco === 'active' ? 'UP' : 'DOWN'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-300 italic">Inka</span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${server.services.inka === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400 animate-pulse'}`}>
                                {server.services.inka === 'active' ? 'UP' : 'DOWN'}
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
            </div>
        </div>
    );
});

export default ServerCard;

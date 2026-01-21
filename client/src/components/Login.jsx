import React, { useState } from 'react';
import { Lock, User, Radio, ArrowRight, AlertCircle } from 'lucide-react';

const Login = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const resp = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await resp.json();
            if (resp.ok) onLogin(data.token);
            else setError(data.error || 'Credenciales inválidas');
        } catch (err) {
            setError('Error de conexión con el núcleo');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[100px] rounded-full animate-pulse-slow"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[100px] rounded-full animate-pulse-slow" style={{ animationDelay: '1.5s' }}></div>

            <div className="glass p-1 rounded-[2.5rem] w-full max-w-[450px] relative z-10 shadow-2xl">
                <div className="bg-[#1e293b]/80 backdrop-blur-xl p-8 lg:p-10 rounded-[2.4rem]">
                    <div className="flex flex-col items-center mb-10 text-center">
                        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-2xl mb-4 shadow-lg shadow-blue-500/20">
                            <Radio size={32} className="text-white" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Pangui Monitor</h1>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Administrador</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-slate-900/60 border border-white/5 rounded-2xl px-12 py-3.5 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder:text-slate-700 text-white font-medium"
                                    placeholder="Usuario"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Contraseña</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-900/60 border border-white/5 rounded-2xl px-12 py-3.5 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder:text-slate-700 text-white font-medium"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="text-red-400 text-xs bg-red-500/10 p-4 rounded-xl border border-red-500/20 font-bold flex items-center gap-2">
                                <AlertCircle size={16} /> {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-bold text-white shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 mt-4 group"
                        >
                            <span>{loading ? 'Conectando...' : 'Acceder al Dashboard'}</span>
                            {!loading && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
                        </button>
                    </form>

                </div>
            </div>
        </div>
    );
};

export default Login;

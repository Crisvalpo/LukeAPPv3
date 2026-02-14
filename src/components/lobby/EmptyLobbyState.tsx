'use client';

import Link from 'next/link';
import Image from 'next/image';
import AnimatedParticles from '@/components/animations/AnimatedParticles';

type EmptyLobbyStateProps = {
    userName?: string;
    isStaff?: boolean;
};

export default function EmptyLobbyState({ userName, isStaff }: EmptyLobbyStateProps) {
    return (
        <main className="relative min-h-screen w-full bg-[hsl(220,20%,10%)] overflow-hidden flex items-center justify-center p-6 text-[hsl(0,0%,98%)]">
            {/* Background */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <AnimatedParticles />
                <div className="absolute top-[20%] left-[30%] w-[500px] h-[500px] bg-[hsl(215,90%,55%)]/10 blur-[120px] rounded-full mix-blend-screen animate-pulse" />
                <div className="absolute bottom-[20%] right-[30%] w-[400px] h-[400px] bg-[hsl(200,80%,55%)]/10 blur-[100px] rounded-full mix-blend-screen" />
            </div>

            <div className="relative z-10 w-full max-w-lg md:max-w-2xl animate-in fade-in zoom-in-95 duration-700">
                <div className="backdrop-blur-2xl bg-[hsla(220,15%,16%,0.7)] border border-white/10 rounded-[2rem] shadow-2xl p-8 md:p-12 text-center relative overflow-hidden group">

                    {/* Gloss Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                    <div className="relative z-10 flex flex-col items-center gap-8">
                        {/* Logo / Icon */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-brand-primary/30 blur-xl rounded-full animate-pulse" />
                            <div className="relative w-20 h-20 md:w-24 md:h-24 bg-slate-900/50 rounded-2xl border border-white/10 flex items-center justify-center shadow-lg backdrop-blur-md">
                                <Image
                                    src="/logo.png"
                                    alt="LukeAPP Logo"
                                    width={64}
                                    height={64}
                                    className="drop-shadow-lg invert brightness-200"
                                />
                            </div>
                        </div>

                        {/* Welcome Text */}
                        <div className="space-y-3">
                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                                Hola{userName ? `, ${userName}` : ''}
                            </h2>
                            <p className="text-lg text-[hsl(220,10%,70%)] font-medium">
                                {isStaff ? 'Panel de Administración' : 'Bienvenido a LukeAPP'}
                            </p>
                        </div>

                        {/* Content Area */}
                        {isStaff ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mt-2">
                                <Link
                                    href="/staff/companies"
                                    className="group p-5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center gap-3 relative overflow-hidden"
                                >
                                    <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🏢</div>
                                    <div>
                                        <h3 className="font-bold text-white text-lg">Gestión de Empresas</h3>
                                        <p className="text-sm text-slate-400 mt-1">Administrar clientes y accesos</p>
                                    </div>
                                </Link>
                                <Link
                                    href="/staff/users"
                                    className="group p-5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center gap-3 relative overflow-hidden"
                                >
                                    <div className="w-12 h-12 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">👥</div>
                                    <div>
                                        <h3 className="font-bold text-white text-lg">Equipo Staff</h3>
                                        <p className="text-sm text-slate-400 mt-1">Administrar usuarios internos</p>
                                    </div>
                                </Link>
                            </div>
                        ) : (
                            <div className="w-full mt-2">
                                <div className="p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 flex items-start gap-4 text-left relative overflow-hidden group/msg hover:border-brand-primary/30 transition-colors">
                                    <div className="text-3xl group-hover/msg:scale-110 transition-transform duration-300">
                                        👋
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-white text-lg flex items-center gap-2 mb-1">
                                            <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
                                            ¡Nos alegra verte!
                                        </h3>
                                        <p className="text-sm text-slate-300 leading-relaxed">
                                            Actualmente no tienes proyectos asignados. Si crees que esto es un error, por favor contacta a tu administrador para que te envíe una nueva invitación.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Logout Action */}
                        <div className="w-full pt-6 border-t border-white/5">
                            <button
                                className="group flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl bg-white/5 border border-white/5 text-slate-300 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all duration-300 font-medium text-sm"
                                onClick={async () => {
                                    const { createClient } = await import('@/lib/supabase/client');
                                    const supabase = createClient();
                                    await supabase.auth.signOut();
                                    window.location.href = '/';
                                }}
                            >
                                <span>Cerrar Sesión</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70 group-hover:translate-x-1 transition-transform"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

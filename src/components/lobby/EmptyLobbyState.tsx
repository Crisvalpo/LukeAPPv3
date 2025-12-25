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
        <main className="landing-root">
            {/* Background */}
            <div className="landing-background">
                <AnimatedParticles />
                <div className="absolute top-[20%] left-[50%] transform -translate-x-1/2 w-[60%] h-[60%] bg-[var(--color-primary)] opacity-5 blur-[120px] rounded-full animate-pulse" />
            </div>

            <div className="landing-content items-center">
                <div className="auth-card" style={{ maxWidth: '600px' }}>
                    <div className="flex flex-col items-center text-center space-y-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-yellow-500/20 blur-xl rounded-full" />
                            <Image
                                src="/logo.png"
                                alt="LukeAPP Logo"
                                width={80}
                                height={80}
                                className="relative drop-shadow-2xl"
                                style={{ filter: 'invert(1) brightness(2)' }}
                            />
                        </div>

                        <div className="space-y-3">
                            <h2 className="text-3xl font-bold text-white">
                                Hola{userName ? `, ${userName}` : ''}
                            </h2>
                            {isStaff ? (
                                <p className="text-[var(--color-text-muted)] text-lg leading-relaxed text-blue-400">
                                    Panel de Administración Staff
                                </p>
                            ) : (
                                <p className="text-[var(--color-text-muted)] text-lg leading-relaxed">
                                    Aún no estás asociado a ningún proyecto en LukeAPP.
                                </p>
                            )}
                        </div>

                        {/* STAFF SECTION */}
                        {isStaff && (
                            <div className="w-full grid gap-4 grid-cols-1 md:grid-cols-2">
                                <Link
                                    href="/staff/companies"
                                    className="p-4 rounded-xl bg-blue-600/10 border border-blue-500/30 w-full text-left hover:bg-blue-600/20 transition-all group"
                                >
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl group-hover:scale-110 transition-transform">🏢</span>
                                        <div>
                                            <h3 className="text-sm font-bold text-white mb-1">Empresas</h3>
                                            <p className="text-xs text-[var(--color-text-dim)] leading-relaxed">
                                                Gestionar empresas clientes y sus accesos
                                            </p>
                                        </div>
                                    </div>
                                </Link>

                                <Link
                                    href="/staff/users"
                                    className="p-4 rounded-xl bg-purple-600/10 border border-purple-500/30 w-full text-left hover:bg-purple-600/20 transition-all group"
                                >
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl group-hover:scale-110 transition-transform">👥</span>
                                        <div>
                                            <h3 className="text-sm font-bold text-white mb-1">Usuarios Staff</h3>
                                            <p className="text-xs text-[var(--color-text-dim)] leading-relaxed">
                                                Administrar equipo interno de LukeAPP
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        )}


                        {!isStaff && (
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10 w-full text-left">
                                <div className="flex items-start gap-3">
                                    <span className="text-2xl">📋</span>
                                    <div>
                                        <h3 className="text-sm font-bold text-white mb-1">Acceso por Invitación</h3>
                                        <p className="text-xs text-[var(--color-text-dim)] leading-relaxed">
                                            Para acceder a <strong>LukeAPP</strong> y gestionar proyectos, necesitas recibir una <u>invitación oficial</u> de tu empresa o del administrador del proyecto.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="w-full pt-2 flex flex-col gap-3">
                            <button
                                className="hero-btn hero-btn-secondary"
                                onClick={() => document.cookie = 'sb-access-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;'} // Simple logout hack for now
                            >
                                Cerrar Sesión
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

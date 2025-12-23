'use client';

import Link from 'next/link';
import Image from 'next/image';
import AnimatedParticles from '@/components/animations/AnimatedParticles';

export default function RegisterPage() {
    return (
        <main className="landing-root">
            {/* Background reused */}
            <div className="landing-background">
                <AnimatedParticles />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--color-info)] opacity-10 blur-[100px] rounded-full mix-blend-screen" />
            </div>

            <div className="landing-content items-center">
                <div className="auth-card">
                    <div className="flex flex-col items-center text-center space-y-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
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
                            <span className="inline-block px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest">
                                Próximamente
                            </span>
                            <h2 className="text-3xl font-bold text-white">Bolsa de Trabajo</h2>
                            <p className="text-[var(--color-text-muted)] text-base leading-relaxed">
                                El registro público estará habilitado exclusivamente para profesionales en búsqueda de oportunidades laborales en el sector industrial.
                            </p>
                        </div>

                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 w-full text-left">
                            <div className="flex items-start gap-3">
                                <span className="text-xl">🔒</span>
                                <div>
                                    <h3 className="text-sm font-bold text-white mb-1">Acceso a la Plataforma</h3>
                                    <p className="text-xs text-[var(--color-text-dim)] leading-relaxed">
                                        Para gestionar proyectos y operaciones en <strong>LukeAPP</strong>, debes recibir una <u>invitación oficial</u> por parte de tu empresa o administrador.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="w-full pt-2 flex flex-col gap-3">
                            <Link
                                href="/login"
                                className="hero-btn hero-btn-primary"
                            >
                                Ir a Iniciar Sesión
                            </Link>

                            <Link
                                href="/"
                                className="hero-btn hero-btn-secondary"
                            >
                                Volver al Inicio
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

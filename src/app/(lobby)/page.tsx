'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AnimatedParticles from '@/components/animations/AnimatedParticles';
import IndustryCard from '@/components/lobby/IndustryCard';
import ValueCard from '@/components/lobby/ValueCard';
import EnterpriseCTA from '@/components/lobby/EnterpriseCTA';

type ViewState = 'hero' | 'login' | 'register';

export default function LandingPage() {
    const [viewState, setViewState] = useState<ViewState>('hero');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            router.push('/lobby');
        }
    };

    const switchView = (newView: ViewState) => {
        // Add fade-out class
        const container = document.querySelector('.transition-container');
        container?.classList.add('content-fade-out');

        // Wait for fade-out, then switch content and fade-in
        setTimeout(() => {
            setViewState(newView);
            setError(null);
            container?.classList.remove('content-fade-out');
            container?.classList.add('content-fade-in');

            setTimeout(() => {
                container?.classList.remove('content-fade-in');
            }, 400);
        }, 300);
    };

    return (
        <main className="landing-root">
            {/* Sacred Background - Never Changes */}
            <div className="landing-background">
                <AnimatedParticles />
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[var(--color-primary)] opacity-20 blur-[120px] rounded-full mix-blend-screen animate-pulse" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[var(--color-info)] opacity-10 blur-[120px] rounded-full mix-blend-screen" />
            </div>

            <div className="landing-content">
                {/* Dynamic Hero/Auth Container */}
                <div className={viewState === 'hero' ? 'landing-hero glass-panel' : 'auth-form-container'}>
                    <div className="transition-container">
                        {viewState === 'hero' && (
                            <>
                                <div className="hero-logo">
                                    <Image
                                        src="/logo.png"
                                        alt="LukeAPP Logo"
                                        width={80}
                                        height={80}
                                        className="drop-shadow-2xl"
                                        style={{ filter: 'invert(1) brightness(2)' }}
                                    />
                                </div>

                                <div className="space-y-4">
                                    <h1 className="hero-title">
                                        Bienvenido a <span className="text-gradient">LukeAPP</span>
                                    </h1>
                                    <p className="text-[var(--color-text-muted)] text-xl md:text-2xl">
                                        Tu plataforma de gestión moderna y segura. Comienza tu viaje hoy y descubre todas las posibilidades para tu industria.
                                    </p>
                                </div>

                                <div className="hero-actions">
                                    <button
                                        onClick={() => switchView('login')}
                                        className="hero-btn hero-btn-primary"
                                    >
                                        Acceder
                                    </button>
                                </div>
                            </>
                        )}

                        {viewState === 'login' && (
                            <>
                                <div className="flex flex-col items-center text-center space-y-4 mb-2">
                                    <Image
                                        src="/logo.png"
                                        alt="LukeAPP Logo"
                                        width={60}
                                        height={60}
                                        className="drop-shadow-lg mb-2"
                                        style={{ filter: 'invert(1) brightness(2)' }}
                                    />
                                    <div className="space-y-1">
                                        <h2 className="text-2xl font-bold text-white">Bienvenido de nuevo</h2>
                                        <p className="text-[var(--color-text-muted)] text-sm">Ingresa a tu cuenta Enterprise</p>
                                    </div>
                                </div>

                                <form onSubmit={handleLogin} className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-[var(--color-text-dim)] uppercase tracking-wider ml-1">
                                            Email Corporativo
                                        </label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="auth-input"
                                            placeholder="nombre@empresa.com"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-[var(--color-text-dim)] uppercase tracking-wider ml-1">
                                            Contraseña
                                        </label>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="auth-input"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>

                                    {error && (
                                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                                            {error}
                                        </div>
                                    )}

                                    <div className="pt-2 flex flex-col gap-3">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="hero-btn hero-btn-primary"
                                        >
                                            {loading ? 'Validando credenciales...' : 'Iniciar Sesión'}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => switchView('hero')}
                                            className="hero-btn hero-btn-secondary"
                                        >
                                            Volver
                                        </button>
                                    </div>
                                </form>

                                <div className="text-center pt-2 border-t border-white/5">
                                    <button
                                        onClick={() => switchView('register')}
                                        className="text-sm text-[var(--color-text-dim)] hover:text-white transition-colors"
                                    >
                                        ¿Necesitas una cuenta? <span className="text-[var(--color-primary)] font-medium">Información de Registro</span>
                                    </button>
                                </div>
                            </>
                        )}

                        {viewState === 'register' && (
                            <>
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
                                        <button
                                            onClick={() => switchView('login')}
                                            className="hero-btn hero-btn-primary"
                                        >
                                            Ir a Iniciar Sesión
                                        </button>

                                        <button
                                            onClick={() => switchView('hero')}
                                            className="hero-btn hero-btn-secondary"
                                        >
                                            Volver al Inicio
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Rest of landing content - only visible in hero state */}
                {viewState === 'hero' && (
                    <>
                        <div>
                            <h2 className="landing-section-title">
                                Experiencia Comprobada
                            </h2>
                            <p className="landing-section-subtitle">
                                Contamos con amplia experiencia en trabajos mineros y refinería, brindando soluciones robustas para entornos exigentes.
                            </p>
                            <div className="landing-grid-2">
                                <IndustryCard
                                    image="/images/industries/mining.jpg"
                                    title="Minería"
                                    description="Gestión integral para faenas mineras"
                                    delay={100}
                                />
                                <IndustryCard
                                    image="/images/industries/refinery.jpg"
                                    title="Refinería"
                                    description="Soluciones especializadas para plantas industriales"
                                    delay={200}
                                />
                            </div>
                        </div>

                        <EnterpriseCTA />

                        <div className="landing-grid-4">
                            <ValueCard
                                icon="🔒"
                                title="Seguro"
                                description="Tus datos están protegidos con la mejor tecnología"
                                delay={100}
                            />
                            <ValueCard
                                icon="⚡"
                                title="Rápido"
                                description="Experiencia fluida y optimizada"
                                delay={200}
                            />
                            <ValueCard
                                icon="👍"
                                title="Fácil"
                                description="Interfaz intuitiva y amigable"
                                delay={300}
                            />
                            <ValueCard
                                icon="👥"
                                title="Comunidad"
                                description="Usuarios confiando en nuestra plataforma"
                                delay={400}
                            />
                        </div>

                        <div className="landing-footer">
                            <p className="landing-footer-text">
                                🚀 Construido con <span className="text-[var(--color-primary)]">Next.js</span> y <span className="text-[var(--color-success)]">Supabase</span>
                            </p>
                        </div>
                    </>
                )}
            </div>
        </main>
    );
}

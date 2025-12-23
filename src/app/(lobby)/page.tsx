'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import AnimatedParticles from '@/components/animations/AnimatedParticles';
import IndustryCard from '@/components/lobby/IndustryCard';
import ValueCard from '@/components/lobby/ValueCard';

type ViewState = 'hero' | 'login' | 'register';

export default function LandingPage() {
    const [viewState, setViewState] = useState<ViewState>('hero');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
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
        const container = document.querySelector('.hero-content-transition');
        container?.classList.add('content-fade-out');

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
            {/* Sacred Background */}
            <div className="landing-background">
                <AnimatedParticles />
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[var(--color-primary)] opacity-20 blur-[120px] rounded-full mix-blend-screen animate-pulse" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[var(--color-info)] opacity-10 blur-[120px] rounded-full mix-blend-screen" />
            </div>

            <div className="landing-content">
                {/* Dynamic Hero Card - Content Changes, Card Stays */}
                <div className="landing-hero glass-panel" style={{ minHeight: viewState === 'hero' ? 'auto' : '520px' }}>
                    <div className="hero-content-transition">
                        {/* Logo - moves to top when auth active */}
                        <div
                            className="hero-logo"
                            style={{
                                marginBottom: viewState === 'hero' ? '2rem' : '1rem',
                                transition: 'all 0.4s ease'
                            }}
                        >
                            <Image
                                src="/logo.png"
                                alt="LukeAPP Logo"
                                width={viewState === 'hero' ? 80 : 60}
                                height={viewState === 'hero' ? 80 : 60}
                                className="drop-shadow-2xl"
                                style={{
                                    filter: 'invert(1) brightness(2)',
                                    transition: 'all 0.4s ease'
                                }}
                            />
                        </div>

                        {viewState === 'hero' && (
                            <>
                                <div className="space-y-6">
                                    <h1 className="hero-title">
                                        Bienvenido a <span className="text-gradient">LukeAPP</span>
                                    </h1>
                                    <p className="text-[var(--color-text-muted)] text-xl md:text-2xl">
                                        Tu plataforma de gestión moderna y segura. Comienza tu viaje hoy.
                                    </p>
                                </div>

                                <div className="hero-actions" style={{ display: 'flex', justifyContent: 'center' }}>
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
                                <div className="text-center space-y-3 mb-8">
                                    <h2 className="text-2xl font-bold text-white">Bienvenido de nuevo</h2>
                                    <p className="text-[var(--color-text-muted)] text-sm">Ingresa a tu cuenta Enterprise</p>
                                </div>

                                <form onSubmit={handleLogin} className="space-y-6">
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

                                <div className="text-center pt-4 border-t border-white/5 mt-4">
                                    <button
                                        onClick={() => switchView('register')}
                                        className="text-sm text-[var(--color-text-dim)] hover:text-white transition-colors"
                                    >
                                        ¿Necesitas una cuenta? <span className="text-[var(--color-primary)] font-medium">Ver Info</span>
                                    </button>
                                </div>
                            </>
                        )}

                        {viewState === 'register' && (
                            <>
                                <div className="text-center space-y-4">
                                    <span className="inline-block px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest">
                                        Próximamente
                                    </span>
                                    <h2 className="text-2xl font-bold text-white">Bolsa de Trabajo</h2>
                                    <p className="text-[var(--color-text-muted)] text-sm leading-relaxed">
                                        El registro público estará habilitado para profesionales en búsqueda de oportunidades laborales.
                                    </p>
                                </div>

                                <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-left">
                                    <div className="flex items-start gap-3">
                                        <span className="text-xl">🔒</span>
                                        <div>
                                            <h3 className="text-sm font-bold text-white mb-1">Acceso a la Plataforma</h3>
                                            <p className="text-xs text-[var(--color-text-dim)] leading-relaxed">
                                                Para gestionar proyectos, necesitas una <u>invitación oficial</u> de tu empresa.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-2 flex flex-col gap-3">
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
                                        Volver
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Rest of landing content - ALWAYS VISIBLE */}
                <div>
                    <h2 className="landing-section-title">
                        Experiencia Comprobada
                    </h2>
                    <p className="landing-section-subtitle">
                        Amplia experiencia en trabajos mineros y refinería, brindando soluciones robustas para entornos exigentes.
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

                {/* Enterprise CTA - Premium Card */}
                <div className="enterprise-conversion-card">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="text-4xl">🏢</div>
                        <div className="flex-1">
                            <h3 className="text-2xl font-bold text-white mb-1">
                                ¿Buscas implementar LukeAPP en tu empresa?
                            </h3>
                            <p className="text-[var(--color-text-muted)] text-sm">
                                Soluciones enterprise para operaciones industriales a gran escala
                            </p>
                        </div>
                        <a
                            href="mailto:contacto@lukeapp.cl"
                            className="enterprise-cta-btn"
                        >
                            Contactar Ventas
                        </a>
                    </div>
                </div>

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
            </div>
        </main>
    );
}

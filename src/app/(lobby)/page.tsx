'use client';

import { useState, useEffect } from 'react';
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
    const [isTransitioning, setIsTransitioning] = useState(false);

    // Auth state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [userCount, setUserCount] = useState<number | null>(null);
    const router = useRouter();
    const supabase = createClient();

    // Fetch user count for community card
    useEffect(() => {
        const fetchUserCount = async () => {
            const { data, error } = await supabase.rpc('get_total_profiles');

            if (!error && typeof data === 'number') {
                setUserCount(data);
            }
        };

        fetchUserCount();
    }, []);




    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            // Translate to Spanish
            const spanishErrors: Record<string, string> = {
                'Invalid login credentials': 'Credenciales inválidas',
                'Email not confirmed': 'Email no confirmado',
                'Invalid email or password': 'Email o contraseña inválidos',
                'Too many requests': 'Demasiados intentos, intenta más tarde'
            }
            setError(spanishErrors[error.message] || error.message);
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
                            <div className="w-full max-w-[80rem] mx-auto animate-in fade-in zoom-in-95 duration-300">
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '5rem', alignItems: 'center' }}>
                                    {/* Left Column: Brand & Welcome (Desktop Only via CSS) */}
                                    <div className="desktop-only" style={{ flexDirection: 'column' }}>
                                        <h2 className="text-5xl font-bold text-white mb-4 tracking-tight">Bienvenido de nuevo</h2>
                                        <p className="text-[var(--color-text-muted)] text-lg leading-relaxed max-w-md">
                                            Ingresa a tu cuenta Enterprise para acceder al panel de control industrial.
                                        </p>
                                    </div>

                                    {/* Right Column: Login Form */}
                                    <div className="bg-[#121216]/50 p-8 rounded-3xl border border-white/5 backdrop-blur-sm w-full max-w-[500px] mx-auto">
                                        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
                                            {/* Mobile-Only Header (To keep context when split view is hidden) */}
                                            <div className="text-center mb-6 mobile-only">
                                                <h2 className="text-3xl font-bold text-white mb-2">Bienvenido</h2>
                                                <p className="text-[var(--color-text-muted)] text-sm">Ingresa a tu cuenta</p>
                                            </div>

                                            {/* Email Field */}
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <label className="auth-label auth-mb-2">
                                                    Email
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

                                            {/* Password Field */}
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <label className="auth-label auth-mb-2">
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

                                            {/* Actions */}
                                            <div className="mt-2" style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
                                                <button
                                                    type="submit"
                                                    disabled={loading}
                                                    className="hero-btn hero-btn-primary w-full"
                                                >
                                                    {loading ? 'Validando...' : 'Iniciar Sesión'}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => switchView('hero')}
                                                    className="hero-btn hero-btn-secondary w-full"
                                                >
                                                    Volver
                                                </button>
                                            </div>
                                        </form>

                                        <div className="text-center mt-6 pt-6 border-t border-white/5">
                                            <button
                                                onClick={() => switchView('register')}
                                                className="auth-footer-text !mt-0"
                                            >
                                                ¿Necesitas una cuenta? <span className="text-[var(--color-primary)] font-medium">Ver Info</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {viewState === 'register' && (
                            <div className="w-full max-w-[500px] mx-auto animate-in fade-in zoom-in-95 duration-300" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div className="text-center" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div className="flex justify-center">
                                        <span className="inline-block px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest">
                                            Próximamente
                                        </span>
                                    </div>
                                    <h2 className="text-2xl font-bold text-white">Bolsa de Trabajo</h2>
                                    <p className="text-[var(--color-text-muted)] text-sm leading-relaxed px-4">
                                        El registro público estará habilitado para profesionales en búsqueda de oportunidades laborales.
                                    </p>
                                </div>

                                <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-left">
                                    <div className="flex items-start gap-4">
                                        <span className="text-xl mt-1">🔒</span>
                                        <div>
                                            <h3 className="text-sm font-bold text-white mb-1">Acceso a la Plataforma</h3>
                                            <p className="text-xs text-[var(--color-text-dim)] leading-relaxed">
                                                Para gestionar proyectos, necesitas una <span className="text-white underline decoration-white/30 underline-offset-4">invitación oficial</span> de tu empresa.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-2" style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
                                    <button
                                        onClick={() => switchView('login')}
                                        className="hero-btn hero-btn-primary w-full"
                                    >
                                        Ir a Iniciar Sesión
                                    </button>
                                    <button
                                        onClick={() => switchView('hero')}
                                        className="hero-btn hero-btn-secondary w-full"
                                    >
                                        Volver
                                    </button>
                                </div>
                            </div>
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
                    <div className="enterprise-content">
                        <div className="enterprise-icon">⚙️</div>
                        <div className="enterprise-text">
                            <h3 className="text-2xl font-bold text-white mb-2">
                                ¿Buscas implementar LukeAPP en tu empresa?
                            </h3>
                            <p className="text-[var(--color-text-muted)] text-base">
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

                <div className="value-cards-grid">
                    <ValueCard
                        icon="🔒"
                        title="Seguro"
                        description="Tus datos están protegidos con la mejor tecnología de encriptación"
                        delay={100}
                        variant="safe"
                    />
                    <ValueCard
                        icon="⚡"
                        title="Rápido"
                        description="Experiencia fluida y optimizada para máxima velocidad"
                        delay={200}
                        variant="fast"
                    />
                    <ValueCard
                        icon="👍"
                        title="Fácil"
                        description="Interfaz intuitiva diseñada para tu comodidad"
                        delay={300}
                        variant="easy"
                    />
                    <ValueCard
                        icon="👥"
                        title="Comunidad"
                        description="Usuarios Registrados"
                        value={userCount !== null ? userCount : '-'}
                        delay={400}
                        variant="community"
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

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
    const [plans, setPlans] = useState<any[]>([]);
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

    // Fetch subscription plans for pricing section
    useEffect(() => {
        const fetchPlans = async () => {
            const { data, error } = await supabase
                .from('subscription_plans')
                .select('*')
                .order('price_monthly', { ascending: true });

            if (!error && data) {
                setPlans(data);
            }
        };

        fetchPlans();
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
        <main className="relative min-h-screen w-full bg-[#0a0a0f] text-white overflow-x-hidden">
            {/* Sacred Background */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <AnimatedParticles />
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[var(--color-primary)] opacity-20 blur-[120px] rounded-full mix-blend-screen" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[var(--color-info)] opacity-10 blur-[120px] rounded-full mix-blend-screen" />
            </div>

            <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-12 md:py-20 lg:py-24 flex flex-col items-center">
                {/* Dynamic Hero Card - Content Changes, Card Stays */}
                <div className="w-full max-w-7xl flex flex-col items-center justify-center rounded-[32px] bg-slate-900/40 border border-white/5 backdrop-blur-2xl shadow-2xl overflow-hidden p-8 md:p-12 lg:p-16"
                    style={{ minHeight: viewState === 'hero' ? '420px' : '600px' }}>
                    <div className="hero-content-transition flex flex-col items-center w-full">
                        {/* Logo - only at top in hero view */}
                        {viewState === 'hero' && (
                            <div
                                className="hero-logo"
                                style={{
                                    marginBottom: '2rem',
                                    transition: 'all 0.4s ease',
                                    display: 'flex',
                                    justifyContent: 'center'
                                }}
                            >
                                <Image
                                    src="/logo.png"
                                    alt="LukeAPP Logo"
                                    width={80}
                                    height={80}
                                    className="drop-shadow-2xl"
                                    style={{
                                        filter: 'invert(1) brightness(2)',
                                        transition: 'all 0.4s ease'
                                    }}
                                />
                            </div>
                        )}

                        {viewState === 'hero' && (
                            <>
                                <div className="space-y-4 max-w-4xl mx-auto">
                                    <div className="text-center">
                                        <div className="text-slate-400 text-sm mb-2">Bienvenido a</div>
                                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white">
                                            LukeAPP
                                        </h1>
                                    </div>
                                    <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed text-center">
                                        Tu plataforma de gestión moderna y segura. Comienza tu viaje hoy.
                                    </p>
                                </div>

                                <div className="mt-10 flex justify-center w-full">
                                    <button
                                        onClick={() => switchView('login')}
                                        className="px-16 py-4 bg-brand-primary text-white font-bold rounded-2xl shadow-xl shadow-brand-primary/20 hover:shadow-brand-primary/40 hover:-translate-y-1 transition-all duration-300 text-lg"
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
                                        <div className="mb-6">
                                            <Image
                                                src="/logo.png"
                                                alt="LukeAPP Logo"
                                                width={120}
                                                height={120}
                                                style={{ filter: 'invert(1) brightness(2)' }}
                                            />
                                        </div>
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
                                                <div className="flex justify-center mb-4">
                                                    <Image
                                                        src="/logo.png"
                                                        alt="LukeAPP Logo"
                                                        width={100}
                                                        height={100}
                                                        style={{ filter: 'invert(1) brightness(2)' }}
                                                    />
                                                </div>
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

                                            {/* Forgot Password Link */}
                                            <div style={{ textAlign: 'right', marginTop: '-8px' }}>
                                                <Link
                                                    href="/forgot-password"
                                                    style={{
                                                        color: 'var(--color-primary)',
                                                        fontSize: '0.875rem',
                                                        textDecoration: 'none',
                                                        cursor: 'pointer'
                                                    }}
                                                    onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                                                    onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
                                                >
                                                    ¿Olvidaste tu contraseña?
                                                </Link>
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
                                <div className="text-center flex flex-col gap-4">
                                    <div className="flex justify-center mb-2">
                                        <Image
                                            src="/logo.png"
                                            alt="LukeAPP Logo"
                                            width={100}
                                            height={100}
                                            style={{ filter: 'invert(1) brightness(2)' }}
                                        />
                                    </div>
                                    <div className="flex justify-center">
                                        <span className="inline-block px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest">
                                            Próximamente
                                        </span>
                                    </div>
                                    <h2 className="text-3xl font-bold text-white tracking-tight">Bolsa de Trabajo</h2>
                                    <p className="text-slate-400 text-base leading-relaxed px-4">
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

                {/* Enterprise CTA - Premium Card */}
                <div className="mt-24 w-full max-w-7xl p-[1px] rounded-[32px] bg-gradient-to-r from-brand-primary/20 via-white/10 to-brand-accent/20 shadow-2xl overflow-hidden mx-auto border border-white/5">
                    <div className="bg-[#121216]/90 backdrop-blur-3xl rounded-[31px] p-10 md:p-14 lg:p-16 flex flex-col md:flex-row items-center gap-10 md:justify-between">
                        <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left flex-1">
                            <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-3xl shadow-inner border border-brand-primary/20">
                                ⚙️
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                                    ¿Buscas implementar LukeAPP en tu empresa?
                                </h3>
                                <p className="text-slate-400 text-lg md:text-xl font-light">
                                    Conoce nuestros planes y elige el que mejor se adapte a tu operación
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                const pricingSection = document.getElementById('pricing-section');
                                pricingSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }}
                            className="whitespace-nowrap px-10 py-3.5 bg-slate-900 text-white font-bold rounded-xl border border-white/10 hover:border-white/30 hover:bg-slate-800 transition-all duration-300 uppercase tracking-widest text-sm shadow-2xl"
                        >
                            Ver Planes
                        </button>
                    </div>
                </div>

                {/* Industries */}
                <div className="mt-24 w-full max-w-7xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
                        Experiencia Comprobada
                    </h2>
                    <p className="text-slate-400 text-center text-lg max-w-2xl mx-auto mb-16">
                        Amplia experiencia en trabajos mineros y refinería, brindando soluciones robustas para entornos exigentes.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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

                {/* Value Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-24 w-full max-w-7xl mx-auto">
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

                {/* Pricing Section - At the End */}
                <div id="pricing-section" className="mt-32 w-full flex flex-col items-center">
                    <h2 className="text-3xl md:text-5xl font-extrabold text-white text-center mb-6">
                        Planes y Precios
                    </h2>
                    <p className="text-slate-400 text-center text-lg max-w-2xl mx-auto mb-16">
                        Elige el plan que mejor se adapte a las necesidades de tu empresa
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch w-full max-w-7xl mx-auto">
                        {plans.map((plan) => {
                            const isPro = plan.id === 'pro';
                            const isEnterprise = plan.id === 'enterprise';

                            return (
                                <div
                                    key={plan.id}
                                    className={`relative group p-10 rounded-[40px] backdrop-blur-3xl transition-all duration-500 hover:-translate-y-2 flex flex-col items-center text-center ${isPro
                                        ? 'bg-slate-900/60 border-2 border-brand-primary/40 shadow-2xl shadow-brand-primary/10'
                                        : 'bg-slate-900/40 border border-white/5 hover:border-white/10 hover:bg-slate-900/50'
                                        }`}
                                >
                                    {isPro && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-1.5 bg-gradient-to-r from-brand-primary to-brand-accent text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg border border-white/10">
                                            Recomendado
                                        </div>
                                    )}

                                    <h3 className={`text-xl font-bold mb-2 tracking-tight ${isPro ? 'text-brand-primary' : isEnterprise ? 'text-purple-400' : 'text-slate-400'}`}>
                                        {plan.name}
                                    </h3>

                                    <p className="text-sm text-slate-500 mb-8 font-medium">
                                        {plan.id === 'starter' && 'Para pequeños contratistas'}
                                        {plan.id === 'pro' && 'Para PyMEs establecidas'}
                                        {plan.id === 'enterprise' && 'Para grandes operaciones'}
                                    </p>

                                    <div className="mb-10">
                                        <span className="text-4xl font-black text-white tracking-tight">
                                            ${Number(plan.price_monthly).toLocaleString('es-CL')}
                                        </span>
                                        <span className="text-slate-500 text-base ml-1">/mes</span>
                                    </div>

                                    <ul className="space-y-4 mb-12 text-left w-full text-sm font-medium">
                                        <li className="flex items-center gap-3 text-slate-300">
                                            <span className="text-emerald-500 bg-emerald-500/10 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">✓</span>
                                            <span>Hasta {plan.max_users === 999999 ? 'ilimitados' : plan.max_users} usuarios</span>
                                        </li>
                                        <li className="flex items-center gap-3 text-slate-300">
                                            <span className="text-emerald-500 bg-emerald-500/10 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">✓</span>
                                            <span>{plan.max_projects === 999999 ? 'Proyectos ilimitados' : `${plan.max_projects} proyecto${plan.max_projects !== 1 ? 's' : ''}`}</span>
                                        </li>
                                        {plan.max_spools && (
                                            <li className="flex items-center gap-3 text-slate-300">
                                                <span className="text-emerald-500 bg-emerald-500/10 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">✓</span>
                                                <span>{plan.max_spools === 999999 ? 'Spools ilimitados' : `Hasta ${plan.max_spools.toLocaleString('es-CL')} spools`}</span>
                                            </li>
                                        )}
                                        {plan.max_storage_gb && (
                                            <li className="flex items-center gap-3 text-slate-300">
                                                <span className="text-emerald-500 bg-emerald-500/10 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">✓</span>
                                                <span>{plan.max_storage_gb === 999999 ? 'Almacenamiento ilimitado' : `${plan.max_storage_gb} GB`}</span>
                                            </li>
                                        )}
                                        {plan.features?.map((feature: string, i: number) => (
                                            <li key={`feat-${i}`} className="flex items-center gap-3 text-slate-300">
                                                <span className="text-emerald-500 bg-emerald-500/10 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">✓</span>
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <a
                                        href={`mailto:contacto@lukeapp.cl?subject=Contratar Plan ${plan.name}`}
                                        className={`mt-auto w-full py-5 rounded-2xl font-black transition-all duration-300 text-center active:scale-95 ${isPro
                                            ? 'bg-brand-primary text-white shadow-xl shadow-brand-primary/20 hover:shadow-brand-primary/40'
                                            : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
                                            }`}
                                    >
                                        Contactar
                                    </a>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="mt-20 pt-12 border-t border-white/5 text-center w-full">
                    <p className="text-slate-500 text-sm font-medium flex items-center justify-center gap-2">
                        🚀 Construido con <span className="text-blue-400 font-bold">Next.js</span> y <span className="text-emerald-500 font-bold">Supabase</span>
                    </p>
                </div>
            </div >
        </main >
    );
}

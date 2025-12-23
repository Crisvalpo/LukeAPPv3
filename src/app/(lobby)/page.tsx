import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AnimatedParticles from '@/components/animations/AnimatedParticles';
import FeatureCard from '@/components/lobby/FeatureCard';
import IndustryCard from '@/components/lobby/IndustryCard';
import ValueCard from '@/components/lobby/ValueCard';
import EnterpriseCTA from '@/components/lobby/EnterpriseCTA';

export default async function LandingPage() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            redirect('/lobby');
        }
    } catch {
        // Ignore error
    }

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Animated Particles Background */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                <AnimatedParticles />
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[var(--color-primary)] opacity-20 blur-[120px] rounded-full mix-blend-screen animate-pulse" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[var(--color-info)] opacity-10 blur-[120px] rounded-full mix-blend-screen" />
            </div>

            {/* Hero Section */}
            <div className="glass-panel p-8 md:p-12 max-w-4xl w-full flex flex-col items-center text-center space-y-8 mb-12">
                {/* Logo Oficial LukeAPP */}
                <div className="hero-logo">
                    <Image
                        src="/logo.png"
                        alt="LukeAPP Logo"
                        width={80}
                        height={80}
                        className="mx-auto drop-shadow-2xl"
                    />
                </div>

                <div className="space-y-4">
                    <h1 className="hero-title text-5xl md:text-6xl font-bold tracking-tighter">
                        Bienvenido a <span className="text-gradient">LukeAPP</span>
                    </h1>
                    <p className="hero-subtitle text-[var(--color-text-muted)] text-xl md:text-2xl max-w-2xl">
                        Tu plataforma de gestión moderna y segura. Comienza tu viaje hoy y descubre todas las posibilidades para tu industria.
                    </p>
                </div>

                <div className="hero-actions w-full max-w-md space-y-4">
                    <Link
                        href="/register"
                        className="w-full block bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-medium py-4 px-8 rounded-lg transition-all shadow-glow hover:shadow-[0_0_30px_var(--color-primary-glow)] hover:transform hover:scale-105"
                    >
                        Crear Cuenta
                    </Link>

                    <Link
                        href="/login"
                        className="w-full block bg-[var(--glass-bg)] hover:bg-[var(--glass-bg-hover)] border border-[var(--glass-border)] text-white font-medium py-4 px-8 rounded-lg transition-all hover:transform hover:scale-105"
                    >
                        Iniciar Sesión
                    </Link>
                </div>

                <div className="pt-6 border-t border-[var(--glass-border)] w-full">
                    <p className="text-xs text-[var(--color-text-dim)] uppercase tracking-wider">
                        Multi-Tenant • Offline First • Enterprise
                    </p>
                </div>
            </div>

            {/* Feature Cards Técnicas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full px-4 mb-16">
                <FeatureCard
                    icon="🏭"
                    title="Multi-Tenant"
                    description="Múltiples empresas y proyectos en un solo sistema. Contexto seguro y aislado."
                    delay={100}
                />
                <FeatureCard
                    icon="📡"
                    title="Offline-First"
                    description="Opera sin conexión. Sincroniza cuando vuelvas online. Datos siempre disponibles."
                    delay={200}
                />
                <FeatureCard
                    icon="🔒"
                    title="Enterprise"
                    description="Seguridad nivel corporativo. Control de acceso granular. Auditoría completa."
                    delay={300}
                />
            </div>

            {/* Experiencia Comprobada */}
            <div className="max-w-6xl w-full px-4 mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 text-white">
                    Experiencia Comprobada
                </h2>
                <p className="text-center text-[var(--color-text-muted)] mb-12 max-w-3xl mx-auto">
                    Contamos con amplia experiencia en trabajos mineros y refinería, brindando soluciones robustas para entornos exigentes.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <IndustryCard
                        image="/images/industries/mining.png"
                        title="Minería"
                        description="Gestión integral para faenas mineras"
                        delay={100}
                    />
                    <IndustryCard
                        image="/images/industries/refinery.png"
                        title="Refinería"
                        description="Soluciones especializadas para plantas industriales"
                        delay={200}
                    />
                </div>
            </div>

            {/* CTA Empresarial */}
            <div className="max-w-6xl w-full px-4 mb-16">
                <EnterpriseCTA />
            </div>

            {/* Value Propositions */}
            <div className="max-w-6xl w-full px-4 mb-16">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <ValueCard
                        icon="🔒"
                        title="Seguro"
                        description="Tus datos están protegidos con la mejor tecnología de encriptación"
                        delay={100}
                    />
                    <ValueCard
                        icon="⚡"
                        title="Rápido"
                        description="Experiencia fluida y optimizada para máxima velocidad"
                        delay={200}
                    />
                    <ValueCard
                        icon="👍"
                        title="Fácil"
                        description="Interfaz intuitiva diseñada para tu comodidad"
                        delay={300}
                    />
                    <ValueCard
                        icon="👥"
                        title="Comunidad"
                        description="Usuarios registrados confiando en nuestra plataforma"
                        delay={400}
                    />
                </div>
            </div>

            {/* Footer */}
            <div className="max-w-6xl w-full px-4 py-8 border-t border-[var(--glass-border)]">
                <p className="text-center text-sm text-[var(--color-text-dim)]">
                    🚀 Construido con <span className="text-[var(--color-primary)]">Next.js</span> y <span className="text-[var(--color-success)]">Supabase</span>
                </p>
            </div>
        </main>
    );
}

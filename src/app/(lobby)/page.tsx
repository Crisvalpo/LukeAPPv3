import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AnimatedParticles from '@/components/animations/AnimatedParticles';
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
        <main className="landing-root">
            {/* Animated Particles Background */}
            <div className="landing-background">
                <AnimatedParticles />
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[var(--color-primary)] opacity-20 blur-[120px] rounded-full mix-blend-screen animate-pulse" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[var(--color-info)] opacity-10 blur-[120px] rounded-full mix-blend-screen" />
            </div>

            <div className="landing-content">
                {/* Hero Section */}
                <div className="landing-hero glass-panel">
                    {/* Logo Oficial LukeAPP */}
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
                        <Link
                            href="/register"
                            className="hero-btn hero-btn-primary"
                        >
                            Crear Cuenta
                        </Link>

                        <Link
                            href="/login"
                            className="hero-btn hero-btn-secondary"
                        >
                            Iniciar Sesión
                        </Link>
                    </div>
                </div>

                {/* Experiencia Comprobada */}
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

                {/* CTA Empresarial */}
                <EnterpriseCTA />

                {/* Value Propositions */}
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

                {/* Footer */}
                <div className="landing-footer">
                    <p className="landing-footer-text">
                        🚀 Construido con <span className="text-[var(--color-primary)]">Next.js</span> y <span className="text-[var(--color-success)]">Supabase</span>
                    </p>
                </div>
            </div>
        </main>
    );
}

import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AnimatedParticles from '@/components/animations/AnimatedParticles';
import FeatureCard from '@/components/lobby/FeatureCard';

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
                <div className="space-y-4">
                    <h1 className="hero-title text-5xl md:text-6xl font-bold tracking-tighter">
                        Luke<span className="text-gradient">APP</span>
                    </h1>
                    <p className="hero-subtitle text-[var(--color-text-muted)] text-xl md:text-2xl">
                        Industrial Operations Ecosystem
                    </p>
                </div>

                <div className="hero-actions w-full max-w-md space-y-4">
                    <Link
                        href="/login"
                        className="w-full block bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-medium py-4 px-8 rounded-lg transition-all shadow-glow hover:shadow-[0_0_30px_var(--color-primary-glow)] hover:transform hover:scale-105"
                    >
                        Iniciar Sesión
                    </Link>

                    <div className="text-sm text-[var(--color-text-muted)] pt-2">
                        <span className="block mb-2">¿No tienes cuenta?</span>
                        <Link href="/register" className="text-[var(--color-primary)] hover:underline font-medium">
                            Crear Identidad
                        </Link>
                    </div>
                </div>

                <div className="pt-6 border-t border-[var(--glass-border)] w-full">
                    <p className="text-xs text-[var(--color-text-dim)] uppercase tracking-wider">
                        Multi-Tenant • Offline First • Enterprise
                    </p>
                </div>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full px-4">
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
        </main>
    );
}

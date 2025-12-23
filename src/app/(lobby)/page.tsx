import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

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
            {/* Background Ambience */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[var(--color-primary)] opacity-20 blur-[120px] rounded-full mix-blend-screen animate-pulse" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[var(--color-info)] opacity-10 blur-[120px] rounded-full mix-blend-screen" />
            </div>

            <div className="glass-panel p-8 md:p-12 max-w-lg w-full flex flex-col items-center text-center space-y-8">
                <div className="space-y-2">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">
                        Luke<span className="text-gradient">APP</span>
                    </h1>
                    <p className="text-[var(--color-text-muted)] text-lg">
                        Industrial Operations Ecosystem
                    </p>
                </div>

                <div className="w-full space-y-4">
                    <Link
                        href="/login"
                        className="w-full block bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-medium py-3 px-6 rounded-lg transition-all shadow-glow hover:shadow-[0_0_30px_var(--color-primary-glow)]"
                    >
                        Iniciar Sesión
                    </Link>

                    <div className="text-sm text-[var(--color-text-muted)] pt-4">
                        <span className="block mb-2">¿No tienes cuenta?</span>
                        <Link href="/register" className="text-[var(--color-primary)] hover:underline">
                            Crear Identidad
                        </Link>
                    </div>
                </div>

                <div className="pt-8 border-t border-[var(--glass-border)] w-full">
                    <p className="text-xs text-[var(--color-text-dim)] uppercase tracking-wider">
                        Multi-Tenant • Offline First • Enterprise
                    </p>
                </div>
            </div>
        </main>
    );
}

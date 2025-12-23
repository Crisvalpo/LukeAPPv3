'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import AnimatedParticles from '@/components/animations/AnimatedParticles';

export default function LoginPage() {
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

    return (
        <main className="landing-root">
            {/* Background reused from landing */}
            <div className="landing-background">
                <AnimatedParticles />
                <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-[var(--color-primary)] opacity-10 blur-[120px] rounded-full mix-blend-screen animate-pulse" />
            </div>

            <div className="landing-content items-center">
                <div className="auth-card">
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

                            <Link
                                href="/"
                                className="hero-btn hero-btn-secondary"
                            >
                                Volver al Inicio
                            </Link>
                        </div>
                    </form>

                    <div className="text-center pt-2 border-t border-white/5">
                        <Link href="/register" className="text-sm text-[var(--color-text-dim)] hover:text-white transition-colors">
                            ¿Necesitas una cuenta? <span className="text-[var(--color-primary)] font-medium">Información de Registro</span>
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}

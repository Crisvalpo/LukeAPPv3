'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
        <div className="min-h-screen flex items-center justify-center p-6 relative">
            {/* Background Ambience */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 bg-[var(--color-bg-app)]">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[var(--color-primary)] opacity-10 blur-[100px] rounded-full" />
            </div>

            <div className="glass-panel p-8 w-full max-w-md space-y-6">
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold">Bienvenido de nuevo</h2>
                    <p className="text-[var(--color-text-muted)] text-sm">Ingresa a tu cuenta LukeAPP</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-[var(--color-text-muted)] uppercase">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-[var(--color-bg-surface-2)] border border-[var(--glass-border)] rounded-md px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
                            placeholder="nombre@empresa.com"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-[var(--color-text-muted)] uppercase">Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-[var(--color-bg-surface-2)] border border-[var(--glass-border)] rounded-md px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {error && (
                        <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-medium py-3 rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Validando...' : 'Ingresar'}
                    </button>
                </form>

                <div className="text-center text-sm text-[var(--color-text-muted)]">
                    <Link href="/register" className="hover:text-white transition-colors">
                        ¿No tienes cuenta? Registrate aquí
                    </Link>
                </div>
            </div>
        </div>
    );
}

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import LogoutButton from '@/components/LogoutButton';

// Mock data type for what we'd fetch.
// In reality, this would be a complex join query.
type ContextOption = {
    id: string;
    role_id: string;
    companies: { name: string } | null;
    projects: { name: string; code: string } | null;
};

export default async function LobbyPage() {
    let user = null;
    let contexts: ContextOption[] | null = [];

    try {
        const supabase = await createClient();
        const { data } = await supabase.auth.getUser();
        user = data.user;

        if (user) {
            const result = await supabase
                .from('members')
                .select(`
                id,
                role_id,
                companies ( name ),
                projects ( name, code )
                `)
                .eq('user_id', user.id)
                .eq('status', 'ACTIVE');
            contexts = result.data as unknown as ContextOption[]; // explicit cast
        }
    } catch (error) {
        console.error('Lobby load error:', error);
    }

    // Handle empty state
    const hasContexts = contexts && contexts.length > 0;

    return (
        <div className="min-h-screen flex flex-col p-6 relative">
            {/* Background Ambience */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 bg-[var(--color-bg-app)]">
                <div className="absolute top-[20%] left-[50%] transform -translate-x-1/2 w-[60%] h-[60%] bg-[var(--color-primary)] opacity-5 blur-[120px] rounded-full" />
            </div>

            <header className="flex justify-between items-center mb-12">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Luke<span className="text-gradient">APP</span></h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[var(--color-bg-surface-2)] flex items-center justify-center text-xs font-bold border border-[var(--glass-border)]">
                            {user?.email?.charAt(0).toUpperCase() ?? '?'}
                        </div>
                    </div>
                    <LogoutButton />
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full">
                <div className="w-full text-center mb-8">
                    <h2 className="text-3xl font-bold mb-2">Selecciona tu Contexto</h2>
                    <p className="text-[var(--color-text-muted)]">Elige el proyecto donde vas a operar hoy.</p>
                </div>

                {!hasContexts ? (
                    <div className="glass-panel p-12 text-center w-full max-w-xl">
                        <div className="w-16 h-16 bg-[var(--color-bg-surface-2)] rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                            🚫
                        </div>
                        <h3 className="text-xl font-bold mb-2">Sin proyectos asignados</h3>
                        <p className="text-[var(--color-text-muted)] mb-6">
                            Tu identidad está validada, pero no tienes acceso a ningun contexto activo.
                            Contacta al administrador de tu empresa.
                        </p>
                        <button className="px-6 py-2 rounded-lg border border-[var(--glass-border)] hover:bg-[var(--glass-border)] transition-colors">
                            Solicitar Acceso
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                        {(contexts as unknown as ContextOption[]).map((ctx) => (
                            <button
                                key={ctx.id}
                                className="glass-panel p-6 text-left group hover:bg-[var(--glass-border)] transition-all relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-1 h-full bg-[var(--color-primary)] opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="text-xs font-bold text-[var(--color-primary)] uppercase tracking-wider mb-2">
                                    {ctx.role_id.replace('_', ' ')}
                                </div>

                                <h3 className="text-xl font-bold mb-1 group-hover:text-[var(--color-primary-hover)] transition-colors">
                                    {ctx.projects?.name || 'Empresa Global'}
                                </h3>

                                <p className="text-sm text-[var(--color-text-muted)] mb-4">
                                    {ctx.companies?.name}
                                </p>

                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--glass-border)] opacity-60 group-hover:opacity-100 transition-opacity">
                                    <span className="text-xs font-mono bg-[var(--color-bg-app)] px-2 py-1 rounded">
                                        {ctx.projects?.code || 'CORP'}
                                    </span>
                                    <span className="text-xs text-[var(--color-primary)]">
                                        Entrar &rarr;
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

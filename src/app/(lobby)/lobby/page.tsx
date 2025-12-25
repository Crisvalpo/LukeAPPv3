import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import LogoutButton from '@/components/LogoutButton';
import EmptyLobbyState from '@/components/lobby/EmptyLobbyState';
import AnimatedParticles from '@/components/animations/AnimatedParticles';
import Image from 'next/image';

type Membership = {
    id: string;
    role_id: string;
    companies: { name: string } | null;
    projects: { name: string; code: string } | null;
    roles: { description: string } | null;
};

export default async function LobbyPage() {
    let user = null;
    let membership: Membership | null = null;
    let isStaff = false;

    try {
        const supabase = await createClient();
        const { data: { user: fetchedUser } } = await supabase.auth.getUser();
        user = fetchedUser;

        if (!user) {
            redirect('/');
        }

        // Check for super_admin role (Staff)
        const { data: staffMember } = await supabase
            .from('members')
            .select('role_id')
            .eq('user_id', user.id)
            .eq('role_id', 'super_admin')
            .maybeSingle();

        // Direct Access for Staff (Super Admin)
        if (staffMember) {
            redirect('/staff');
        }

        // Get single active membership (invite-only model)
        const { data: memberData, error } = await supabase
            .from('members')
            .select(`
            id,
            role_id,
            companies ( name ),
            projects ( name, code ),
            roles ( description )
        `)
            .eq('user_id', user.id)
            .eq('status', 'ACTIVE')
            .neq('role_id', 'super_admin') // Exclude staff role from normal flow
            .single();

        if (!error && memberData) {
            membership = memberData as unknown as Membership;
        }
    } catch (error) {
        console.error('Lobby load error:', error);
    }

    // No membership = Empty State
    if (!membership || !user) {
        return <EmptyLobbyState userName={user?.user_metadata?.full_name} />;
    }

    // Basic Lobby (Minimal for now)
    return (
        <main className="landing-root">
            {/* Background */}
            <div className="landing-background">
                <AnimatedParticles />
                <div className="absolute top-[20%] left-[50%] transform -translate-x-1/2 w-[60%] h-[60%] bg-[var(--color-primary)] opacity-5 blur-[120px] rounded-full animate-pulse" />
            </div>

            <div className="landing-content" style={{ gap: '3rem', paddingTop: '2rem' }}>
                {/* Header */}
                <header className="flex justify-between items-center w-full max-w-6xl mx-auto">
                    <div className="flex items-center gap-3">
                        <Image
                            src="/logo.png"
                            alt="LukeAPP"
                            width={40}
                            height={40}
                            style={{ filter: 'invert(1) brightness(2)' }}
                        />
                        <div>
                            <h1 className="text-xl font-bold text-white">
                                {membership.projects?.name || 'LukeAPP'}
                            </h1>
                            <p className="text-xs text-[var(--color-text-dim)]">
                                {membership.companies?.name}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end">
                            <p className="text-sm font-medium text-white">
                                {user.user_metadata?.full_name || user.email}
                            </p>
                            <p className="text-xs text-[var(--color-text-dim)]">
                                {membership.roles?.description || membership.role_id}
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-sm font-bold text-white">
                            {user.email?.charAt(0).toUpperCase()}
                        </div>
                        <LogoutButton />
                    </div>
                </header>

                {/* Main Content */}
                <div className="w-full max-w-6xl mx-auto">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-white mb-2">
                            Hall del Proyecto
                        </h2>
                        <p className="text-[var(--color-text-muted)]">
                            Bienvenido al proyecto {membership.projects?.code}
                        </p>
                    </div>

                    {/* Placeholder Grid for Future Features */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {['Perfil', 'Estado del Proyecto', 'Galería', 'Comunicaciones', 'Tareas', 'Intereses'].map((feature, idx) => (
                            <div
                                key={feature}
                                className="auth-card opacity-50"
                                style={{
                                    minHeight: '200px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    animation: `fade-in-up 0.6s ease-out ${idx * 100}ms both`
                                }}
                            >
                                <div className="text-4xl mb-3">📦</div>
                                <h3 className="text-lg font-bold text-white mb-2">{feature}</h3>
                                <p className="text-xs text-[var(--color-text-dim)] text-center">
                                    Próximamente
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* CTA */}
                    <div className="mt-8 text-center">
                        <button
                            className="hero-btn hero-btn-primary"
                            disabled
                            style={{ opacity: 0.5, cursor: 'not-allowed' }}
                        >
                            Ir al Dashboard (Próximamente)
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import LogoutButton from '@/components/LogoutButton';
import EmptyLobbyState from '@/components/lobby/EmptyLobbyState';
import AnimatedParticles from '@/components/animations/AnimatedParticles';
import Image from 'next/image';

type Membership = {
    id: string;
    role_id: string;
    job_title?: string;
    companies: { name: string } | null;
    projects: { name: string; code: string } | null;
    roles: { description: string } | null;
    company_roles: { name: string; color: string } | null;
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
            job_title,
            companies ( name ),
            projects ( name, code ),
            roles ( description ),
            company_roles ( name, color )
        `)
            .eq('user_id', user.id)
            .eq('status', 'ACTIVE')
            .neq('role_id', 'super_admin')
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

    // Determine display role (priority: functional role > job_title > system role)
    const displayRole = membership.company_roles?.name || membership.job_title || membership.roles?.description || membership.role_id;
    const roleColor = membership.company_roles?.color || 'var(--color-primary)';

    return (
        <main className="landing-root">
            <div className="landing-background">
                <AnimatedParticles />
                <div style={{
                    position: 'absolute',
                    top: '20%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '60%',
                    height: '60%',
                    background: 'var(--color-primary)',
                    opacity: 0.05,
                    filter: 'blur(120px)',
                    borderRadius: '50%',
                    animation: 'pulse 2s ease-in-out infinite'
                }} />
            </div>

            <div className="landing-content" style={{ gap: '3rem', paddingTop: '2rem' }}>
                {/* Header */}
                <header style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: '100%',
                    maxWidth: '1152px',
                    margin: '0 auto'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Image
                            src="/logo.png"
                            alt="LukeAPP"
                            width={40}
                            height={40}
                            style={{ filter: 'invert(1) brightness(2)' }}
                        />
                        <div>
                            <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white' }}>
                                {membership.projects?.name || 'LukeAPP'}
                            </h1>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>
                                {membership.companies?.name}
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <p style={{ fontSize: '0.875rem', fontWeight: '500', color: 'white' }}>
                                {user.user_metadata?.full_name || user.email}
                            </p>
                            <p style={{ fontSize: '0.75rem', color: roleColor }}>
                                {displayRole}
                            </p>
                        </div>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: 'var(--color-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.875rem',
                            fontWeight: 'bold',
                            color: 'white'
                        }}>
                            {user.email?.charAt(0).toUpperCase()}
                        </div>
                        <LogoutButton />
                    </div>
                </header>

                {/* Main Content */}
                <div style={{ width: '100%', maxWidth: '1152px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>
                            Hall del Proyecto
                        </h2>
                        <p style={{ color: 'var(--color-text-muted)' }}>
                            Bienvenido al proyecto {membership.projects?.code}
                        </p>
                    </div>

                    {/* Placeholder Grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '1.5rem'
                    }}>
                        {['Perfil', 'Estado del Proyecto', 'Galería', 'Comunicaciones', 'Tareas', 'Intereses'].map((feature, idx) => (
                            <div
                                key={feature}
                                className="auth-card"
                                style={{
                                    minHeight: '200px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    opacity: 0.5,
                                    animation: `fade-in-up 0.6s ease-out ${idx * 100}ms both`
                                }}
                            >
                                <div style={{ fontSize: '2.25rem', marginBottom: '0.75rem' }}>📦</div>
                                <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>
                                    {feature}
                                </h3>
                                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', textAlign: 'center' }}>
                                    Próximamente
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* CTA */}
                    <div style={{ marginTop: '2rem', textAlign: 'center' }}>
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

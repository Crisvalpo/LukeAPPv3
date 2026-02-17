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

        // --- AUTO-ACCEPT PENDING INVITATIONS ---
        // If user already exists but has pending invitations, accept them now (Fix for "User already registered" error)
        if (user.email) {
            const { data: pendingInv } = await supabase
                .from('invitations')
                .select('token')
                .eq('email', user.email)
                .eq('status', 'pending')
                .limit(1)
                .maybeSingle();

            if (pendingInv && pendingInv.token) {
                console.log('🔔 Auto-accepting invitation for existing user:', user.email);
                await supabase.rpc('accept_invitation', {
                    token_input: pendingInv.token,
                    user_id_input: user.id
                });
            }
        }
        // ---------------------------------------

        // Check for founder role
        const { data: founderMember } = await supabase
            .from('members')
            .select('role_id')
            .eq('user_id', user.id)
            .eq('role_id', 'founder')
            .maybeSingle();

        // Direct Access for Founders
        if (founderMember) {
            redirect('/founder');
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
            .eq('active', true)
            .neq('role_id', 'super_admin')
            .single();

        if (!error && memberData) {
            membership = memberData as unknown as Membership;
        }
    } catch (error: any) {
        // Allow Next.js redirects to propagate
        if (error?.digest?.startsWith('NEXT_REDIRECT') || error?.message === 'NEXT_REDIRECT') {
            throw error;
        }
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
        <main className="relative min-h-screen w-full bg-[hsl(220,20%,10%)] text-[hsl(0,0%,98%)] flex flex-col items-center justify-start pt-8 pb-16 px-6 overflow-x-hidden z-0">
            <div className="fixed inset-0 z-[-10] pointer-events-none overflow-hidden">
                <AnimatedParticles />
                <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[60%] h-[60%] bg-[hsl(215,90%,55%)]/5 blur-[120px] rounded-full animate-pulse" />
            </div>

            <div className="w-full max-w-6xl flex flex-col gap-12 pt-8">
                {/* Header */}
                <header className="flex justify-between items-center w-full mx-auto">
                    <div className="flex items-center gap-3">
                        <Image
                            src="/logo.png"
                            alt="LukeAPP"
                            width={40}
                            height={40}
                            className="invert brightness-200"
                        />
                        <div>
                            <h1 className="text-xl font-bold text-white">
                                {membership.projects?.name || 'LukeAPP'}
                            </h1>
                            <p className="text-xs text-[hsl(220,10%,45%)]">
                                {membership.companies?.name}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end">
                            <p className="text-sm font-medium text-white">
                                {user.user_metadata?.full_name || user.email}
                            </p>
                            <p className="text-xs" style={{ color: roleColor }}>
                                {displayRole}
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-[hsl(215,90%,55%)] flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-blue-500/20">
                            {user.email?.charAt(0).toUpperCase()}
                        </div>
                        <LogoutButton />
                    </div>
                </header>

                {/* Main Content */}
                <div className="w-full mx-auto">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-white mb-2">
                            Hall del Proyecto
                        </h2>
                        <p className="text-[hsl(220,10%,70%)]">
                            Bienvenido al proyecto <span className="text-white font-medium">{membership.projects?.code}</span>
                        </p>
                    </div>

                    {/* Placeholder Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {['Perfil', 'Estado del Proyecto', 'Galería', 'Comunicaciones', 'Tareas', 'Intereses'].map((feature, idx) => (
                            <div
                                key={feature}
                                className="group flex flex-col items-center justify-center min-h-[200px] p-8 rounded-[20px] bg-[rgba(20,20,25,0.75)] backdrop-blur-2xl border border-white/5 shadow-xl hover:shadow-2xl hover:-translate-y-1 hover:bg-[rgba(25,25,35,0.85)] hover:border-white/10 transition-all duration-300 relative overflow-hidden"
                                style={{ animationDelay: `${idx * 100}ms` }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                <div className="text-4xl mb-3 opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300">📦</div>
                                <h3 className="text-lg font-bold text-white mb-2 relative z-10">
                                    {feature}
                                </h3>
                                <p className="text-xs text-[hsl(220,10%,45%)] text-center relative z-10 uppercase tracking-wider font-semibold">
                                    Próximamente
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* CTA */}
                    <div className="mt-12 text-center">
                        <button
                            className="px-8 py-3 bg-[hsl(215,90%,55%)] text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 opacity-50 cursor-not-allowed"
                            disabled
                        >
                            Ir al Dashboard (Próximamente)
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}

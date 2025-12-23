'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
    const router = useRouter();
    const supabase = createClient();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.refresh();
        router.push('/');
    };

    return (
        <button
            onClick={handleLogout}
            className="text-xs text-[var(--color-text-muted)] hover:text-white transition-colors uppercase tracking-wider font-medium"
        >
            Cerrar Sesión
        </button>
    );
}

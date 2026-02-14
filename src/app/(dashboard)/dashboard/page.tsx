/**
 * Example: Dashboard Auto-Redirect
 * Redirects users to their home module dashboard
 */

import { redirect } from 'next/navigation';
import { getUserRoleData } from '@/lib/getUserRole';

export default async function DashboardPage() {
    const { homeRoute, permissions } = await getUserRoleData();

    // If user has a defined home route, redirect there
    if (homeRoute) {
        redirect(homeRoute);
    }

    // Fallback: Show lobby or default dashboard
    return (
        <div className="max-w-7xl mx-auto pt-8 pb-20 space-y-10 animate-fade-in">
            <div className="bg-white/5 border border-white/10 rounded-xl p-8 backdrop-blur-sm">
                <h2 className="text-2xl font-bold text-white mb-2">Bienvenido</h2>
                <p className="text-text-muted">No tienes un módulo asignado como inicio. Contacta al administrador.</p>
            </div>
        </div>
    );
}

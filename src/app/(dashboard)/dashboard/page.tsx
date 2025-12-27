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
        <div className="dashboard-page">
            <div className="info-banner">
                <h2>Bienvenido</h2>
                <p>No tienes un módulo asignado como inicio. Contacta al administrador.</p>
            </div>
        </div>
    );
}

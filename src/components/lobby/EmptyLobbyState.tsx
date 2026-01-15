'use client';

import Link from 'next/link';
import Image from 'next/image';
import AnimatedParticles from '@/components/animations/AnimatedParticles';
import '@/styles/lobby.css';

type EmptyLobbyStateProps = {
    userName?: string;
    isStaff?: boolean;
};

export default function EmptyLobbyState({ userName, isStaff }: EmptyLobbyStateProps) {
    return (
        <main className="lobby-root">
            {/* Background */}
            <div className="lobby-bg-overlay">
                <AnimatedParticles />
                <div className="lobby-blob-primary" />
                <div className="lobby-blob-secondary" />
            </div>

            <div className="lobby-card-container">
                <div className="lobby-glass-card">
                    <div className="lobby-text-center">

                        {/* Logo / Icon */}
                        <div className="lobby-logo-wrapper">
                            <div className="lobby-logo-glow" />
                            <div className="lobby-logo-box">
                                <Image
                                    src="/logo.png"
                                    alt="LukeAPP Logo"
                                    width={64}
                                    height={64}
                                    className="lobby-logo-img"
                                />
                            </div>
                        </div>

                        {/* Welcome Text */}
                        <div className="space-y-2">
                            <h2 className="lobby-welcome-title">
                                Hola{userName ? `, ${userName}` : ''}
                            </h2>
                            <p className="lobby-welcome-subtitle">
                                {isStaff ? 'Panel de Administración' : 'Bienvenido a LukeAPP'}
                            </p>
                        </div>

                        {/* Content Area */}
                        {isStaff ? (
                            <div className="lobby-links-grid">
                                <Link
                                    href="/staff/companies"
                                    className="lobby-action-card group"
                                >
                                    <div className="lobby-icon-box icon-box-blue group-hover:scale-110">🏢</div>
                                    <div>
                                        <h3 className="lobby-card-title">Gestión de Empresas</h3>
                                        <p className="lobby-card-desc">Administrar clientes y accesos</p>
                                    </div>
                                </Link>
                                <Link
                                    href="/staff/users"
                                    className="lobby-action-card group"
                                >
                                    <div className="lobby-icon-box icon-box-purple group-hover:scale-110">👥</div>
                                    <div>
                                        <h3 className="lobby-card-title">Equipo Staff</h3>
                                        <p className="lobby-card-desc">Administrar usuarios internos</p>
                                    </div>
                                </Link>
                            </div>
                        ) : (
                            <div className="w-full">
                                <div className="lobby-message-card group">
                                    <div className="lobby-message-bg-icon group-hover:opacity-20">
                                        👋
                                    </div>
                                    <div className="lobby-message-content">
                                        <h3 className="lobby-message-header">
                                            <span className="lobby-pulse-dot" />
                                            ¡Nos alegra verte!
                                        </h3>
                                        <p className="lobby-message-body">
                                            Actualmente no tienes proyectos asignados. Si crees que esto es un error, por favor contacta a tu administrador para que te envíe una nueva invitación.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Logout Action */}
                        <div className="lobby-footer">
                            <button
                                className="lobby-logout-btn group"
                                onClick={async () => {
                                    const { createClient } = await import('@/lib/supabase/client');
                                    const supabase = createClient();
                                    await supabase.auth.signOut();
                                    window.location.href = '/';
                                }}
                            >
                                <span>Cerrar Sesión</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lobby-logout-icon group-hover:translate-x-1"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

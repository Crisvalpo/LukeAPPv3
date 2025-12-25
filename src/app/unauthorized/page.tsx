export default function UnauthorizedPage() {
    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
        }}>
            <div style={{
                maxWidth: '500px',
                textAlign: 'center',
                background: 'rgba(30, 41, 59, 0.6)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '1rem',
                padding: '3rem 2rem'
            }}>
                <div style={{
                    fontSize: '4rem',
                    marginBottom: '1.5rem'
                }}>
                    🚫
                </div>

                <h1 style={{
                    fontSize: '2rem',
                    fontWeight: '700',
                    color: 'white',
                    marginBottom: '1rem'
                }}>
                    Acceso No Autorizado
                </h1>

                <p style={{
                    fontSize: '1rem',
                    color: '#94a3b8',
                    lineHeight: '1.6',
                    marginBottom: '2rem'
                }}>
                    No tienes permisos para acceder a esta sección.
                    Para obtener acceso, debes aceptar una invitación de tu administrador.
                </p>

                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                }}>
                    <a
                        href="/"
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            border: 'none',
                            borderRadius: '0.5rem',
                            color: 'white',
                            fontWeight: '600',
                            textDecoration: 'none',
                            display: 'inline-block'
                        }}
                    >
                        Volver al Inicio
                    </a>

                    <p style={{
                        fontSize: '0.875rem',
                        color: '#64748b',
                        margin: 0
                    }}>
                        ¿Tienes una invitación? Revisa tu email.
                    </p>
                </div>
            </div>
        </div>
    )
}

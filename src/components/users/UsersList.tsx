'use client'

import { Mail, Shield, User, Calendar, Trash2 } from 'lucide-react'
import '@/styles/dashboard.css'
import '@/styles/companies.css'

// Basic Member Interface
interface Member {
    id: string
    user_id: string
    email: string
    role_id: string
    project?: { name: string; code: string } | null
    created_at: string
}

interface UsersListProps {
    users: Member[]
    onDelete?: (memberId: string) => void
    context: 'founder' | 'staff'
}

export default function UsersList({ users, onDelete, context }: UsersListProps) {

    const getRoleBadge = (role: string) => {
        const styles: Record<string, any> = {
            founder: { bg: 'rgba(168, 85, 247, 0.1)', color: '#c084fc', border: 'rgba(168, 85, 247, 0.2)' },
            admin: { bg: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: 'rgba(59, 130, 246, 0.2)' },
            supervisor: { bg: 'rgba(234, 179, 8, 0.1)', color: '#facc15', border: 'rgba(234, 179, 8, 0.2)' },
            worker: { bg: 'rgba(148, 163, 184, 0.1)', color: '#cbd5e1', border: 'rgba(148, 163, 184, 0.2)' }
        }

        const style = styles[role] || styles['worker']

        return (
            <span style={{
                padding: '0.25rem 0.75rem',
                background: style.bg,
                border: `1px solid ${style.border}`,
                borderRadius: '9999px',
                fontSize: '0.75rem',
                color: style.color,
                fontWeight: '600',
                textTransform: 'capitalize',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem'
            }}>
                <Shield size={12} />
                {role}
            </span>
        )
    }

    if (users.length === 0) {
        return (
            <div className="companies-empty">
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <User size={64} color="#94a3b8" style={{ margin: '0 auto 1.5rem', opacity: 0.5 }} />
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'white', marginBottom: '0.75rem' }}>
                        No hay usuarios
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '2rem' }}>
                        Esta empresa aún no tiene miembros registrados.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="companies-list-container">
            <div className="companies-table-wrapper">
                <table className="companies-table">
                    <thead>
                        <tr>
                            <th>Usuario</th>
                            <th>Rol</th>
                            <th>Proyecto Asignado</th>
                            <th>Fecha Registro</th>
                            {onDelete && <th>Acciones</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((member) => (
                            <tr key={member.id}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{
                                            width: '2rem', height: '2rem',
                                            borderRadius: '999px',
                                            background: 'rgba(255,255,255,0.1)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '0.875rem', color: '#cbd5e1'
                                        }}>
                                            {member.email[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <div style={{ color: 'white', fontWeight: '500' }}>{member.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>{getRoleBadge(member.role_id)}</td>
                                <td>
                                    {member.project ? (
                                        <span style={{ fontFamily: 'monospace', color: '#60a5fa', background: 'rgba(96, 165, 250, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.85rem' }}>
                                            {member.project.code}
                                        </span>
                                    ) : (
                                        <span style={{ color: '#64748b', fontSize: '0.875rem', fontStyle: 'italic' }}>
                                            — Global —
                                        </span>
                                    )}
                                </td>
                                <td>
                                    <span style={{ color: '#94a3b8', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Calendar size={14} />
                                        {new Date(member.created_at).toLocaleDateString('es-ES')}
                                    </span>
                                </td>
                                {onDelete && (
                                    <td>
                                        {member.role_id !== 'super_admin' && (
                                            <button
                                                onClick={() => onDelete(member.id)}
                                                className="action-button delete"
                                                title="Eliminar usuario"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

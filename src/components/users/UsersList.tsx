'use client'

import { Mail, Shield, User, Calendar, Trash2, ChevronRight } from 'lucide-react'
import { Heading, Text } from '@/components/ui/Typography'

// Basic Member Interface
interface Member {
    id: string
    user_id: string
    email: string
    role_id: string
    project?: { name: string; code: string } | null
    primary_specialty_id?: string | null
    specialty?: { name: string; code: string } | null
    created_at: string
}

interface UsersListProps {
    users: Member[]
    onDelete?: (memberId: string) => void
    context: 'founder' | 'staff'
}

export default function UsersList({ users, onDelete, context }: UsersListProps) {

    const getRoleBadge = (role: string) => {
        const styles: Record<string, { bg: string, text: string, border: string, icon: string }> = {
            founder: {
                bg: 'bg-indigo-500/10',
                text: 'text-indigo-400',
                border: 'border-indigo-500/20',
                icon: 'text-indigo-400'
            },
            admin: {
                bg: 'bg-blue-500/10',
                text: 'text-blue-400',
                border: 'border-blue-500/20',
                icon: 'text-blue-400'
            },
            supervisor: {
                bg: 'bg-amber-500/10',
                text: 'text-amber-400',
                border: 'border-amber-500/20',
                icon: 'text-amber-400'
            },
            worker: {
                bg: 'bg-slate-500/10',
                text: 'text-slate-400',
                border: 'border-slate-500/20',
                icon: 'text-slate-400'
            }
        }

        const style = styles[role] || styles['worker']

        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${style.bg} ${style.text} ${style.border}`}>
                <Shield size={10} className={style.icon} />
                {role}
            </span>
        )
    }

    if (users.length === 0) {
        return (
            <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-12 text-center backdrop-blur-sm">
                <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/5 shadow-xl">
                    <User size={32} className="text-slate-500 opacity-50" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No hay usuarios</h3>
                <p className="text-slate-400 text-sm max-w-xs mx-auto">
                    Esta empresa aún no tiene miembros registrados en el sistema.
                </p>
            </div>
        )
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-xl shadow-2xl">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-separate border-spacing-0">
                    <thead>
                        <tr className="bg-white/[0.02]">
                            <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-white/5">Usuario</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-white/5">Rol</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-white/5 text-center">Proyecto</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-white/5">Registro</th>
                            {onDelete && <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-white/5 text-right">Acciones</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {users
                            .filter(m => m.email !== 'cristianluke@gmail.com')
                            .map((member) => (
                                <tr key={member.id} className="group hover:bg-white/[0.02] transition-colors duration-200">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/5 flex items-center justify-center text-sm font-bold text-slate-300 shadow-lg group-hover:scale-110 transition-transform duration-300">
                                                {member.email[0].toUpperCase()}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
                                                    {member.email}
                                                </span>
                                                <span className="text-[10px] text-slate-500 font-mono">ID: {member.id.substring(0, 8)}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {getRoleBadge(member.role_id)}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            {member.project ? (
                                                <span className="inline-flex items-center px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono text-[11px] font-bold">
                                                    {member.project.code}
                                                </span>
                                            ) : (
                                                <span className="text-slate-500 text-xs italic opacity-60">
                                                    — Global —
                                                </span>
                                            )}
                                            {member.specialty ? (
                                                <span className="text-[9px] text-blue-400 font-black uppercase tracking-widest opacity-80">
                                                    {member.specialty.code}
                                                </span>
                                            ) : (
                                                <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest opacity-40">
                                                    TODAS
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-slate-400 text-xs">
                                            <Calendar size={14} className="opacity-50" />
                                            <span>{new Date(member.created_at).toLocaleDateString('es-ES')}</span>
                                        </div>
                                    </td>
                                    {onDelete && (
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => onDelete(member.id)}
                                                className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all duration-300 shadow-lg shadow-red-500/10 group/btn"
                                                title="Eliminar usuario"
                                            >
                                                <Trash2 size={16} className="group-hover/btn:scale-110 transition-transform" />
                                            </button>
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


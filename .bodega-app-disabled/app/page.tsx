'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Warehouse, LogOut, PackageSearch, QrCode, ClipboardList, Loader2, HardHat, RefreshCw, CloudDownload } from 'lucide-react'
import { downloadProjectData } from '@/services/reception'
import type { Member } from '@/types'
import ConnectionStatus from './components/ConnectionStatus'
import SyncStatusBanner from './components/SyncStatusBanner'
import { getCachedUserContext, saveUserContext, attemptSessionRefresh, updateLastSync } from '@/lib/user-context'

export default function DashboardPage() {
    const [member, setMember] = useState<Member | null>(null)
    const [loading, setLoading] = useState(true)
    const [syncing, setSyncing] = useState(false)
    const [syncStatus, setSyncStatus] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        async function loadUser() {
            // 1. Try cached context first (offline-tolerant)
            const cached = getCachedUserContext()
            if (cached) {
                console.log('✅ Using cached user context')
                // Create partial member from cache
                const cachedMember: any = {
                    id: 'temp-cached',
                    user_id: cached.userId,
                    company_id: cached.companyId || '',
                    project_id: cached.projectId,
                    role: cached.role,
                    job_title: cached.jobTitle,
                    created_at: new Date().toISOString(),
                    project: cached.projectName ? { name: cached.projectName } : undefined
                }
                setMember(cachedMember)
                setLoading(false)

                // Try to refresh in background if online
                if (navigator.onLine) {
                    attemptSessionRefresh().catch(console.warn)
                }
                return
            }

            // 2. Fallback to network (first time or expired)
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                    router.push('/login')
                    return
                }

                // Fetch member data with project info
                const { data: memberData, error } = await supabase
                    .from('members')
                    .select(`
                        *,
                        project:projects(*),
                        company:companies(*)
                    `)
                    .eq('user_id', user.id)
                    .single()

                if (error || !memberData) {
                    console.error('Failed to load member data:', error)
                    return
                }

                // Save to cache for offline use
                saveUserContext({
                    userId: user.id,
                    email: user.email || '',
                    projectId: memberData.project_id || '',
                    projectName: memberData.project?.name,
                    companyId: memberData.company_id || '',
                    role: memberData.role_id,
                    jobTitle: memberData.job_title || undefined
                })

                setMember(memberData)
                setLoading(false)
            } catch (err) {
                console.error('Error loading user:', err)
                // If offline and no cache, show error
                setLoading(false)
            }
        }

        loadUser()
    }, [])

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.refresh()
    }

    const handleSync = async () => {
        if (!member?.project_id) return
        setSyncing(true)
        setSyncStatus('Descargando...')

        try {
            const count = await downloadProjectData(member.project_id)
            updateLastSync() // Track sync time
            setSyncStatus(`Sync OK (${count})`)
            setTimeout(() => setSyncStatus(null), 3000)
        } catch (error) {
            console.error(error)
            setSyncStatus('Error Sync')
        } finally {
            setSyncing(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        )
    }

    // Safety check: Needs to be assigned to a project
    if (!member?.project_id) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
                <HardHat className="w-16 h-16 text-yellow-500 mb-4" />
                <h1 className="text-xl font-bold text-white mb-2">Sin Proyecto Asignado</h1>
                <p className="text-slate-400 mb-6">
                    Tu usuario pertenece a "{member?.company?.name}" pero no ha sido asignado a un proyecto específico.
                </p>
                <button
                    onClick={handleSignOut}
                    className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
                >
                    Cerrar Sesión
                </button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white pb-20">
            {/* Header */}
            <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
                <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
                            <Warehouse className="text-white w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg leading-tight">LukeAPP Bodega</h1>
                            <p className="text-xs text-slate-400 mt-0.5 font-medium">{member.project?.name}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <ConnectionStatus />
                        <button
                            onClick={handleSignOut}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Sync Status Banner */}
            <SyncStatusBanner onSyncClick={handleSync} />

            {/* Main Actions */}
            <main className="p-4 space-y-4">

                {/* User Greeting + Sync */}
                <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-5 shadow-xl shadow-blue-900/20 flex justify-between items-center">
                    <div>
                        <p className="text-blue-100 text-sm font-medium mb-1">Bienvenido,</p>
                        <h2 className="text-2xl font-bold">{member.job_title || 'Bodeguero'}</h2>
                    </div>
                    <button
                        onClick={handleSync}
                        disabled={syncing}
                        className="bg-white/10 hover:bg-white/20 p-3 rounded-full transition-colors relative"
                    >
                        {syncing ? (
                            <RefreshCw className="w-6 h-6 text-white animate-spin" />
                        ) : (
                            <CloudDownload className="w-6 h-6 text-white" />
                        )}
                        {syncStatus && (
                            <span className="absolute -bottom-8 right-0 bg-black/80 text-xs px-2 py-1 rounded whitespace-nowrap">
                                {syncStatus}
                            </span>
                        )}
                    </button>
                </div>

                {/* Action Grid */}
                <div className="grid grid-cols-2 gap-4">

                    {/* Recepción */}
                    <button
                        onClick={() => router.push('/reception')}
                        className="bg-slate-900 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800 p-5 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all group aspect-square">
                        <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                            <QrCode className="w-6 h-6 text-green-500" />
                        </div>
                        <span className="font-semibold text-slate-200">Recepción (QR)</span>
                    </button>

                    {/* Picking */}
                    <button className="bg-slate-900 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800 p-5 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all group aspect-square">
                        <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
                            <ClipboardList className="w-6 h-6 text-orange-500" />
                        </div>
                        <span className="font-semibold text-slate-200">Picking / Entrega</span>
                    </button>

                    {/* Inventario */}
                    <button className="bg-slate-900 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800 p-5 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all group w-full col-span-2">
                        <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                            <PackageSearch className="w-6 h-6 text-purple-500" />
                        </div>
                        <div className="text-center">
                            <span className="font-semibold text-slate-200 block">Consultar Inventario</span>
                            <span className="text-xs text-slate-500">Buscar por código, colada o ubicación</span>
                        </div>
                    </button>

                </div>
            </main>
        </div>
    )
}

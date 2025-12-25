'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

interface ShiftFormProps {
    onSuccess?: () => void
    onCancel?: () => void
}

export default function ShiftForm({ onSuccess, onCancel }: ShiftFormProps) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.currentTarget)
        const name = formData.get('name') as string
        const workDays = parseInt(formData.get('work_days') as string)
        const restDays = parseInt(formData.get('rest_days') as string)

        // TODO: Get real project_id from context or session
        // For now we assume the user has a selected/active project in their session claims
        // or we fetch it. This is a placeholder. 
        // In real impl: const { project_id } = useProjectContext()
        const project_id = '00000000-0000-0000-0000-000000000000' // Placeholder

        const { error } = await supabase
            .from('work_schedules')
            .insert({
                name,
                work_days: workDays,
                rest_days: restDays,
                project_id, // This will fail RLS if not real, user needs to inject real ID
                active: true
            })

        if (error) {
            alert('Error creating schedule: ' + error.message)
        } else {
            router.refresh()
            if (onSuccess) onSuccess()
        }
        setLoading(false)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 bg-[#1e293b] p-6 rounded-xl border border-white/10">
            <div>
                <label className="block text-xs font-medium text-slate-400 uppercase mb-1">Schedule Name</label>
                <input
                    name="name"
                    type="text"
                    placeholder="e.g. Turno 5x2 Calama"
                    required
                    className="w-full bg-[#0f172a] border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-blue-500 outline-none"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-slate-400 uppercase mb-1">Work Days</label>
                    <input
                        name="work_days"
                        type="number"
                        defaultValue={5}
                        min={1}
                        className="w-full bg-[#0f172a] border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-400 uppercase mb-1">Rest Days</label>
                    <input
                        name="rest_days"
                        type="number"
                        defaultValue={2}
                        min={0}
                        className="w-full bg-[#0f172a] border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                    {loading ? 'Saving...' : 'Create Shift'}
                </button>
            </div>
        </form>
    )
}

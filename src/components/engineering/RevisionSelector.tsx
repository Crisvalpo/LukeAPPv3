/**
 * REVISION SELECTOR COMPONENT
 * 
 * Dropdown pair to select Isometric + Revision for detail upload.
 * Filters revisions based on selected isometric.
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Search, ChevronDown } from 'lucide-react'

interface Props {
    projectId: string
    onRevisionSelect: (isoId: string, revId: string, isoNumber: string) => void
    disabled?: boolean
}

interface Isometric {
    id: string
    iso_number: string
}

interface Revision {
    id: string
    rev_code: string
    revision_status?: string
}

export default function RevisionSelector({
    projectId,
    onRevisionSelect,
    disabled
}: Props) {
    const [isometrics, setIsometrics] = useState<Isometric[]>([])
    const [selectedIso, setSelectedIso] = useState<string>('')
    const [revisions, setRevisions] = useState<Revision[]>([])
    const [selectedRev, setSelectedRev] = useState<string>('')
    const [loadingIso, setLoadingIso] = useState(false)
    const [loadingRev, setLoadingRev] = useState(false)

    // Search state
    const [isOpen, setIsOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    const wrapperRef = useRef<HTMLDivElement>(null)

    // Filter isometrics based on search
    const filteredIsometrics = isometrics.filter(iso =>
        iso.iso_number.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Click outside handler
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    // Load Isometrics on mount
    useEffect(() => {
        if (projectId) {
            loadIsometrics()
        }
    }, [projectId])

    // Load Revisions when ISO changes
    useEffect(() => {
        if (selectedIso) {
            loadRevisions(selectedIso)
            // Update search term to match selected iso if not already (for initial load or external set)
            const iso = isometrics.find(i => i.id === selectedIso)
            if (iso && !isOpen) {
                setSearchTerm(iso.iso_number)
            }
        } else {
            setRevisions([])
            setSelectedRev('')
            if (!isOpen) setSearchTerm('')
        }
    }, [selectedIso, isometrics]) // Added isometrics dependency to ensure name update

    async function loadIsometrics() {
        setLoadingIso(true)
        const supabase = createClient()

        try {
            const { data } = await supabase
                .from('isometrics')
                .select('id, iso_number')
                .eq('project_id', projectId)
                .order('iso_number')

            if (data) setIsometrics(data)
        } finally {
            setLoadingIso(false)
        }
    }

    async function loadRevisions(isoId: string) {
        setLoadingRev(true)
        const supabase = createClient()

        try {
            const { data } = await supabase
                .from('engineering_revisions')
                .select('id, rev_code, revision_status')
                .eq('isometric_id', isoId)
                .order('rev_code', { ascending: false }) // Newest first

            if (data) setRevisions(data)
        } finally {
            setLoadingRev(false)
        }
    }

    function handleIsoSelect(iso: Isometric) {
        setSelectedIso(iso.id)
        setSearchTerm(iso.iso_number)
        setIsOpen(false)
        setSelectedRev('')
    }

    function handleRevChange(e: React.ChangeEvent<HTMLSelectElement>) {
        const revId = e.target.value
        setSelectedRev(revId)

        const iso = isometrics.find(i => i.id === selectedIso)
        if (revId && iso) {
            onRevisionSelect(selectedIso, revId, iso.iso_number)
        }
    }

    return (
        <div className="flex flex-col md:flex-row gap-4 p-4 bg-bg-surface-1/30 border border-glass-border/30 rounded-xl mb-6">
            <div className="flex-1 relative group z-20">
                <label className="text-xs font-semibold text-text-dim uppercase tracking-wider mb-1.5 block">Isométrico</label>
                <div className="relative w-full" ref={wrapperRef}>
                    <input
                        type="text"
                        placeholder={loadingIso ? "Cargando..." : "Buscar isométrico..."}
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value)
                            setIsOpen(true)
                            if (e.target.value === '') setSelectedIso('')
                        }}
                        onFocus={() => setIsOpen(true)}
                        disabled={disabled || loadingIso}
                        className="w-full bg-black/20 border border-glass-border/50 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/50 transition-all placeholder:text-text-dim/50"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-dim">
                        {loadingIso ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <Search size={16} />
                        )}
                    </div>

                    {isOpen && !disabled && (
                        <div className="absolute top-[calc(100%+4px)] left-0 w-full max-h-[300px] overflow-y-auto bg-bg-surface-1 border border-glass-border/50 rounded-lg shadow-xl shadow-black/50 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
                            {filteredIsometrics.length > 0 ? (
                                filteredIsometrics.map(iso => (
                                    <div
                                        key={iso.id}
                                        className={`px-4 py-2.5 cursor-pointer text-sm transition-colors border-b border-glass-border/10 last:border-0 hover:bg-white/5 ${selectedIso === iso.id ? 'bg-brand-primary/20 text-brand-primary font-medium' : 'text-white/80'
                                            }`}
                                        onClick={() => handleIsoSelect(iso)}
                                    >
                                        {iso.iso_number}
                                    </div>
                                ))
                            ) : (
                                <div className="p-4 text-center text-text-dim text-sm italic">
                                    No se encontraron resultados
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 relative group z-10 w-full md:w-auto">
                <label className="text-xs font-semibold text-text-dim uppercase tracking-wider mb-1.5 block">Revisión</label>
                <div className="relative">
                    <select
                        value={selectedRev}
                        onChange={handleRevChange}
                        disabled={!selectedIso || disabled || loadingRev}
                        className="w-full bg-black/20 border border-glass-border/50 text-white rounded-lg px-4 py-2.5 appearance-none focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/50 transition-all cursor-pointer hover:bg-black/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <option value="">-- Seleccionar --</option>
                        {revisions.map(rev => (
                            <option key={rev.id} value={rev.id}>
                                Rev {rev.rev_code} {rev.revision_status ? `(${rev.revision_status})` : ''}
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-dim">
                        {loadingRev ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <ChevronDown size={16} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

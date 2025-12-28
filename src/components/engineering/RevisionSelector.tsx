/**
 * REVISION SELECTOR COMPONENT
 * 
 * Dropdown pair to select Isometric + Revision for detail upload.
 * Filters revisions based on selected isometric.
 */

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

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
        } else {
            setRevisions([])
            setSelectedRev('')
        }
    }, [selectedIso])

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

    function handleIsoChange(e: React.ChangeEvent<HTMLSelectElement>) {
        setSelectedIso(e.target.value)
        setSelectedRev('') // Reset revision
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
        <div className="revision-selector-group">
            <div className="selector-item">
                <label>Isométrico:</label>
                <select
                    value={selectedIso}
                    onChange={handleIsoChange}
                    disabled={disabled || loadingIso}
                    className="form-select"
                >
                    <option value="">-- Seleccionar --</option>
                    {isometrics.map(iso => (
                        <option key={iso.id} value={iso.id}>
                            {iso.iso_number}
                        </option>
                    ))}
                </select>
                {loadingIso && <span className="loader-mini" />}
            </div>

            <div className="selector-item">
                <label>Revisión:</label>
                <select
                    value={selectedRev}
                    onChange={handleRevChange}
                    disabled={!selectedIso || disabled || loadingRev}
                    className="form-select"
                >
                    <option value="">-- Seleccionar --</option>
                    {revisions.map(rev => (
                        <option key={rev.id} value={rev.id}>
                            Rev {rev.rev_code} {rev.revision_status ? `(${rev.revision_status})` : ''}
                        </option>
                    ))}
                </select>
                {loadingRev && <span className="loader-mini" />}
            </div>

            <style jsx>{`
                .revision-selector-group {
                    display: flex;
                    gap: 20px;
                    padding: 15px;
                    background: rgba(255,255,255,0.03);
                    border-radius: 8px;
                    border: 1px solid rgba(255,255,255,0.1);
                    margin-bottom: 20px;
                    align-items: flex-end;
                }
                .selector-item {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                    flex: 1;
                    position: relative;
                }
                .loader-mini {
                    position: absolute;
                    right: 10px;
                    top: 35px;
                    width: 12px;
                    height: 12px;
                    border: 2px solid rgba(255,255,255,0.5);
                    border-top-color: var(--accent);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    )
}

/**
 * REVISION SELECTOR COMPONENT
 * 
 * Two-dropdown selector: Isométrico → Revisión
 * Used in Engineering Details upload to select target revision
 */

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Isometric {
    id: string
    iso_number: string
    current_revision_id: string | null
}

interface Revision {
    id: string
    rev_code: string
    revision_status: string
}

interface Props {
    projectId: string
    onRevisionSelect: (revisionId: string | null, isoNumber: string, revCode: string) => void
    disabled?: boolean
}

export default function RevisionSelector({
    projectId,
    onRevisionSelect,
    disabled = false
}: Props) {
    const [isometrics, setIsometrics] = useState<Isometric[]>([])
    const [selectedIso, setSelectedIso] = useState<string>('')
    const [revisions, setRevisions] = useState<Revision[]>([])
    const [selectedRev, setSelectedRev] = useState<string>('')
    const [isLoading, setIsLoading] = useState(true)

    // Load isometrics on mount
    useEffect(() => {
        loadIsometrics()
    }, [projectId])

    // Load revisions when ISO changes
    useEffect(() => {
        if (selectedIso) {
            loadRevisions(selectedIso)
        } else {
            setRevisions([])
            setSelectedRev('')
        }
    }, [selectedIso])

    // Notify parent when both selected
    useEffect(() => {
        if (selectedIso && selectedRev) {
            const iso = isometrics.find(i => i.id === selectedIso)
            const rev = revisions.find(r => r.id === selectedRev)
            if (iso && rev) {
                onRevisionSelect(selectedRev, iso.iso_number, rev.rev_code)
            }
        } else {
            onRevisionSelect(null, '', '')
        }
    }, [selectedIso, selectedRev])

    async function loadIsometrics() {
        setIsLoading(true)
        try {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('isometrics')
                .select('id, iso_number, current_revision_id')
                .eq('project_id', projectId)
                .order('iso_number')

            if (error) throw error
            setIsometrics(data || [])
        } catch (error) {
            console.error('Error loading isometrics:', error)
        } finally {
            setIsLoading(false)
        }
    }

    async function loadRevisions(isometricId: string) {
        try {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('engineering_revisions')
                .select('id, rev_code, revision_status')
                .eq('isometric_id', isometricId)
                .order('rev_code')

            if (error) throw error
            setRevisions(data || [])

            // Auto-select latest revision
            if (data && data.length > 0) {
                setSelectedRev(data[data.length - 1].id)
            }
        } catch (error) {
            console.error('Error loading revisions:', error)
        }
    }

    function handleIsoChange(isoId: string) {
        setSelectedIso(isoId)
        setSelectedRev('') // Reset revision
    }

    return (
        <div className="revision-selector">
            <div className="selector-group">
                <label htmlFor="iso-select">
                    <span className="label-icon">📐</span>
                    Isométrico
                </label>
                <select
                    id="iso-select"
                    value={selectedIso}
                    onChange={(e) => handleIsoChange(e.target.value)}
                    disabled={disabled || isLoading}
                    className="selector-dropdown"
                >
                    <option value="">Selecciona un isométrico...</option>
                    {isometrics.map(iso => (
                        <option key={iso.id} value={iso.id}>
                            {iso.iso_number}
                        </option>
                    ))}
                </select>
            </div>

            <div className="selector-arrow">→</div>

            <div className="selector-group">
                <label htmlFor="rev-select">
                    <span className="label-icon">🔄</span>
                    Revisión
                </label>
                <select
                    id="rev-select"
                    value={selectedRev}
                    onChange={(e) => setSelectedRev(e.target.value)}
                    disabled={disabled || !selectedIso || revisions.length === 0}
                    className="selector-dropdown"
                >
                    <option value="">Selecciona una revisión...</option>
                    {revisions.map(rev => (
                        <option key={rev.id} value={rev.id}>
                            Rev {rev.rev_code} ({rev.revision_status})
                        </option>
                    ))}
                </select>
            </div>

            {selectedIso && revisions.length === 0 && (
                <div className="selector-warning">
                    ⚠️ Este isométrico no tiene revisiones
                </div>
            )}
        </div>
    )
}

/**
 * REVISION SELECTOR COMPONENT
 * 
 * Dropdown pair to select Isometric + Revision for detail upload.
 * Filters revisions based on selected isometric.
 */

'use client'

import { useState, useEffect, useRef } from 'react'
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
        <div className="revision-selector-group">
            <div className="selector-item">
                <label>Isométrico:</label>
                <div className="combobox-wrapper" ref={wrapperRef}>
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
                        className="form-input search-input"
                    />
                    {loadingIso && <span className="loader-mini input-loader" />}

                    {isOpen && !disabled && (
                        <div className="combobox-options">
                            {filteredIsometrics.length > 0 ? (
                                filteredIsometrics.map(iso => (
                                    <div
                                        key={iso.id}
                                        className={`option ${selectedIso === iso.id ? 'selected' : ''}`}
                                        onClick={() => handleIsoSelect(iso)}
                                    >
                                        {iso.iso_number}
                                    </div>
                                ))
                            ) : (
                                <div className="no-options">No se encontraron resultados</div>
                            )}
                        </div>
                    )}
                </div>
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
                
                .combobox-wrapper {
                    position: relative;
                    width: 100%;
                }

                .search-input {
                    padding-right: 30px; /* Space for loader */
                }

                .combobox-options {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    max-height: 250px;
                    overflow-y: auto;
                    background: #1e1e1e;
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 6px;
                    z-index: 1000;
                    margin-top: 4px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                }

                .option {
                    padding: 10px 12px;
                    cursor: pointer;
                    color: #e2e8f0;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                    transition: background 0.2s;
                }

                .option:last-child {
                    border-bottom: none;
                }

                .option:hover {
                    background: rgba(255,255,255,0.1);
                }

                .option.selected {
                    background: rgba(var(--accent-rgb), 0.2);
                    color: var(--accent);
                    font-weight: 500;
                }

                .no-options {
                    padding: 12px;
                    color: #718096;
                    text-align: center;
                    font-size: 0.9rem;
                }

                .loader-mini {
                    position: absolute;
                    width: 12px;
                    height: 12px;
                    border: 2px solid rgba(255,255,255,0.5);
                    border-top-color: var(--accent);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                .loader-mini.input-loader {
                    right: 12px;
                    top: 14px;
                }

                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    )
}

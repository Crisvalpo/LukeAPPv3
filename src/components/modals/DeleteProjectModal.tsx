'use client'

import { useState } from 'react'
import { AlertTriangle, Trash2 } from 'lucide-react'
import { deleteProjectComplete, type ProjectDeletionStats } from '@/services/projects'
import '@/styles/dashboard.css'

interface DeleteProjectModalProps {
    projectId: string
    projectCode: string
    projectName: string
    companyId: string
    onClose: () => void
    onSuccess: () => void
}

export default function DeleteProjectModal({
    projectId,
    projectCode,
    projectName,
    companyId,
    onClose,
    onSuccess
}: DeleteProjectModalProps) {
    const [confirmText, setConfirmText] = useState('')
    const [isDeleting, setIsDeleting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const isConfirmed = confirmText === projectCode

    async function handleDelete() {
        if (!isConfirmed) return

        setIsDeleting(true)
        setError(null)

        const result = await deleteProjectComplete(projectId, companyId)

        if (result.success) {
            onSuccess()
        } else {
            setError(result.error || 'Error al eliminar proyecto')
            setIsDeleting(false)
        }
    }

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: '2rem'
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95))',
                    backdropFilter: 'blur(24px)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '1rem',
                    padding: '2rem',
                    maxWidth: '500px',
                    width: '100%',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with warning */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div
                        style={{
                            background: 'rgba(239, 68, 68, 0.2)',
                            borderRadius: '0.75rem',
                            padding: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <AlertTriangle size={28} color="#ef4444" strokeWidth={2} />
                    </div>
                    <div>
                        <h2 style={{ color: 'white', fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>
                            Eliminar Proyecto
                        </h2>
                        <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>
                            Esta acción es IRREVERSIBLE
                        </p>
                    </div>
                </div>

                {/* Project info */}
                <div
                    style={{
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        borderRadius: '0.5rem',
                        padding: '1rem',
                        marginBottom: '1.5rem'
                    }}
                >
                    <p style={{ color: '#cbd5e1', fontSize: '0.875rem', margin: '0 0 0.5rem 0' }}>
                        Proyecto a eliminar:
                    </p>
                    <p style={{ color: 'white', fontSize: '1.125rem', fontWeight: '600', margin: 0 }}>
                        {projectCode} - {projectName}
                    </p>
                </div>

                {/* Warning list */}
                <div
                    style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '0.5rem',
                        padding: '1rem',
                        marginBottom: '1.5rem'
                    }}
                >
                    <p style={{ color: '#fca5a5', fontWeight: '600', margin: '0 0 0.75rem 0' }}>
                        Se eliminará permanentemente:
                    </p>
                    <ul style={{ color: '#fecaca', fontSize: '0.875rem', margin: 0, paddingLeft: '1.25rem', lineHeight: '1.6' }}>
                        <li>Todos los miembros del proyecto</li>
                        <li>Usuarios que solo pertenecen a este proyecto (de auth.users)</li>
                        <li>Todos los archivos del proyecto (GLB, PDF, imágenes, etc.)</li>
                        <li>Isométricos, spools, soldaduras y revisiones</li>
                        <li>Registro de fabricación y despacho</li>
                        <li>Solicitudes de materiales y recepciones</li>
                        <li>Todo el historial y datos relacionados</li>
                    </ul>
                </div>

                {/* Confirmation input */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ color: '#cbd5e1', fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem' }}>
                        Para confirmar, escribe el código del proyecto: <strong style={{ color: 'white' }}>{projectCode}</strong>
                    </label>
                    <input
                        type="text"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder={`Escribe "${projectCode}"`}
                        disabled={isDeleting}
                        className="form-input"
                        style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            background: 'rgba(15, 23, 42, 0.6)',
                            border: confirmText && !isConfirmed
                                ? '1px solid rgba(239, 68, 68, 0.5)'
                                : '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '0.5rem',
                            color: 'white',
                            fontSize: '1rem'
                        }}
                    />
                    {confirmText && !isConfirmed && (
                        <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                            El código no coincide
                        </p>
                    )}
                </div>

                {/* Error message */}
                {error && (
                    <div
                        style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '0.5rem',
                            padding: '0.75rem',
                            marginBottom: '1.5rem'
                        }}
                    >
                        <p style={{ color: '#fca5a5', fontSize: '0.875rem', margin: 0 }}>{error}</p>
                    </div>
                )}

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <button
                        onClick={onClose}
                        disabled={isDeleting}
                        className="btn btn-secondary"
                        style={{ flex: 1 }}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={!isConfirmed || isDeleting}
                        className="btn"
                        style={{
                            flex: 1,
                            background: isConfirmed && !isDeleting
                                ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                                : 'rgba(100, 116, 139, 0.3)',
                            color: 'white',
                            cursor: isConfirmed && !isDeleting ? 'pointer' : 'not-allowed',
                            opacity: isConfirmed && !isDeleting ? 1 : 0.5
                        }}
                    >
                        <Trash2 size={18} strokeWidth={2} />
                        {isDeleting ? 'Eliminando...' : 'Eliminar Proyecto'}
                    </button>
                </div>
            </div>
        </div>
    )
}

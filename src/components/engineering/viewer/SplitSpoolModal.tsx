'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useViewerStore } from './ViewerLogic'
import { splitSpool } from '@/actions/spools'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icons } from '@/components/ui/Icons'
import { Split } from 'lucide-react'

// ... imports

interface SplitSpoolModalProps {
    isOpen?: boolean
    onClose?: () => void
    spool?: any
    onSuccess?: () => void
}

export function SplitSpoolModal({ isOpen, onClose, spool, onSuccess }: SplitSpoolModalProps = {}) {
    // 1. Store Hook (Conditional usage if no props)
    const store = useViewerStore()

    // 2. Resolve Active State
    // If props are provided, use them. Else use Store.
    const isVisible = isOpen !== undefined ? isOpen : store.isSplitting
    const handleClose = onClose || (() => store.setSplitting(false))
    // Fix: If prop is null, don't use store activeSpoolId if we are in "Prop Mode" (isOpen is defined)
    // Actually, if we use props, we expect 'spool' to be passed.

    let activeSpool = spool
    if (!activeSpool && !isOpen && store.activeSpoolId) {
        activeSpool = store.spools.get(store.activeSpoolId)
    }

    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [mounted, setMounted] = useState(false)
    useEffect(() => setMounted(true), [])

    if (!mounted) return null
    if (!isVisible) return null
    if (!activeSpool) return null

    const handleSplit = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const result = await splitSpool(activeSpool.id)

            if (result.success) {
                // Success! Close modal
                handleClose()
                if (onSuccess) onSuccess()
            }
        } catch (e: any) {
            console.error('Split failed', e)
            setError(e.message || 'Error al dividir spool')
        } finally {
            setIsLoading(false)
        }
    }

    return createPortal(
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 110000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)'
        }}>
            <Card variant="glass" style={{ width: '400px', borderColor: 'rgba(255,255,255,0.1)', boxShadow: 'var(--glass-shadow)' }}>
                <CardHeader>
                    <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}>
                        <Split size={20} style={{ color: 'var(--color-primary)' }} />
                        Dividir Spool {activeSpool.name}
                    </CardTitle>
                </CardHeader>
                <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ fontSize: '0.875rem', color: '#cbd5e1' }}>
                        <p>Esta acción:</p>
                        <ul style={{ listStyleType: 'disc', paddingLeft: '20px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px', color: '#94a3b8' }}>
                            <li>Marcará el spool original como <strong>DIVIDIDO</strong>.</li>
                            <li>Creará 2 sub-spools listos para asignar componentes.</li>
                            <li>Generará nuevos Tags de Gestión.</li>
                            <li>Requerirá re-impresión de etiquetas.</li>
                        </ul>
                    </div>

                    {error && (
                        <div style={{
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            padding: '12px',
                            borderRadius: '6px',
                            color: '#f87171',
                            fontSize: '0.75rem'
                        }}>
                            {error}
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                        <Button
                            variant="ghost"
                            onClick={handleClose}
                            disabled={isLoading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="default"
                            onClick={handleSplit}
                            disabled={isLoading}
                            style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
                        >
                            {isLoading ? 'Procesando...' : 'Confirmar División'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>,
        document.body
    )
}

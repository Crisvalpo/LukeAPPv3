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
    onSuccess?: (newSpools?: any[]) => void
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
                if (onSuccess) onSuccess(result.children)
            }
        } catch (e: any) {
            console.error('Split failed', e)
            setError(e.message || 'Error al dividir spool')
        } finally {
            setIsLoading(false)
        }
    }

    return createPortal(
        <div className="fixed inset-0 z-[110000] flex items-center justify-center bg-black/60 backdrop-blur-[4px]">
            <Card variant="glass" className="w-[400px] border-white/10 shadow-[var(--glass-shadow)]">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                        <Split size={20} className="text-brand-primary" />
                        Dividir Spool {activeSpool.name}
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <div className="text-sm text-slate-300">
                        <p>Esta acción:</p>
                        <ul className="list-disc pl-5 mt-2 flex flex-col gap-1 text-slate-400">
                            <li>Marcará el spool original como <strong>DIVIDIDO</strong>.</li>
                            <li>Creará 2 sub-spools listos para asignar componentes.</li>
                            <li>Generará nuevos Tags de Gestión.</li>
                            <li>Requerirá re-impresión de etiquetas.</li>
                        </ul>
                    </div>

                    <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-md text-yellow-400 text-xs flex gap-2 items-start">
                        <span className="text-base">⚠️</span>
                        <span>
                            <strong>Nota Importante:</strong> Si quedan uniones pendientes (Origen 'S' Taller) en el spool padre, este no podrá marcarse como "FABRICADO" hasta que dichas uniones se gestionen (Ej: editando su estado o eliminándolas).
                        </span>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-md text-red-400 text-xs">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3 justify-end mt-4">
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
                            className="bg-brand-primary text-white hover:bg-brand-primary/90"
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

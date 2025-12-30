'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getConsolidatedMTO } from '@/services/material-consolidation'
import { getWorkshopInventory, processPipeCut, PipeStick } from '@/services/pipe-inventory'
import { MTOByIsometric, MTOItemSummary } from '@/services/material-consolidation'

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2, Scissors, ruler, RotateCcw } from 'lucide-react'

interface CuttingOrderViewProps {
    projectId: string
    userId: string
    workshopId?: string // Optional: Filter by specific workshop
}

interface PendingSpool {
    spoolId: string
    spoolName: string
    isoName: string
    pipeItems: MTOItemSummary[]
}

export default function CuttingOrderView({ projectId, userId, workshopId }: CuttingOrderViewProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [pendingSpools, setPendingSpools] = useState<PendingSpool[]>([])
    const [inventory, setInventory] = useState<PipeStick[]>([])

    // Selection State
    const [selectedSpool, setSelectedSpool] = useState<PendingSpool | null>(null)
    const [selectedItem, setSelectedItem] = useState<MTOItemSummary | null>(null)
    const [recommendedStick, setRecommendedStick] = useState<PipeStick | null>(null)

    // Modal State
    const [showConfirmModal, setShowConfirmModal] = useState(false)
    const [isProcessingCut, setIsProcessingCut] = useState(false)

    useEffect(() => {
        loadData()
    }, [projectId, workshopId])

    async function loadData() {
        setIsLoading(true)
        try {
            // 1. Load Inventory (Sticks at Workshop)
            const sticks = await getWorkshopInventory(projectId, workshopId)
            setInventory(sticks)

            // 2. Load Pending Spools (From MTO)
            // Filter logic: Spools that have pipe items but NO allocated cuts yet
            // For MVP, we just show all Spools with Pipe items
            const mto = await getConsolidatedMTO(projectId)

            const spoolsWithPipe: PendingSpool[] = []

            mto.forEach(iso => {
                iso.spools.forEach(spool => {
                    const pipeItems = spool.items.filter(item =>
                        // Heuristic for Pipe items (consistent with service)
                        (item.quantity_required > 1 && item.quantity_required < 50) ||
                        item.material_spec.startsWith('P') ||
                        item.description.includes('PIPE')
                    )

                    if (pipeItems.length > 0) {
                        spoolsWithPipe.push({
                            spoolId: spool.spool_id,
                            spoolName: spool.spool_name,
                            isoName: iso.iso_number,
                            pipeItems
                        })
                    }
                })
            })

            setPendingSpools(spoolsWithPipe)

        } catch (error) {
            console.error('Error loading cutting data:', error)
        } finally {
            setIsLoading(false)
        }
    }

    // Recommendation Engine: Find best stick for the job
    function recommendStick(requiredLength: number, identCode: string) {
        // 1. Filter by Ident Code
        const candidates = inventory.filter(s => s.ident_code === identCode && s.location === 'WORKSHOP')

        // 2. Sort by "Sustainability":
        // - Prefer used sticks (current_length < initial_length)
        // - Prefer smallest valid stick (minimize scrap)
        const sorted = candidates.sort((a, b) => {
            const aIsUsed = a.current_length < a.initial_length
            const bIsUsed = b.current_length < b.initial_length

            if (aIsUsed && !bIsUsed) return -1
            if (!aIsUsed && bIsUsed) return 1

            // Both are used or new, sort by length ascending (Fit tightly)
            return a.current_length - b.current_length
        })

        // 3. Find first that fits
        const best = sorted.find(s => s.current_length >= requiredLength)
        setRecommendedStick(best || null)
    }

    function handleSelectSpool(spoolId: string) {
        const spool = pendingSpools.find(s => s.spoolId === spoolId)
        if (spool) {
            setSelectedSpool(spool)
            setSelectedItem(null)
            setRecommendedStick(null)
        }
    }

    function handleSelectItem(item: MTOItemSummary) {
        setSelectedItem(item)
        recommendStick(item.quantity_required, item.material_spec)
    }

    async function handleConfirmCut() {
        if (!selectedItem || !recommendedStick || !selectedSpool) return

        setIsProcessingCut(true)
        try {
            await processPipeCut(
                projectId,
                recommendedStick.id,
                selectedItem.quantity_required,
                selectedSpool.spoolId,
                userId
            )

            // Success
            setShowConfirmModal(false)
            loadData() // Refresh inventory & removal logic (if we filtered completed)
            // Reset selection
            setSelectedItem(null)
            setRecommendedStick(null)
        } catch (error) {
            console.error('Cut failed:', error)
            alert('Error al procesar corte')
        } finally {
            setIsProcessingCut(false)
        }
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* LEFT: Spool Selector */}
            <Card className="md:col-span-1">
                <CardHeader>
                    <CardTitle>Spools Pendientes</CardTitle>
                    <CardDescription>Selecciona un spool para fabricar</CardDescription>
                </CardHeader>
                <CardContent className="h-[500px] overflow-y-auto">
                    {isLoading ? (
                        <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                    ) : (
                        <div className="space-y-2">
                            {pendingSpools.map(spool => (
                                <div
                                    key={spool.spoolId}
                                    onClick={() => handleSelectSpool(spool.spoolId)}
                                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedSpool?.spoolId === spool.spoolId
                                            ? 'bg-blue-500/20 border-blue-500'
                                            : 'hover:bg-accent/50 border-transparent hover:border-accent'
                                        }`}
                                >
                                    <div className="font-bold">{spool.spoolName}</div>
                                    <div className="text-xs text-muted-foreground">{spool.isoName}</div>
                                    <Badge variant="outline" className="mt-2 text-xs">
                                        {spool.pipeItems.length} materiales de tubería
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* CENTER: Cutting Workbench */}
            <Card className="md:col-span-2">
                <CardHeader>
                    <CardTitle>Mesa de Corte</CardTitle>
                    <CardDescription>
                        {selectedSpool ? `Cortando para ${selectedSpool.spoolName}` : 'Selecciona un spool...'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!selectedSpool ? (
                        <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground border-2 border-dashed rounded-xl">
                            <Scissors className="h-16 w-16 mb-4 opacity-50" />
                            <p>Selecciona un Spool para comenzar</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Materials List */}
                            <div>
                                <h3 className="text-sm font-medium mb-2">Materiales Requeridos</h3>
                                <div className="grid gap-2">
                                    {selectedSpool.pipeItems.map(item => (
                                        <div
                                            key={item.id}
                                            onClick={() => handleSelectItem(item)}
                                            className={`flex items-center justify-between p-3 rounded border cursor-pointer ${selectedItem?.id === item.id ? 'bg-green-500/20 border-green-500' : 'hover:bg-accent'
                                                }`}
                                        >
                                            <div>
                                                <div className="font-mono text-sm">{item.material_spec}</div>
                                                <div className="text-xs text-muted-foreground truncate max-w-[300px]">{item.description}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-lg">{item.quantity_required.toFixed(2)}m</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Recommendation Area */}
                            {selectedItem && (
                                <div className="bg-muted/30 p-4 rounded-lg border border-dashed border-yellow-500/50">
                                    <h3 className="text-yellow-500 font-bold flex items-center gap-2 mb-3">
                                        <Loader2 className="h-4 w-4 animate-pulse" /> AI Recommendation
                                    </h3>

                                    {recommendedStick ? (
                                        <div className="flex flex-col gap-4">
                                            <div className="p-4 bg-background rounded border shadow-sm">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-sm text-muted-foreground">Stick Sugerido:</span>
                                                    <Badge variant={recommendedStick.current_length < recommendedStick.initial_length ? 'secondary' : 'default'}>
                                                        {recommendedStick.current_length < recommendedStick.initial_length ? 'RETAZO' : 'NUEVO'}
                                                    </Badge>
                                                </div>
                                                <div className="text-2xl font-mono font-bold mb-1">
                                                    {recommendedStick.heat_number || 'S/N'}
                                                </div>
                                                <div className="text-sm text-muted-foreground mb-4">
                                                    Largo Disp: {recommendedStick.current_length.toFixed(2)}m
                                                </div>

                                                {/* Visual Cutting Plan */}
                                                <div className="relative h-8 bg-gray-700 rounded overflow-hidden">
                                                    <div
                                                        className="absolute top-0 left-0 h-full bg-green-500 flex items-center justify-center text-[10px] text-black font-bold"
                                                        style={{ width: `${(selectedItem.quantity_required / recommendedStick.current_length) * 100}%` }}
                                                    >
                                                        USAR {selectedItem.quantity_required.toFixed(2)}m
                                                    </div>
                                                    <div className="absolute top-0 right-0 h-full flex items-center px-2 text-[10px] text-white">
                                                        SOBRA {(recommendedStick.current_length - selectedItem.quantity_required).toFixed(2)}m
                                                    </div>
                                                </div>
                                            </div>

                                            <Button size="lg" className="w-full bg-green-600 hover:bg-green-700" onClick={() => setShowConfirmModal(true)}>
                                                <Scissors className="mr-2 h-5 w-5" />
                                                CONFIRMAR CORTE
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="text-red-400 text-center py-4">
                                            ❌ No hay stock suficiente en Taller. Solicitar despacho a Bodega.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Confirmation Modal */}
            <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmar Corte Físico</DialogTitle>
                        <DialogDescription>
                            Esta acción descontará el material del inventario y marcará el spool como "En Proceso".
                        </DialogDescription>
                    </DialogHeader>

                    {selectedItem && recommendedStick && (
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground">Spool:</span>
                                    <div className="font-bold">{selectedSpool?.spoolName}</div>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Stick ID:</span>
                                    <div className="font-mono">{recommendedStick.heat_number}</div>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Cortar:</span>
                                    <div className="font-bold text-red-500">{selectedItem.quantity_required.toFixed(2)}m</div>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Sobrante:</span>
                                    <div className="font-bold text-green-500">{(recommendedStick.current_length - selectedItem.quantity_required).toFixed(2)}m</div>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowConfirmModal(false)}>Cancelar</Button>
                        <Button onClick={handleConfirmCut} disabled={isProcessingCut}>
                            {isProcessingCut && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirmar y Actualizar Stock
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

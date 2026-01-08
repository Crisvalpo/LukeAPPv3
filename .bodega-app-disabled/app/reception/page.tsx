'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Camera, Search, Loader2, PackageCheck, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { findPurchaseOrder, receiveItem, type ReceptionItem, type PurchaseOrder } from '@/services/reception'
import { Scanner } from '@yudiel/react-qr-scanner'

export default function ReceptionPage() {
    const router = useRouter()
    const [step, setStep] = useState<'search' | 'list' | 'detail' | 'success'>('search')
    const [searchQuery, setSearchQuery] = useState('')
    const [scanning, setScanning] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Data State
    const [po, setPo] = useState<PurchaseOrder | null>(null)
    const [items, setItems] = useState<ReceptionItem[]>([])
    const [selectedItem, setSelectedItem] = useState<ReceptionItem | null>(null)
    const [projectId, setProjectId] = useState<string | null>(null)
    const [generatedQr, setGeneratedQr] = useState<string | null>(null)

    // Form states
    const [heatNumber, setHeatNumber] = useState('')
    const [length, setLength] = useState('')
    const [location, setLocation] = useState('')
    const [inputQuantity, setInputQuantity] = useState('')


    // Initialize User Context (Offline-First)
    useEffect(() => {
        async function loadContext() {
            // 1. Try localStorage first
            const cachedProjectId = localStorage.getItem('LUKAPP_PROJECT_ID')
            if (cachedProjectId) {
                console.log('Using cached project_id:', cachedProjectId)
                setProjectId(cachedProjectId)
                return
            }

            // 2. Fallback to network
            try {
                const supabase = createClient()
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return

                const { data: member } = await supabase
                    .from('members')
                    .select('project_id')
                    .eq('user_id', user.id)
                    .single()

                if (member?.project_id) {
                    setProjectId(member.project_id)
                    localStorage.setItem('LUKAPP_PROJECT_ID', member.project_id)
                }
            } catch (error) {
                console.warn('Failed to load project context (offline?)', error)
                // Don't block - user can still work with cached data
            }
        }
        loadContext()
    }, [])

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!projectId) return setError('Usuario sin proyecto asignado')

        setError(null)
        setLoading(true)

        try {
            const result = await findPurchaseOrder(searchQuery, projectId)

            if (result.success && result.data) {
                setPo(result.data.po)
                setItems(result.data.items)
                setStep('list')
            } else {
                setError(result.error || 'No se encontró la orden')
            }
        } catch (err) {
            setError('Error de conexión')
        } finally {
            setLoading(false)
        }
    }

    const handleItemClick = (item: ReceptionItem) => {
        setSelectedItem(item)
        // Default to pending quantity
        const pending = Math.max(0, item.quantity_requested - item.quantity_received)
        setInputQuantity(pending.toString())
        setHeatNumber('')
        setLength('')
        setLocation('')
        setStep('detail')
    }

    const isPipe = (item: ReceptionItem | null) => {
        if (!item?.part_group) return false
        const group = item.part_group.toUpperCase()
        return group.includes('PIPE') || group.includes('TUBE') || group.includes('CAÑERIA')
    }

    const handleSaveDetail = async () => {
        if (!projectId || !selectedItem || !po) return

        if (!heatNumber) return alert('Debes ingresar la Colada (Heat Number)')
        // if pipe, need length
        if (isPipe(selectedItem) && !length) return alert('Debes ingresar el Largo Real')

        setLoading(true)

        try {
            const result = await receiveItem({
                request_id: po!.id,
                request_item_id: selectedItem.id,
                project_id: projectId,
                ident_code: selectedItem.ident_code,
                // Use input quantity. For pipes, usually stick count -> length, but here we treat as quantity of items/meters.
                // If it's a pipe and length is provided, 'quantity' might be number of sticks (1) and 'length' is length per stick.
                // BUT current logic treats 'quantity' as the main unit. 
                // Let's assume inputQuantity is the MASTER quantity being received (e.g., 6 meters or 1 valve).
                quantity: parseFloat(inputQuantity) || 1,
                // Assumption: "Largo Real" implies SINGLE stick measurement. 
                // Ideally we allow multiple, but let's assume 1 for now if length is provided.
                heat_number: heatNumber,
                location: location || 'BODEGA',
                length: length ? parseFloat(length) : undefined,
                is_pipe: isPipe(selectedItem)
            })

            if (result.success && result.qr_code) {
                setGeneratedQr(result.qr_code)
                setStep('success')
            } else {
                // @ts-ignore
                alert('Error al guardar: ' + result.error)
            }
        } catch (error) {
            console.error(error)
            alert('Error inesperado al guardar')
        } finally {
            setLoading(false)
        }
    }

    const handleFinish = () => {
        setPo(null)
        setItems([])
        setStep('search')
        setSearchQuery('')
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white pb-20">
            {/* Header */}
            <header className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-10 flex items-center gap-4">
                <button
                    onClick={() => {
                        if (step === 'success') {
                            setStep('list')
                            setGeneratedQr(null)
                            setSelectedItem(null)
                        } else if (step === 'detail') {
                            setStep('list')
                            setSelectedItem(null)
                        } else if (step === 'list') {
                            setStep('search')
                            setPo(null)
                            setItems([])
                        } else {
                            router.push('/')
                        }
                    }}
                    className="p-2 hover:bg-slate-800 rounded-full"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="font-bold text-lg">
                    {step === 'search' && 'Nueva Recepción'}
                    {step === 'list' && po ? po.request_number : 'Cargando...'}
                    {step === 'detail' && 'Detalle de Material'}
                    {step === 'success' && 'Item Recibido'}
                </h1>
            </header>

            <main className="p-4">

                {/* STEP 1: SEARCH PO */}
                {step === 'search' && (
                    <div className="space-y-6">
                        <div className="bg-blue-600/10 border border-blue-500/20 p-4 rounded-xl text-blue-200 text-sm">
                            Escanea el QR de la Orden de Compra (PO) o ingresa el número manualmente.
                        </div>

                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm text-center">
                                {error}
                            </div>
                        )}

                        {scanning ? (
                            <div className="w-full aspect-video bg-black rounded-xl overflow-hidden relative">
                                <Scanner
                                    onScan={(result) => {
                                        if (result && result.length > 0) {
                                            const value = result[0].rawValue;
                                            setSearchQuery(value);
                                            setScanning(false);
                                            // Handle automatic submit if needed
                                        }
                                    }}
                                    onError={(error: any) => {
                                        console.error(error);
                                        setError(`Error Cámara: ${error?.message || 'Permiso denegado o contexto inseguro'}`);
                                        setScanning(false);
                                    }}
                                    components={{
                                        torch: true,
                                        finder: true,
                                    }}
                                />
                                <button
                                    onClick={() => setScanning(false)}
                                    className="absolute top-4 right-4 bg-slate-900/80 text-white p-2 rounded-full hover:bg-red-500/80 transition-colors z-20"
                                >
                                    <span className="sr-only">Cerrar</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            </div>
                        ) : (
                            <button
                                className="w-full aspect-video bg-slate-900 border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-blue-500 transition-colors"
                                onClick={() => setScanning(true)}
                            >
                                <Camera className="w-12 h-12 text-slate-500" />
                                <span className="text-slate-400 font-medium">Activar Cámara</span>
                            </button>
                        )}

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-800"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-slate-950 px-2 text-slate-500">o ingresa manual</span>
                            </div>
                        </div>

                        <form onSubmit={handleSearch} className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Ej: MR-001"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-10 pr-4 focus:ring-2 focus:ring-blue-500 outline-none text-white placeholder-slate-500"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-6 rounded-lg font-bold flex items-center justify-center min-w-[60px]"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Ir'}
                            </button>
                        </form>
                    </div>
                )}

                {/* STEP 2: ITEM LIST */}
                {step === 'list' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm text-slate-400 mb-2">
                            <span>{items.length} Items en orden</span>
                            <span>Pendiente</span>
                        </div>

                        {items.length === 0 ? (
                            <div className="text-center text-slate-500 py-10">
                                Esta orden no tiene items.
                            </div>
                        ) : (
                            items.map(item => (
                                <div
                                    key={item.id}
                                    onClick={() => handleItemClick(item)}
                                    className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex justify-between items-center active:bg-slate-800 transition-colors cursor-pointer"
                                >
                                    <div>
                                        <div className="font-mono text-xs text-blue-400 mb-1">{item.ident_code}</div>
                                        <div className="font-medium text-sm text-slate-200 line-clamp-2">{item.description}</div>
                                    </div>
                                    <div className="bg-slate-800 px-3 py-1 rounded-lg text-sm font-bold min-w-[50px] text-center">
                                        x{item.quantity_requested}
                                    </div>
                                </div>
                            ))
                        )}

                        <button
                            onClick={handleFinish}
                            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl mt-8 flex items-center justify-center gap-2"
                        >
                            <PackageCheck className="w-5 h-5" />
                            Finalizar Recepción
                        </button>
                    </div>
                )}

                {/* STEP 3: DETAIL / ENRICHMENT */}
                {step === 'detail' && selectedItem && (
                    <div className="space-y-6">
                        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                            <div className="font-mono text-xs text-blue-400 mb-1">{selectedItem.ident_code}</div>
                            <div className="font-bold text-lg text-white">{selectedItem.description}</div>
                            <div className="text-sm text-slate-400 mt-1">
                                Solicitado: <span className="text-white">{selectedItem.quantity_requested} {selectedItem.uom}</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase">Cantidad a Recibir</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-lg font-mono focus:border-blue-500 outline-none"
                                        value={inputQuantity}
                                        onChange={e => setInputQuantity(e.target.value)}
                                    />
                                    <div className="bg-slate-800 border border-slate-700 rounded-lg px-4 flex items-center text-slate-400 font-mono">
                                        {selectedItem.uom || 'UN'}
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">
                                    Pendiente: {(selectedItem.quantity_requested - selectedItem.quantity_received).toFixed(2)}
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase">Cantidad a Recibir</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-lg font-mono focus:border-blue-500 outline-none"
                                        value={inputQuantity}
                                        onChange={e => setInputQuantity(e.target.value)}
                                    />
                                    <div className="bg-slate-800 border border-slate-700 rounded-lg px-4 flex items-center text-slate-400 font-mono">
                                        {selectedItem.uom || 'UN'}
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">
                                    Solicitado: {selectedItem.quantity_requested} |
                                    Pendiente: {(selectedItem.quantity_requested - selectedItem.quantity_received).toFixed(2)}
                                </p>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase">Nº Colada (Heat Number)</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-lg font-mono focus:border-blue-500 outline-none"
                                    placeholder="H-12345"
                                    value={heatNumber}
                                    onChange={e => setHeatNumber(e.target.value.toUpperCase())}
                                />
                            </div>

                            {/* Show Length only for Pipes */}
                            {isPipe(selectedItem) && (
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase">Largo Real (mm) - Importante para Pipes</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-lg font-mono focus:border-blue-500 outline-none"
                                        placeholder="6000"
                                        value={length}
                                        onChange={e => setLength(e.target.value)}
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase">Ubicación / Rack</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-lg focus:border-blue-500 outline-none"
                                    placeholder="RACK-A-01"
                                    value={location}
                                    onChange={e => setLocation(e.target.value.toUpperCase())}
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                onClick={handleSaveDetail}
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Guardar Item'}
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 4: SUCCESS / QR */}
                {step === 'success' && (
                    <div className="flex flex-col items-center justify-center py-10 space-y-8">
                        <CheckCircle className="w-24 h-24 text-green-500" />
                        <div className="text-center">
                            <h2 className="text-2xl font-bold mb-2">Item Recibido</h2>
                            <p className="text-slate-400">Se ha registrado el ingreso exitosamente.</p>
                        </div>

                        <div className="bg-white p-6 rounded-xl">
                            {/* Simple text representation of QR for now */}
                            <div className="text-black font-mono text-3xl font-bold border-4 border-black p-4">
                                {generatedQr}
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 uppercase font-mono">ID Único Generado</p>

                        <button
                            onClick={() => {
                                setStep('list')
                                setGeneratedQr(null)
                                setSelectedItem(null)
                            }}
                            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl"
                        >
                            Volver a la Lista
                        </button>
                    </div>
                )}

            </main>
        </div>
    )
}

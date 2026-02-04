'use client'

import { useState } from 'react'
import { X, UserPlus, QrCode, User, Briefcase, Hash, Phone, Sun, Moon, ScanLine } from 'lucide-react'
import { parseChileanIdQR, formatRut, validateRut } from '@/lib/rut-utils'
import { createPerson } from '@/services/workforce'
import { InputField } from '@/components/ui/InputField'
import { SelectNative } from '@/components/ui/SelectNative'

interface AddPersonnelModalProps {
    projectId: string
    onClose: () => void
    onSuccess: () => void
}

export default function AddPersonnelModal({ projectId, onClose, onSuccess }: AddPersonnelModalProps) {
    const [formData, setFormData] = useState({
        rut: '',
        firstName: '',
        lastName: '',
        role: '',
        internalId: '',
        email: '',
        phone: '',
        shiftType: 'DIA' as 'DIA' | 'NOCHE'
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        // Try scan logic on paste/change
        const scannedRut = parseChileanIdQR(val)
        if (scannedRut) {
            setFormData(prev => ({ ...prev, rut: scannedRut }))
        } else {
            setFormData(prev => ({ ...prev, rut: val }))
        }
    }


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (!validateRut(formData.rut)) {
            setError('RUT inválido')
            return
        }

        if (!formData.firstName || !formData.lastName || !formData.role) {
            setError('Completa los campos obligatorios')
            return
        }

        setLoading(true)
        try {
            const result = await createPerson({
                project_id: projectId,
                rut: formatRut(formData.rut),
                first_name: formData.firstName.toUpperCase(),
                last_name: formData.lastName.toUpperCase(),
                role_tag: formData.role.toUpperCase(),
                internal_id: formData.internalId || undefined,
                email: formData.email || undefined,
                phone: formData.phone || undefined,
                shift_type: formData.shiftType,
                active: true
            })

            if (result.success) {
                onSuccess()
                onClose()
            } else {
                setError(result.error || 'Error al crear trabajador')
            }
        } catch (err) {
            setError('Error de conexión')
        } finally {
            setLoading(false)
        }
    }

    // DEBUG: Force scanner open if needed to test z-index independently
    // useEffect(() => { setShowScanner(true) }, [])

    return (
        <>
            {/* Modal Overlay */}
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}>
                    <div className="modal-header">
                        <h3 className="modal-title">
                            <UserPlus size={20} className="text-blue-500" />
                            Agregar Trabajador
                        </h3>
                        <div className="flex items-center gap-2">
                            <button onClick={onClose} className="btn-icon">
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="modal-body" style={{ gap: '1.5rem', display: 'flex', flexDirection: 'column' }}>

                        {/* RUT Field - USB Scanner Compatible */}
                        <InputField
                            label="RUT / ESCÁNER USB"
                            value={formData.rut}
                            onChange={handleRutChange}
                            placeholder="Escanea el QR o escribe RUT..."
                            icon={<QrCode size={18} className="text-blue-400" />}
                            variant="glass"
                            autoFocus
                            helperText={
                                <span className="flex items-center gap-1 mt-1">
                                    <ScanLine size={12} />
                                    Compatible con Pistola USB
                                </span>
                            }
                        />

                        <InputField
                            label="NOMBRES"
                            value={formData.firstName}
                            onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                            placeholder="Ej: Juan Andrés"
                            icon={<User size={18} />}
                            variant="glass"
                        />

                        <InputField
                            label="APELLIDOS"
                            value={formData.lastName}
                            onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                            placeholder="Ej: Pérez González"
                            icon={<Briefcase size={18} />}
                            variant="glass"
                        />

                        <InputField
                            label="CARGO"
                            value={formData.role}
                            onChange={e => setFormData({ ...formData, role: e.target.value })}
                            placeholder="Ej: Soldador"
                            icon={<Briefcase size={18} />}
                            variant="glass"
                        />

                        <div className="grid grid-cols-2 gap-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <InputField
                                label="ID INTERNO"
                                value={formData.internalId}
                                onChange={e => setFormData({ ...formData, internalId: e.target.value })}
                                placeholder="# 1001"
                                icon={<Hash size={18} />}
                                variant="glass"
                            />
                            <SelectNative
                                label="TURNO"
                                value={formData.shiftType}
                                onChange={e => setFormData({ ...formData, shiftType: e.target.value as 'DIA' | 'NOCHE' })}
                                variant="glass"
                                icon={formData.shiftType === 'DIA' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-indigo-400" />}
                            >
                                <option value="DIA" className="bg-[#0f172a]">Día</option>
                                <option value="NOCHE" className="bg-[#0f172a]">Noche</option>
                            </SelectNative>
                        </div>

                        <InputField
                            label="TELÉFONO"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+56 9 ..."
                            icon={<Phone size={18} />}
                            variant="glass"
                        />

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded text-sm flex items-center gap-2 justify-center">
                                <X size={16} />
                                {error}
                            </div>
                        )}

                        <div className="modal-footer" style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'transparent', paddingRight: 0, paddingLeft: 0 }}>
                            <button
                                type="button"
                                onClick={onClose}
                                className="btn-secondary mr-3"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary"
                            >
                                {loading ? 'Guardando...' : 'Guardar Trabajador'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    )
}

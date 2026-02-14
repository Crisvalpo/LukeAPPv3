'use client'

import { useState } from 'react'
import { X, UserPlus, QrCode, User, Briefcase, Hash, Phone, Sun, Moon, ScanLine } from 'lucide-react'
import { parseChileanIdQR, formatRut, validateRut } from '@/lib/rut-utils'
import { createPerson } from '@/services/workforce'
import { InputField } from '@/components/ui/InputField'
import { SelectNative } from '@/components/ui/SelectNative'
import { Button } from '@/components/ui/button'
import { Heading, Text } from '@/components/ui/Typography'

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

    return (
        <>
            {/* Modal Overlay */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
                onClick={onClose}
            >
                <div
                    className="bg-bg-surface-1 border border-glass-border rounded-2xl shadow-2xl w-full max-w-lg animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-glass-border">
                        <Heading level={3} className="flex items-center gap-3 text-white">
                            <UserPlus size={20} className="text-brand-primary" />
                            Agregar Trabajador
                        </Heading>
                        <Button
                            onClick={onClose}
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 rounded-full hover:bg-white/5"
                        >
                            <X size={20} />
                        </Button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
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
                                <span className="flex items-center gap-1 mt-1 text-xs text-text-muted">
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

                        <div className="grid grid-cols-2 gap-4">
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
                                <option value="DIA" className="bg-slate-900">Día</option>
                                <option value="NOCHE" className="bg-slate-900">Noche</option>
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
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm flex items-center gap-2 justify-center animate-in slide-in-from-top-2">
                                <X size={16} />
                                {error}
                            </div>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-glass-border">
                            <Button
                                type="button"
                                onClick={onClose}
                                variant="outline"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="bg-brand-primary hover:bg-brand-primary/90 text-white"
                            >
                                {loading ? 'Guardando...' : 'Guardar Trabajador'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    )
}

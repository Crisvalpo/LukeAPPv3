'use client'

import React, { useState } from 'react'
import '@/styles/views/form-view.css'
import { ViewSchema } from '@/schemas/company' // Assuming shared type

interface FormViewProps<T> {
    schema: ViewSchema<T>
    initialData?: Partial<T>
    onSubmit: (data: Partial<T>) => Promise<void>
    onCancel?: () => void
    isSubmitting?: boolean
    title?: string
    description?: string
}

export function FormView<T extends Record<string, any>>({
    schema,
    initialData = {},
    onSubmit,
    onCancel,
    isSubmitting = false,
    title,
    description
}: FormViewProps<T>) {

    // We maintain internal state for the form
    const [formData, setFormData] = useState<Partial<T>>(initialData)
    const [errors, setErrors] = useState<Record<string, string>>({})

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Basic validation based on schema
        const newErrors: Record<string, string> = {}
        let isValid = true

        Object.entries(schema.fields).forEach(([key, field]) => {
            if (field.required && !formData[key as keyof T]) {
                newErrors[key] = 'Este campo es requerido'
                isValid = false
            }
        })

        if (!isValid) {
            setErrors(newErrors)
            return
        }

        await onSubmit(formData)
    }

    const handleChange = (key: string, value: any) => {
        setFormData(prev => ({ ...prev, [key]: value }))
        // Clear error if exists
        if (errors[key]) {
            setErrors(prev => {
                const newErrors = { ...prev }
                delete newErrors[key]
                return newErrors
            })
        }
    }

    // Filter fields that should propagate to form
    // We only show fields that are NOT readOnly (unless we want to show them as disabled)
    // For creation, readOnly fields like 'created_at' or 'id' are skipped.
    const formFields = Object.entries(schema.fields).filter(([_, def]) => !def.readOnly)

    return (
        <div className="form-view-container">
            {(title || description) && (
                <div className="form-view-header">
                    {title && <h2 className="form-view-title">{title}</h2>}
                    {description && <p className="form-view-description">{description}</p>}
                </div>
            )}

            <form onSubmit={handleSubmit} className="form-view-grid">
                {formFields.map(([key, def]) => (
                    <div key={key} className="form-field-container">
                        <label className={`form-field-label ${def.required ? 'required' : ''}`}>
                            {def.label}
                        </label>

                        <div className="form-input-wrapper">
                            {def.type === 'date' ? (
                                <input
                                    type="date"
                                    className={`form-input ${errors[key] ? 'has-error' : ''}`}
                                    value={formData[key as keyof T] as string || ''}
                                    onChange={(e) => handleChange(key, e.target.value)}
                                    disabled={isSubmitting}
                                />
                            ) : def.type === 'number' ? (
                                <input
                                    type="number"
                                    className={`form-input ${errors[key] ? 'has-error' : ''}`}
                                    value={formData[key as keyof T] as string || ''}
                                    onChange={(e) => handleChange(key, e.target.value)}
                                    placeholder={def.label}
                                    disabled={isSubmitting}
                                />
                            ) : (
                                <input
                                    type="text"
                                    className={`form-input ${errors[key] ? 'has-error' : ''}`}
                                    value={formData[key as keyof T] as string || ''}
                                    onChange={(e) => handleChange(key, e.target.value)}
                                    placeholder={def.label}
                                    disabled={isSubmitting}
                                />
                            )}
                        </div>

                        {errors[key] && (
                            <span className="field-error">{errors[key]}</span>
                        )}
                    </div>
                ))}

                <div className="form-actions">
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="form-button secondary"
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </button>
                    )}
                    <button
                        type="submit"
                        className="form-button primary"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>
            </form>
        </div>
    )
}

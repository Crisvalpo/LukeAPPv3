'use client'

import React, { useState } from 'react'
import '@/styles/views/form-view.css'
import { ViewSchema } from '@/schemas/company' // Assuming shared type
import { InputField } from '@/components/ui/InputField'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Heading, Text as TypographyText } from '@/components/ui/Typography'

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
                    {title && <Heading level={2} className="form-view-title">{title}</Heading>}
                    {description && <TypographyText variant="muted" className="form-view-description">{description}</TypographyText>}
                </div>
            )}

            <form onSubmit={handleSubmit} className="form-view-grid">
                {formFields.map(([key, def]) => {
                    const commonProps = {
                        label: def.label,
                        error: errors[key],
                        disabled: isSubmitting,
                    }

                    if (def.type === 'select') {
                        return (
                            <div key={key} className="inputfield">
                                <label className="inputfield__label">
                                    {def.label} {def.required && <span className="text-red-500">*</span>}
                                </label>
                                <Select
                                    value={formData[key as keyof T] as string || ''}
                                    onValueChange={(val) => handleChange(key, val)}
                                    disabled={isSubmitting}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={`Seleccionar ${def.label}`} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {def.options?.map(option => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors[key] && <small className="inputfield__error">{errors[key]}</small>}
                            </div>
                        )
                    }

                    return (
                        <InputField
                            key={key}
                            type={def.type === 'date' ? 'date' : def.type === 'number' ? 'number' : 'text'}
                            value={formData[key as keyof T] as string || ''}
                            onChange={(e) => handleChange(key, e.target.value)}
                            required={def.required}
                            {...commonProps}
                        />
                    )
                })}

                <div className="form-actions flex justify-end gap-3 mt-6">
                    {onCancel && (
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onCancel}
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </Button>
                    )}
                    <Button
                        type="submit"
                        variant="default"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Guardando...' : 'Guardar'}
                    </Button>
                </div>
            </form>
        </div>
    )
}

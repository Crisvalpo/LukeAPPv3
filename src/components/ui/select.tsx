import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import './select.css'

interface SelectContextValue {
    value: string
    onValueChange: (value: string) => void
    open: boolean
    setOpen: (open: boolean) => void
    disabled?: boolean
}

const SelectContext = React.createContext<SelectContextValue | undefined>(undefined)

export interface SelectProps {
    value?: string
    onValueChange?: (value: string) => void
    defaultValue?: string
    disabled?: boolean
    children: React.ReactNode
}

export function Select({ value: controlledValue, onValueChange, defaultValue, disabled, children }: SelectProps) {
    const [internalValue, setInternalValue] = React.useState(defaultValue || '')
    const [open, setOpen] = React.useState(false)
    const value = controlledValue ?? internalValue
    const setValue = onValueChange ?? setInternalValue

    return (
        <SelectContext.Provider value={{ value, onValueChange: setValue, open, setOpen, disabled }}>
            <div className={`select ${disabled ? 'select--disabled' : ''}`}>{children}</div>
        </SelectContext.Provider>
    )
}

export function SelectTrigger({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    const context = React.useContext(SelectContext)
    if (!context) throw new Error('SelectTrigger must be used within Select')

    return (
        <button
            type="button"
            className={`select__trigger ${className}`}
            onClick={() => !context.disabled && context.setOpen(!context.open)}
            disabled={context.disabled}
        >
            {children}
            <ChevronDown className="select__icon" />
        </button>
    )
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
    const context = React.useContext(SelectContext)
    if (!context) throw new Error('SelectValue must be used within Select')

    return <span>{context.value || placeholder}</span>
}

export function SelectContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    const context = React.useContext(SelectContext)
    if (!context) throw new Error('SelectContent must be used within Select')

    if (!context.open) return null

    return (
        <>
            <div className="select__backdrop" onClick={() => context.setOpen(false)} />
            <div className={`select__content ${className}`}>
                {children}
            </div>
        </>
    )
}

export function SelectItem({ value, children, className = '' }: { value: string; children: React.ReactNode; className?: string }) {
    const context = React.useContext(SelectContext)
    if (!context) throw new Error('SelectItem must be used within Select')

    const isSelected = context.value === value

    return (
        <div
            className={`select__item ${isSelected ? 'select__item--selected' : ''} ${className}`}
            onClick={() => {
                context.onValueChange(value)
                context.setOpen(false)
            }}
        >
            {children}
        </div>
    )
}

export const SelectGroup = ({ children }: { children: React.ReactNode }) => children
export const SelectLabel = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <div className={`select__label ${className}`}>{children}</div>
)
export const SelectSeparator = ({ className = '' }: { className?: string }) => (
    <div className={`select__separator ${className}`} />
)
export const SelectScrollUpButton = () => null
export const SelectScrollDownButton = () => null

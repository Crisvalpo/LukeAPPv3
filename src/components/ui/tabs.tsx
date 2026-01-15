import * as React from 'react'
import './tabs.css'

interface TabsContextValue {
    value: string
    onValueChange: (value: string) => void
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined)

export interface TabsProps {
    value?: string
    onValueChange?: (value: string) => void
    defaultValue?: string
    children: React.ReactNode
    className?: string
}

export function Tabs({ value: controlledValue, onValueChange, defaultValue, children, className = '' }: TabsProps) {
    const [internalValue, setInternalValue] = React.useState(defaultValue || '')
    const value = controlledValue ?? internalValue
    const setValue = onValueChange ?? setInternalValue

    return (
        <TabsContext.Provider value={{ value, onValueChange: setValue }}>
            <div className={`tabs ${className}`}>{children}</div>
        </TabsContext.Provider>
    )
}


export function TabsList({ children, className = '', variant = 'default' }: { children: React.ReactNode; className?: string; variant?: 'default' | 'underline' }) {
    const variantClass = variant === 'underline' ? 'tabs__list--underline' : ''
    return <div className={`tabs__list ${variantClass} ${className}`}>{children}</div>
}

export function TabsTrigger({ value, children, className = '', variant = 'default' }: { value: string; children: React.ReactNode; className?: string; variant?: 'default' | 'underline' }) {
    const context = React.useContext(TabsContext)
    if (!context) throw new Error('TabsTrigger must be used within Tabs')

    const isActive = context.value === value
    const variantClass = variant === 'underline' ? 'tabs__trigger--underline' : ''

    return (
        <button
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`tabs__trigger ${variantClass} ${isActive ? 'tabs__trigger--active' : ''} ${className}`}
            onClick={() => context.onValueChange(value)}
        >
            {children}
        </button>
    )
}


export function TabsContent({ value, children, className = '' }: { value: string; children: React.ReactNode; className?: string }) {
    const context = React.useContext(TabsContext)
    if (!context) throw new Error('TabsContent must be used within Tabs')

    if (context.value !== value) return null

    return <div className={`tabs__content ${className}`}>{children}</div>
}

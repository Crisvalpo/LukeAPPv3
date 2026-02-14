import * as React from 'react'

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
            <div className={`w-full ${className}`}>{children}</div>
        </TabsContext.Provider>
    )
}

export function TabsList({
    children,
    className = '',
    variant = 'default'
}: {
    children: React.ReactNode;
    className?: string;
    variant?: 'default' | 'underline'
}) {
    const baseStyles = "inline-flex items-center justify-center rounded-lg bg-bg-surface-2 p-1 gap-1"
    const underlineStyles = "flex bg-transparent rounded-none p-0 gap-8 border-b border-white/5 h-auto justify-start"

    const styles = variant === 'underline' ? underlineStyles : baseStyles

    return <div className={`${styles} ${className}`}>{children}</div>
}

export function TabsTrigger({
    value,
    children,
    className = '',
    variant = 'default'
}: {
    value: string;
    children: React.ReactNode;
    className?: string;
    variant?: 'default' | 'underline'
}) {
    const context = React.useContext(TabsContext)
    if (!context) throw new Error('TabsTrigger must be used within Tabs')

    const isActive = context.value === value

    const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all cursor-pointer border-none bg-transparent text-text-muted hover:bg-bg-surface-1 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-bg-surface-1 data-[state=active]:text-text-main data-[state=active]:shadow-sm"

    const underlineStyles = "relative inline-flex items-center justify-center whitespace-nowrap bg-transparent py-3 px-0 rounded-none text-[0.9375rem] font-medium transition-all duration-200 text-text-muted hover:text-text-main data-[state=active]:text-white data-[state=active]:font-bold after:content-[''] after:absolute after:bottom-[-1px] after:left-0 after:w-full after:h-[3px] after:bg-indigo-500 after:shadow-[0_-4px_12px_rgba(99,102,241,0.8)] after:rounded-t-[2px] after:scale-x-0 after:transition-transform after:duration-250 after:ease-out data-[state=active]:after:scale-x-100 data-[state=active]:[text-shadow:0_0_12px_rgba(99,102,241,0.6)]"

    const styles = variant === 'underline' ? underlineStyles : baseStyles

    return (
        <button
            type="button"
            role="tab"
            aria-selected={isActive}
            data-state={isActive ? 'active' : 'inactive'}
            className={`${styles} ${className}`}
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

    return <div className={`mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className}`}>{children}</div>
}

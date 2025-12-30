import * as React from 'react'
import { X } from 'lucide-react'
import './dialog.css'

interface DialogContextValue {
    open: boolean
    onOpenChange: (open: boolean) => void
}

const DialogContext = React.createContext<DialogContextValue | undefined>(undefined)

export interface DialogProps {
    open?: boolean
    onOpenChange?: (open: boolean) => void
    children: React.ReactNode
}

export function Dialog({ open: controlledOpen, onOpenChange, children }: DialogProps) {
    const [internalOpen, setInternalOpen] = React.useState(false)
    const open = controlledOpen ?? internalOpen
    const setOpen = onOpenChange ?? setInternalOpen

    return (
        <DialogContext.Provider value={{ open, onOpenChange: setOpen }}>
            {children}
        </DialogContext.Provider>
    )
}

export function DialogTrigger({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) {
    const context = React.useContext(DialogContext)
    if (!context) throw new Error('DialogTrigger must be used within Dialog')

    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children, {
            onClick: () => context.onOpenChange(true),
        } as any)
    }

    return (
        <button onClick={() => context.onOpenChange(true)}>
            {children}
        </button>
    )
}

export function DialogContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    const context = React.useContext(DialogContext)
    if (!context) throw new Error('DialogContent must be used within Dialog')

    if (!context.open) return null

    return (
        <div className="dialog__overlay" onClick={() => context.onOpenChange(false)}>
            <div className={`dialog__content ${className}`} onClick={(e) => e.stopPropagation()}>
                {children}
                <button
                    className="dialog__close"
                    onClick={() => context.onOpenChange(false)}
                    aria-label="Close"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    )
}

export function DialogHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return <div className={`dialog__header ${className}`}>{children}</div>
}

export function DialogFooter({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return <div className={`dialog__footer ${className}`}>{children}</div>
}

export function DialogTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return <h2 className={`dialog__title ${className}`}>{children}</h2>
}

export function DialogDescription({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return <p className={`dialog__description ${className}`}>{children}</p>
}

export function DialogClose({ children }: { children: React.ReactNode }) {
    const context = React.useContext(DialogContext)
    if (!context) throw new Error('DialogClose must be used within Dialog')

    return (
        <button onClick={() => context.onOpenChange(false)}>
            {children}
        </button>
    )
}

export const DialogPortal = ({ children }: { children: React.ReactNode }) => children
export const DialogOverlay = ({ children }: { children: React.ReactNode }) => children

import * as React from 'react'
import './alert.css'

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'destructive'
}

export function Alert({ className = '', variant = 'default', ...props }: AlertProps) {
    return (
        <div
            role="alert"
            className={`alert alert--${variant} ${className}`}
            {...props}
        />
    )
}

export function AlertTitle({ className = '', ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
    return (
        <h5 className={`alert__title ${className}`} {...props} />
    )
}

export function AlertDescription({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={`alert__description ${className}`} {...props} />
    )
}

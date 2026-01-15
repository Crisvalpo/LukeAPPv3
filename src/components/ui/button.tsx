import * as React from 'react'
import './button.css'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
    size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function Button({
    className = '',
    variant = 'default',
    size = 'default',
    ...props
}: ButtonProps) {
    return (
        <button
            className={`button button--v-${variant} button--s-${size} ${className}`}
            {...props}
        />
    )
}

import * as React from 'react'
import './inputfield.css'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string
    error?: string
    helperText?: string
    variant?: 'default' | 'glass'
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ label, error, helperText, className = '', variant = 'default', ...props }, ref) => {
        return (
            <div className="inputfield">
                {label && (
                    <label className="inputfield__label">
                        {label}
                    </label>
                )}
                <textarea
                    ref={ref}
                    className={`input input--${variant} ${error ? 'input--error' : ''} ${className}`}
                    style={{ minHeight: '80px', fontFamily: 'inherit', ...props.style }}
                    {...props}
                />
                {error && (
                    <small className="inputfield__error">{error}</small>
                )}
                {helperText && !error && (
                    <small className="inputfield__helper">{helperText}</small>
                )}
            </div>
        )
    }
)
Textarea.displayName = 'Textarea'

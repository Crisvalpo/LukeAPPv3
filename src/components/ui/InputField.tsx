import * as React from 'react'
import './inputfield.css'

export interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: React.ReactNode
    error?: string
    helperText?: React.ReactNode
    variant?: 'default' | 'glass'
    icon?: React.ReactNode
}

export const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
    ({ label, error, helperText, className = '', variant = 'default', icon, ...props }, ref) => {
        return (
            <div className="inputfield">
                {label && (
                    <label className="inputfield__label">
                        {label}
                    </label>
                )}
                <div className="input-wrapper">
                    {icon && <div className="input-icon">{icon}</div>}
                    <input
                        ref={ref}
                        className={`input input--${variant} ${icon ? 'input--with-icon' : ''} ${error ? 'input--error' : ''} ${className}`}
                        {...props}
                    />
                </div>
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
InputField.displayName = 'InputField'

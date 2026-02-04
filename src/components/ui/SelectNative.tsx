import * as React from 'react'
import './inputfield.css'

export interface SelectNativeProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string
    error?: string
    helperText?: string
    options?: { value: string; label: string }[] | string[]
    variant?: 'default' | 'glass'
    placeholder?: string
    icon?: React.ReactNode
}

export const SelectNative = React.forwardRef<HTMLSelectElement, SelectNativeProps>(
    ({ label, error, helperText, options, className = '', variant = 'default', placeholder, children, icon, ...props }, ref) => {
        return (
            <div className="inputfield">
                {label && (
                    <label className="inputfield__label">
                        {label}
                    </label>
                )}
                <div className="input-wrapper">
                    {icon && <div className="input-icon">{icon}</div>}
                    <select
                        ref={ref}
                        className={`input input--${variant} ${icon ? 'input--with-icon' : ''} ${error ? 'input--error' : ''} ${className}`}
                        {...props}
                    >
                        {placeholder && <option value="">{placeholder}</option>}
                        {options ? (
                            options.map((opt, i) => {
                                const value = typeof opt === 'string' ? opt : opt.value
                                const label = typeof opt === 'string' ? opt : opt.label
                                return (
                                    <option key={i} value={value}>
                                        {label}
                                    </option>
                                )
                            })
                        ) : children}
                    </select>
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
SelectNative.displayName = 'SelectNative'

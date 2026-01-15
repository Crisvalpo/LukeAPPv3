import * as React from 'react'
import './inputfield.css'

export interface SelectNativeProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string
    error?: string
    helperText?: string
    options?: { value: string; label: string }[] | string[]
    variant?: 'default' | 'glass'
    placeholder?: string
}

export const SelectNative = React.forwardRef<HTMLSelectElement, SelectNativeProps>(
    ({ label, error, helperText, options, className = '', variant = 'default', placeholder, children, ...props }, ref) => {
        return (
            <div className="inputfield">
                {label && (
                    <label className="inputfield__label">
                        {label}
                    </label>
                )}
                <select
                    ref={ref}
                    className={`input input--${variant} ${error ? 'input--error' : ''} ${className}`}
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

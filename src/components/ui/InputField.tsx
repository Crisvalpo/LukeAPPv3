import * as React from 'react'
import { Input } from './input'
import './inputfield.css'

export interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
    helperText?: string
}

export const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
    ({ label, error, helperText, className = '', ...props }, ref) => {
        return (
            <div className="inputfield">
                {label && (
                    <label className="inputfield__label">
                        {label}
                    </label>
                )}
                <Input
                    ref={ref}
                    className={`${error ? 'inputfield__input--error' : ''} ${className}`}
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
InputField.displayName = 'InputField'

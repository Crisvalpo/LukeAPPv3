import * as React from 'react'
import './progress.css'

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
    value?: number
    max?: number
    variant?: 'default' | 'success' | 'warning' | 'destructive'
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
    ({ className = '', value = 0, max = 100, variant = 'default', ...props }, ref) => {
        const percentage = Math.min(Math.max(0, (value / max) * 100), 100)

        return (
            <div
                ref={ref}
                className={`progress ${className}`}
                {...props}
            >
                <div
                    className={`progress__indicator progress__indicator--${variant}`}
                    style={{ transform: `translateX(-${100 - percentage}%)` }}
                />
            </div>
        )
    }
)
Progress.displayName = 'Progress'

import * as React from 'react'
import './typography.css'

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
    level?: 1 | 2 | 3 | 4 | 5 | 6
    size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'
    variant?: 'main' | 'muted' | 'dim'
    as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
}

export function Heading({
    level = 2,
    size,
    variant = 'main',
    as,
    className = '',
    children,
    ...props
}: HeadingProps) {
    // Auto-size based on level if not explicitly set
    const autoSize = size || (
        level === 1 ? '4xl' :
            level === 2 ? '3xl' :
                level === 3 ? '2xl' :
                    level === 4 ? 'xl' :
                        level === 5 ? 'lg' : 'base'
    )

    const classes = `heading heading--${autoSize} heading--${variant} ${className}`

    // Determine element (can override with 'as' prop)
    const Tag = as || (`h${level}` as 'h1')

    switch (Tag) {
        case 'h1':
            return <h1 className={classes} {...props}>{children}</h1>
        case 'h2':
            return <h2 className={classes} {...props}>{children}</h2>
        case 'h3':
            return <h3 className={classes} {...props}>{children}</h3>
        case 'h4':
            return <h4 className={classes} {...props}>{children}</h4>
        case 'h5':
            return <h5 className={classes} {...props}>{children}</h5>
        case 'h6':
            return <h6 className={classes} {...props}>{children}</h6>
        default:
            return <h2 className={classes} {...props}>{children}</h2>
    }
}

export interface TextProps extends React.HTMLAttributes<HTMLElement> {
    size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl'
    variant?: 'main' | 'muted' | 'dim'
    as?: 'p' | 'span' | 'div' | 'label'
}

export function Text({
    size = 'base',
    variant = 'main',
    as = 'p',
    className = '',
    children,
    ...props
}: TextProps) {
    const classes = `text text--${size} text--${variant} ${className}`

    switch (as) {
        case 'p':
            return <p className={classes} {...props}>{children}</p>
        case 'span':
            return <span className={classes} {...props}>{children}</span>
        case 'div':
            return <div className={classes} {...props}>{children}</div>
        case 'label':
            return <label className={classes} {...props}>{children}</label>
        default:
            return <p className={classes} {...props}>{children}</p>
    }
}

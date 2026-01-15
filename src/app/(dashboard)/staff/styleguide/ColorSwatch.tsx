'use client'

import React, { useState } from 'react'
import { Icons } from '@/components/ui/Icons'
import styles from './styleguide.module.css'

interface ColorSwatchProps {
    name: string
    value: string
}

export function ColorSwatch({ name, value }: ColorSwatchProps) {
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(`var(${name})`)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error('Failed to copy:', err)
        }
    }

    return (
        <div className={styles.colorSwatch}>
            <div
                className={styles.colorBox}
                style={{ backgroundColor: `var(${name})` }}
            />
            <div className={styles.colorInfo}>
                <code className={styles.colorName}>{name}</code>
                <span className={styles.colorValue}>{value}</span>
            </div>
            <button
                onClick={handleCopy}
                className={styles.copyButton}
                title="Copiar variable CSS"
            >
                {copied ? (
                    <Icons.Check size={14} />
                ) : (
                    <Icons.Copy size={14} />
                )}
            </button>
        </div>
    )
}

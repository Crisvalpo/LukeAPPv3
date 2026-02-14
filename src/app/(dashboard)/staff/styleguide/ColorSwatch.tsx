'use client'

import React, { useState } from 'react'
import { Icons } from '@/components/ui/Icons'
import styles from './styleguide.module.css'

interface ColorSwatchProps {
    name: string
    value: string
    twClass?: string
}

export function ColorSwatch({ name, value, twClass }: ColorSwatchProps) {
    const [copiedVar, setCopiedVar] = useState(false)
    const [copiedTW, setCopiedTW] = useState(false)

    const copyToClipboard = async (text: string, setCopied: React.Dispatch<React.SetStateAction<boolean>>) => {
        try {
            await navigator.clipboard.writeText(text)
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
                {twClass && (
                    <code className="text-[10px] text-[var(--color-primary)] font-mono mt-1 opacity-70">
                        .{twClass}
                    </code>
                )}
            </div>
            <div className="flex flex-col gap-1 ml-auto">
                <button
                    onClick={() => copyToClipboard(`var(${name})`, setCopiedVar)}
                    className={styles.copyButton}
                    style={{ position: 'static', transform: 'none', opacity: 1, pointerEvents: 'auto' }}
                    title="Copiar variable CSS"
                >
                    {copiedVar ? <Icons.Check size={12} /> : <Icons.Copy size={12} />}
                </button>
                {twClass && (
                    <button
                        onClick={() => copyToClipboard(twClass, setCopiedTW)}
                        className={styles.copyButton}
                        style={{ position: 'static', transform: 'none', opacity: 1, pointerEvents: 'auto', backgroundColor: 'var(--color-primary)', color: 'white' }}
                        title="Copiar clase Tailwind"
                    >
                        {copiedTW ? <Icons.Check size={12} /> : <span className="text-[8px] font-bold">TW</span>}
                    </button>
                )}
            </div>
        </div>
    )
}

import type { Metadata } from 'next'
import './globals.css'

import InstallPrompt from './components/InstallPrompt'

export const metadata: Metadata = {
    title: 'LukeAPP Bodega',
    description: 'Gestión de Materiales en Terreno',
    manifest: '/manifest.json',
    themeColor: '#2563eb',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'black-translucent',
        title: 'LukeAPP Bodega'
    }
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="es">
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
                <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
            </head>
            <body className="antialiased bg-slate-950 text-white min-h-screen">
                {children}
                <InstallPrompt />
            </body>
        </html>
    )
}

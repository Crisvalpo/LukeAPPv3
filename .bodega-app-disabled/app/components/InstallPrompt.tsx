'use client'

import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
    const [showPrompt, setShowPrompt] = useState(false)

    useEffect(() => {
        // Check if user has already dismissed or installed
        const dismissed = localStorage.getItem('LUKAPP_INSTALL_DISMISSED')
        if (dismissed) return

        // Listen for beforeinstallprompt event
        const handler = (e: Event) => {
            e.preventDefault()
            setDeferredPrompt(e)
            setShowPrompt(true)
        }

        window.addEventListener('beforeinstallprompt', handler)

        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setShowPrompt(false)
        }

        return () => window.removeEventListener('beforeinstallprompt', handler)
    }, [])

    const handleInstall = async () => {
        if (!deferredPrompt) return

        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice

        if (outcome === 'accepted') {
            console.log('User accepted install')
        }

        setDeferredPrompt(null)
        setShowPrompt(false)
    }

    const handleDismiss = () => {
        localStorage.setItem('LUKAPP_INSTALL_DISMISSED', 'true')
        setShowPrompt(false)
    }

    if (!showPrompt) return null

    return (
        <div className="fixed bottom-20 left-4 right-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-2xl shadow-2xl z-50 animate-slide-up">
            <button
                onClick={handleDismiss}
                className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full transition-colors"
            >
                <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3 pr-6">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Download className="w-5 h-5" />
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-sm mb-1">Instalar LukeAPP Bodega</h3>
                    <p className="text-xs text-blue-100 mb-3">
                        Accede rápidamente desde tu pantalla de inicio, funciona sin conexión.
                    </p>
                    <button
                        onClick={handleInstall}
                        className="bg-white text-blue-600 font-bold text-sm px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                        Instalar Ahora
                    </button>
                </div>
            </div>
        </div>
    )
}

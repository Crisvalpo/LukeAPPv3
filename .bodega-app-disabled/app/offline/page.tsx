export default function OfflinePage() {
    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-slate-500"
                >
                    <line x1="2" y1="2" x2="22" y2="22"></line>
                    <path d="M9 9a3 3 0 0 1 3-3m2 2 1 1"></path>
                    <path d="M6.7 6.7A9 9 0 0 1 12 3m6.7 3.7A9 9 0 0 0 12 3"></path>
                    <path d="M18.7 11.7A9 9 0 0 1 21 17m-3.3-5.3A9 9 0 0 0 3 17"></path>
                </svg>
            </div>

            <h1 className="text-2xl font-bold mb-2">Sin Conexión</h1>
            <p className="text-slate-400 mb-6 max-w-sm">
                Esta página no está disponible offline. Vuelve a la página principal para usar las funciones guardadas.
            </p>

            <a
                href="/"
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl transition-colors"
            >
                Ir a Inicio
            </a>
        </div>
    )
}

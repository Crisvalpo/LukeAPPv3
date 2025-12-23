'use client';

export default function EnterpriseCTA() {
    return (
        <div className="enterprise-cta rounded-2xl p-8 md:p-12 text-center text-white relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800" />
            </div>

            {/* Content */}
            <div className="relative z-10">
                {/* Badge */}
                <div className="inline-block mb-4">
                    <span className="bg-yellow-400 text-black text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
                        Empresas
                    </span>
                </div>

                {/* Title */}
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                    ¿Buscas implementar LukeAPP?
                </h2>

                {/* Description */}
                <p className="text-lg text-gray-200 mb-6 max-w-2xl mx-auto">
                    Gestiona proyectos de gran escala con nuestra solución empresarial.
                    Soluciones personalizadas para tu organización.
                </p>

                {/* CTA Button */}
                <a
                    href="mailto:contacto@lukeapp.com"
                    className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-4 px-8 rounded-lg transition-all shadow-lg hover:shadow-2xl hover:transform hover:scale-105"
                >
                    <span>📧</span>
                    <span>Contactar Ventas</span>
                </a>
            </div>
        </div>
    );
}

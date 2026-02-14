'use client';

// Variants map to specific color schemes based on the reference image
type CardVariant = 'safe' | 'fast' | 'easy' | 'community';

interface ValueCardProps {
    icon: string;
    title: string;
    description: string;
    delay?: number;
    variant?: CardVariant;
    value?: string | number; // For the counter
}

export default function ValueCard({ icon, title, description, delay = 0, variant = 'fast', value }: ValueCardProps) {
    return (
        <div
            className="group p-8 flex flex-col items-center text-center h-full min-h-[220px] rounded-[32px] bg-[#121216]/60 border border-white/5 shadow-xl backdrop-blur-2xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:bg-[#121216]/80 hover:border-white/10"
            style={{
                animation: `fade-in-up 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) ${delay}ms backwards`,
            }}
        >
            {/* Square Icon Container with Gradient */}
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-5 shadow-inner transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 ${variant === 'safe' ? 'bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-emerald-500/20' :
                variant === 'fast' ? 'bg-gradient-to-br from-blue-500 to-blue-700 shadow-blue-500/20' :
                    variant === 'easy' ? 'bg-gradient-to-br from-pink-500 to-pink-700 shadow-pink-500/20' :
                        'bg-gradient-to-br from-orange-500 to-orange-700 shadow-orange-500/20'
                }`}>
                {icon}
            </div>

            {/* Title */}
            <h3 className="text-sm font-black text-white mb-3 tracking-[0.2em] uppercase opacity-70">
                {title}
            </h3>

            {/* Counter Value - The 'Impact' Element */}
            {value !== undefined && value !== null && (
                <div className="text-6xl font-black text-white mb-4 tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                    {value}
                </div>
            )}

            {/* Description */}
            <p className="text-sm font-medium text-slate-400 leading-relaxed max-w-[90%]">
                {description}
            </p>
        </div>
    );
}

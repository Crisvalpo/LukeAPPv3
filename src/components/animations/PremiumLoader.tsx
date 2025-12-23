export default function PremiumLoader() {
    return (
        <div className="flex flex-col items-center justify-center gap-4">
            <div className="relative w-16 h-16">
                {/* Outer ring */}
                <div className="absolute inset-0 rounded-full border-4 border-[var(--glass-border)]"></div>

                {/* Spinning gradient ring */}
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[var(--color-primary)] border-r-[var(--color-info)] animate-spin"></div>

                {/* Inner pulsing dot */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-[var(--color-primary)] animate-pulse"></div>
                </div>
            </div>

            <div className="flex items-center gap-1 text-sm text-[var(--color-text-muted)]">
                <span>Cargando</span>
                <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
            </div>
        </div>
    );
}

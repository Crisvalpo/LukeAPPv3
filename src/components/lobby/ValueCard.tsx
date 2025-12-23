'use client';

interface ValueCardProps {
    icon: string;
    title: string;
    description: string;
    delay?: number;
}

export default function ValueCard({ icon, title, description, delay = 0 }: ValueCardProps) {
    return (
        <div
            className="value-card p-6 rounded-xl text-center transition-all duration-300 hover:transform hover:scale-105"
            style={{
                animation: `fade-in-up 0.6s ease-out ${delay}ms backwards`,
            }}
        >
            {/* Icon - Suavizado */}
            <div className="text-5xl mb-4 icon-subtle-float">{icon}</div>

            {/* Title */}
            <h3 className="text-xl font-bold mb-2 text-white">{title}</h3>

            {/* Description */}
            <p className="text-sm text-[var(--color-text-muted)]">{description}</p>
        </div>
    );
}

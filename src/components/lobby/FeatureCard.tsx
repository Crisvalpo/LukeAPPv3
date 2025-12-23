'use client';

interface FeatureCardProps {
    icon: string;
    title: string;
    description: string;
    delay?: number;
}

export default function FeatureCard({ icon, title, description, delay = 0 }: FeatureCardProps) {
    return (
        <div
            className="feature-card glass-panel p-6 group cursor-pointer"
            style={{ animationDelay: `${delay}ms` }}
        >
            {/* Gradient border effect */}
            <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-info)] to-[var(--color-primary)] bg-[length:200%_100%] animate-gradient-shift p-[1px]">
                <div className="w-full h-full bg-[var(--color-bg-surface)] rounded-lg"></div>
            </div>

            <div className="relative z-10">
                {/* Icon */}
                <div className="text-4xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                    {icon}
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold mb-2 group-hover:text-[var(--color-primary)] transition-colors">
                    {title}
                </h3>

                {/* Description */}
                <p className="text-sm text-[var(--color-text-muted)] group-hover:text-[var(--color-text-secondary)] transition-colors">
                    {description}
                </p>
            </div>
        </div>
    );
}

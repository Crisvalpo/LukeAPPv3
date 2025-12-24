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
            className="purple-card group"
            style={{
                animation: `fade-in-up 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) ${delay}ms backwards`,
            }}
        >
            {/* Square Icon Container with Gradient */}
            <div className={`icon-box ${variant} transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                {icon}
            </div>

            {/* Title */}
            <h3 className="card-title">
                {title}
            </h3>

            {/* Counter Value - The 'Impact' Element */}
            {value !== undefined && value !== null && (
                <div className="impact-number">
                    {value}
                </div>
            )}

            {/* Description */}
            <p className="card-desc">
                {description}
            </p>
        </div>
    );
}

'use client';

import { useEffect, useState } from 'react';

interface ConfettiProps {
    show: boolean;
    onComplete?: () => void;
}

export default function Confetti({ show, onComplete }: ConfettiProps) {
    const [particles, setParticles] = useState<Array<{ id: number; left: number; delay: number; duration: number; color: string }>>([]);

    useEffect(() => {
        if (show) {
            // Generate 30 confetti particles with random properties
            const newParticles = Array.from({ length: 30 }, (_, i) => ({
                id: i,
                left: Math.random() * 100,
                delay: Math.random() * 0.5,
                duration: 2 + Math.random() * 1,
                color: ['#fbbf24', '#60a5fa', '#10b981', '#f472b6', '#a78bfa'][Math.floor(Math.random() * 5)]
            }));

            setParticles(newParticles);

            // Clear particles and call onComplete after animation
            const timer = setTimeout(() => {
                setParticles([]);
                onComplete?.();
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [show, onComplete]);

    if (!show || particles.length === 0) return null;

    return (
        <div className="confetti-container">
            {particles.map((particle) => (
                <div
                    key={particle.id}
                    className="confetti-particle"
                    style={{
                        left: `${particle.left}%`,
                        animationDelay: `${particle.delay}s`,
                        animationDuration: `${particle.duration}s`,
                        backgroundColor: particle.color
                    }}
                />
            ))}
        </div>
    );
}

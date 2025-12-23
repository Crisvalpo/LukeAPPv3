'use client';

import Image from 'next/image';
import { useState } from 'react';

interface IndustryCardProps {
    image: string;
    title: string;
    description: string;
    delay?: number;
}

export default function IndustryCard({ image, title, description, delay = 0 }: IndustryCardProps) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className="industry-card relative overflow-hidden rounded-xl h-80 cursor-pointer"
            style={{
                animation: `stagger-in 0.6s ease-out ${delay}ms backwards`,
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Background Image */}
            <Image
                src={image}
                alt={title}
                fill
                className="object-cover transition-transform duration-500"
                style={{
                    transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                    filter: isHovered ? 'brightness(1.2)' : 'brightness(0.8)',
                }}
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="text-2xl font-bold mb-2">{title}</h3>
                <p className="text-sm text-gray-200 opacity-90">{description}</p>
            </div>

            {/* Hover Border Effect */}
            <div
                className="absolute inset-0 border-2 border-transparent rounded-xl transition-colors duration-300"
                style={{
                    borderColor: isHovered ? 'var(--color-primary)' : 'transparent',
                }}
            />
        </div>
    );
}

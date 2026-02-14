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
            className="group relative overflow-hidden rounded-2xl h-[340px] w-full cursor-pointer transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.3)] hover:-translate-y-1.5"
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
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover transition-transform duration-500"
                style={{
                    transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                    filter: isHovered ? 'brightness(1.2)' : 'brightness(0.8)',
                    objectFit: 'cover',
                }}
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

            {/* Content */}
            <div className="absolute inset-0 flex flex-col justify-end p-8 pl-12 text-white">
                <h3 className="text-4xl font-extrabold mb-2 drop-shadow-2xl tracking-tight">{title}</h3>
                <p className="text-lg text-slate-200 font-medium drop-shadow-lg opacity-90">{description}</p>
            </div>

            {/* Hover Border Effect */}
            <div
                className={`absolute inset-0 border-2 rounded-2xl transition-colors duration-300 ${isHovered ? 'border-brand-primary' : 'border-transparent'}`}
            />
        </div>
    );
}

'use client';

import { useState, useRef, MouseEvent } from 'react';

interface ProjectCard3DProps {
    id: string;
    roleId: string;
    projectName: string;
    companyName: string;
    projectCode: string;
    delay?: number;
}

export default function ProjectCard3D({
    id,
    roleId,
    projectName,
    companyName,
    projectCode,
    delay = 0,
}: ProjectCard3DProps) {
    const cardRef = useRef<HTMLButtonElement>(null);
    const [rotateX, setRotateX] = useState(0);
    const [rotateY, setRotateY] = useState(0);

    const handleMouseMove = (e: MouseEvent<HTMLButtonElement>) => {
        if (!cardRef.current) return;

        const card = cardRef.current;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateXValue = ((y - centerY) / centerY) * -10;
        const rotateYValue = ((x - centerX) / centerX) * 10;

        setRotateX(rotateXValue);
        setRotateY(rotateYValue);
    };

    const handleMouseLeave = () => {
        setRotateX(0);
        setRotateY(0);
    };

    return (
        <button
            ref={cardRef}
            className="glass-panel p-6 text-left group hover:bg-[var(--glass-border)] transition-all relative overflow-hidden card-3d"
            style={{
                animationDelay: `${delay}ms`,
                transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
                transition: 'transform 0.1s ease-out, box-shadow 0.3s ease',
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {/* Gradient border on hover */}
            <div className="absolute top-0 left-0 w-1 h-full bg-[var(--color-primary)] opacity-0 group-hover:opacity-100 transition-opacity" />

            {/* Role badge */}
            <div className="text-xs font-bold text-[var(--color-primary)] uppercase tracking-wider mb-2">
                {roleId.replace('_', ' ')}
            </div>

            {/* Project name */}
            <h3 className="text-xl font-bold mb-1 group-hover:text-[var(--color-primary-hover)] transition-colors">
                {projectName || 'Empresa Global'}
            </h3>

            {/* Company name */}
            <p className="text-sm text-[var(--color-text-muted)] mb-4">
                {companyName}
            </p>

            {/* Footer with code and arrow */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--glass-border)] opacity-60 group-hover:opacity-100 transition-opacity">
                <span className="text-xs font-mono bg-[var(--color-bg-app)] px-2 py-1 rounded">
                    {projectCode || 'CORP'}
                </span>
                <span className="text-xs text-[var(--color-primary)]">
                    Entrar &rarr;
                </span>
            </div>
        </button>
    );
}

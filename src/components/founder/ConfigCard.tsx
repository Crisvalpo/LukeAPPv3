import Link from 'next/link';
import type { OnboardingStatus, OnboardingStep } from '@/actions/onboarding';
import { isStepActive, isStepLocked, isStepCompleted } from '@/lib/onboarding-helpers';
import { CheckCircle, Lock, LucideIcon } from 'lucide-react';

interface ConfigCardProps {
    title: string;
    description: string;
    href: string;
    icon: LucideIcon;
    step: Exclude<OnboardingStep, 'complete'>;
    onboardingStatus: OnboardingStatus | null;
}

export default function ConfigCard({
    title,
    description,
    href,
    icon: Icon,
    step,
    onboardingStatus
}: ConfigCardProps) {
    // Determine card state based on onboarding status
    const isActive = onboardingStatus ? isStepActive(onboardingStatus, step) : false;
    const isLocked = onboardingStatus ? isStepLocked(onboardingStatus, step) : false;
    const isCompleted = onboardingStatus ? isStepCompleted(onboardingStatus, step) : false;

    // Determine if card is clickable
    const isClickable = !isLocked || onboardingStatus?.isComplete;

    const cardBaseClasses = "relative h-full flex flex-col p-8 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl transition-all group overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10";

    // Conditionals using standard Tailwind
    const stateClasses = `
        ${isLocked ? 'opacity-60 grayscale-[0.5] cursor-not-allowed' : 'hover:bg-slate-800/50 hover:border-indigo-500/30 hover:-translate-y-1'}
        ${isCompleted ? 'border-emerald-500/20 bg-emerald-500/5' : ''}
        ${isActive ? 'border-indigo-500/40 bg-indigo-500/5 shadow-[0_0_20px_rgba(99,102,241,0.1)]' : ''}
    `.trim();

    const content = (
        <div className={`${cardBaseClasses} ${stateClasses}`}>
            {/* Glow effect on hover */}
            {!isLocked && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:opacity-100 opacity-0 transition-opacity"></div>
            )}

            <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 shadow-lg ${isCompleted
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : isActive
                        ? 'bg-indigo-500/10 text-indigo-400 shadow-indigo-500/20'
                        : 'bg-slate-800/50 text-slate-400 group-hover:text-indigo-400'
                }`}>
                <Icon size={30} strokeWidth={1.5} />
            </div>

            <h3 className={`text-xl font-bold mb-2 transition-colors ${isLocked ? 'text-slate-500' : 'text-white'
                }`}>
                {title}
            </h3>

            <p className="text-sm text-slate-400 leading-relaxed flex-grow mb-6">
                {description}
            </p>

            {/* Status indicators */}
            <div className="mt-auto pt-4 border-t border-white/5">
                {isLocked && !onboardingStatus?.isComplete ? (
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-600">
                        <Lock size={14} />
                        <span>Bloqueado</span>
                    </div>
                ) : isCompleted ? (
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-500">
                        <CheckCircle size={14} />
                        <span>Completado</span>
                    </div>
                ) : isActive ? (
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                        <span>Siguiente Paso</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>Configurar</span>
                    </div>
                )}
            </div>
        </div>
    );

    // Render as Link if clickable, otherwise as div
    if (isClickable) {
        return <Link href={href}>{content}</Link>;
    }

    return <div style={{ cursor: 'not-allowed' }}>{content}</div>;
}

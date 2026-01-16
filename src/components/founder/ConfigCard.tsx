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

    const cardClasses = `
        config-card 
        ${isActive ? 'onboarding-active' : ''} 
        ${isLocked ? 'onboarding-locked' : ''} 
        ${isCompleted ? 'onboarding-completed' : ''}
    `.trim();

    const content = (
        <div className={cardClasses}>
            <div className="config-card-icon">
                <Icon size={32} />
            </div>
            <h3 className="config-card-title">{title}</h3>
            <p className="config-card-description">{description}</p>

            {/* Status indicators */}
            {isLocked && !onboardingStatus?.isComplete && (
                <div className="config-card-status">
                    <Lock size={16} />
                    <span>Bloqueado</span>
                </div>
            )}
            {isCompleted && (
                <div className="config-card-status config-card-status-complete">
                    <CheckCircle size={16} />
                    <span>Completado</span>
                </div>
            )}
            {isActive && (
                <div className="config-card-status config-card-status-active">
                    <span>▶️ Siguiente</span>
                </div>
            )}
        </div>
    );

    // Render as Link if clickable, otherwise as div
    if (isClickable) {
        return <Link href={href}>{content}</Link>;
    }

    return <div style={{ cursor: 'not-allowed' }}>{content}</div>;
}

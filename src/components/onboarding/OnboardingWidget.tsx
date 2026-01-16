'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getOnboardingStatus, type OnboardingStatus, type OnboardingStep } from '@/actions/onboarding';
import { ONBOARDING_MESSAGES } from '@/config/onboarding-messages';
import { CheckCircle, Lock, ChevronDown } from 'lucide-react';
import '@/styles/onboarding.css';

interface OnboardingWidgetProps {
    companyId: string;
}

export default function OnboardingWidget({ companyId }: OnboardingWidgetProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [status, setStatus] = useState<OnboardingStatus | null>(null);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadStatus() {
            setIsLoading(true);
            console.log('🔍 [OnboardingWidget] Loading status for companyId:', companyId);
            const result = await getOnboardingStatus(companyId);
            console.log('📊 [OnboardingWidget] Status result:', result);
            setStatus(result);
            setIsLoading(false);
        }

        loadStatus();

        // Refresh status when window regains focus (user returns from completing a task)
        const handleFocus = () => loadStatus();
        window.addEventListener('focus', handleFocus);

        // Listen for internal app updates (e.g., when a step is completed in the current view)
        window.addEventListener('onboarding-updated', handleFocus);

        return () => {
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('onboarding-updated', handleFocus);
        };
    }, [companyId, pathname]); // Add pathname as dependency to refresh on navigation

    // Don't show widget if onboarding is complete
    if (!status || status.isComplete || isLoading) {
        return null;
    }

    const tasks: OnboardingStep[] = ['company', 'roles', 'projects', 'invitations'];

    const getTaskState = (step: OnboardingStep): 'completed' | 'active' | 'locked' => {
        if (status.completedSteps.includes(step)) return 'completed';
        if (status.currentStep === step) return 'active';
        return 'locked';
    };

    const getTaskHref = (step: OnboardingStep): string => {
        const routes: Record<Exclude<OnboardingStep, 'complete'>, string> = {
            roles: '/founder/settings/roles',
            company: '/founder/company',
            projects: '/founder/projects',
            invitations: '/founder/settings/invitations'
        };

        if (step === 'complete') return '/founder';
        return routes[step];
    };

    const handleTaskClick = (step: OnboardingStep) => {
        const state = getTaskState(step);
        if (state === 'active') {
            router.push(getTaskHref(step));
        }
    };

    return (
        <div className="onboarding-widget">
            <div
                className="onboarding-widget-header"
                onClick={() => setIsCollapsed(!isCollapsed)}
            >
                <div className="onboarding-widget-title">
                    🚀 Primeros Pasos
                </div>
                <div className={`onboarding-widget-toggle ${isCollapsed ? 'collapsed' : ''}`}>
                    <ChevronDown size={16} />
                </div>
            </div>

            {!isCollapsed && (
                <div className="onboarding-task-list">
                    {tasks.map((step) => {
                        const state = getTaskState(step);
                        const message = ONBOARDING_MESSAGES[step];

                        return (
                            <div
                                key={step}
                                className={`task-item ${state}`}
                                onClick={() => handleTaskClick(step)}
                            >
                                <div className="task-item-icon">
                                    {state === 'completed' && <CheckCircle size={20} />}
                                    {state === 'active' && <span>▶️</span>}
                                    {state === 'locked' && <Lock size={18} />}
                                </div>
                                <div className="task-item-content">
                                    <div className="task-item-title">{message.title}</div>
                                    <div className="task-item-benefit">{message.benefit}</div>
                                </div>
                                {state === 'active' && (
                                    <div className="task-item-tooltip">
                                        {message.cta}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

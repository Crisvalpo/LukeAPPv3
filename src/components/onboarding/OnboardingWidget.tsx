'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getOnboardingStatus, type OnboardingStatus, type OnboardingStep } from '@/actions/onboarding';
import { ONBOARDING_MESSAGES } from '@/config/onboarding-messages';
import { CheckCircle, Lock, ChevronDown } from 'lucide-react';
// Styles migrated to Tailwind v4

import Confetti from './Confetti'; // Add import

interface OnboardingWidgetProps {
    companyId: string;
}

export default function OnboardingWidget({ companyId }: OnboardingWidgetProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [status, setStatus] = useState<OnboardingStatus | null>(null);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showConfetti, setShowConfetti] = useState(false); // New state
    const prevCompletedCountRef = useRef<number>(0);
    const prevIsCompleteRef = useRef<boolean>(false);

    useEffect(() => {
        async function loadStatus() {
            // Keep loading true only for initial load to prevent flashing
            if (!status) setIsLoading(true);

            console.log('🔍 [OnboardingWidget] Loading status for companyId:', companyId);
            const result = await getOnboardingStatus(companyId);
            console.log('📊 [OnboardingWidget] Status result (Render Safe):', result.isComplete);

            // Check for completion transition (Confetti Trigger)
            // Logic: Trigger if number of completed steps has INCREASED
            const completedCount = result.completedSteps.length;

            if (completedCount > prevCompletedCountRef.current && prevCompletedCountRef.current > 0) {
                // We assume initial load (count > 0 check) shouldn't trigger, unless it's a fresh action?
                // Actually, for better UX, let's trigger only if we had a previous state (ref init to -1 maybe?)
                // But since we initialize to 0, initial load will just set the ref.
                // Let's rely on the fact that 'status' is null initially.
            }

            // Logic 2: Effect runs on mount. value is 0. If result has 2 steps, it triggers.
            // We want to avoid trigger on initial page load if steps were ALREADY done.
            // So we only trigger if we have loaded at least once.

            if (status) { // Only check transition if we had a previous status loaded
                const prevCount = status.completedSteps.length;
                if (completedCount > prevCount) {
                    console.log('🎉 Step Completed! Triggering Confetti...');
                    setShowConfetti(true);
                }
            }

            // Also checking full completion just in case logic 2 misses a transition (though unlikely)
            if (!prevIsCompleteRef.current && result.isComplete && status) {
                // Redundant if step count incrs, but safe.
                setShowConfetti(true);
            }

            // Update refs
            prevCompletedCountRef.current = completedCount;
            prevIsCompleteRef.current = result.isComplete;

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
    }, [companyId, pathname]); // REMOVED 'status' from dependency array to fix infinite loop

    // Don't show widget if onboarding is complete AND we are not showing confetti
    if ((!status || status.isComplete) && !showConfetti && !isLoading) {
        return null;
    }

    // Safety check for loading state on first render
    if (isLoading && !status) return null;

    // Use latest status keys
    const completedSteps = status?.completedSteps || [];
    const currentStep = status?.currentStep || 'company';
    const isComplete = status?.isComplete || false;

    const tasks: OnboardingStep[] = ['company', 'roles', 'projects', 'invitations'];

    const getTaskState = (step: OnboardingStep): 'completed' | 'active' | 'locked' => {
        if (completedSteps.includes(step)) return 'completed';
        if (currentStep === step) return 'active';
        return 'locked';
    };

    const getTaskHref = (step: OnboardingStep): string => {
        const routes: Record<Exclude<OnboardingStep, 'complete'>, string> = {
            roles: '/founder/settings/roles',
            company: '/founder/company',
            projects: '/founder/projects',
            invitations: '/founder/invitations'
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
        <>
            <Confetti show={showConfetti} onComplete={() => setShowConfetti(false)} />

            <div className={`onboarding-widget ${isComplete ? 'completed-celebration' : ''}`}>
                <div
                    className="onboarding-widget-header"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                >
                    <div className="onboarding-widget-title">
                        {isComplete ? '🎉 ¡Felicitaciones!' : '🚀 Primeros Pasos'}
                    </div>
                    {!isComplete && (
                        <div className={`onboarding-widget-toggle ${isCollapsed ? 'collapsed' : ''}`}>
                            <ChevronDown size={16} />
                        </div>
                    )}
                </div>

                {!isCollapsed && !isComplete && (
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

                {/* Optional: Show a completion message when complete/confetti is showing */}
                {isComplete && (
                    <div className="onboarding-completion-message" style={{ padding: '1rem', color: '#fbbf24', textAlign: 'center' }}>
                        ¡Completaste configuración básica! <br />
                        Tu cuenta está lista para volar. 🚀
                    </div>
                )}
            </div>
        </>
    );
}

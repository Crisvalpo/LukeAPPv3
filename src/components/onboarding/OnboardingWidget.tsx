'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getOnboardingStatus, type OnboardingStatus, type OnboardingStep } from '@/actions/onboarding';
import { ONBOARDING_MESSAGES } from '@/config/onboarding-messages';
import { CheckCircle, Lock, ChevronDown, ChevronRight } from 'lucide-react';
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

            <div className={`
                relative overflow-hidden transition-all duration-500 ease-in-out
                ${isComplete ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-slate-900/40 border-white/5'}
                border rounded-2xl backdrop-blur-xl shadow-2xl
            `}>
                {/* Background Glow for Active Step */}
                {!isComplete && !isCollapsed && (
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl -z-10 animate-pulse" />
                )}

                <div
                    className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-white/5 transition-colors group"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                >
                    <div className="flex items-center gap-2.5">
                        <div className={`
                            w-8 h-8 rounded-lg flex items-center justify-center text-lg
                            ${isComplete ? 'bg-indigo-500 text-white shadow-lg' : 'bg-blue-500/10 text-blue-400'}
                        `}>
                            {isComplete ? '🎉' : '🚀'}
                        </div>
                        <div className="flex flex-col">
                            <span className={`text-[13px] font-bold tracking-tight ${isComplete ? 'text-indigo-200' : 'text-slate-100'}`}>
                                {isComplete ? '¡Onboarding Completado!' : 'Primeros Pasos'}
                            </span>
                            {!isComplete && (
                                <span className="text-[10px] text-slate-500 font-medium">
                                    {completedSteps.length} de {tasks.length} completados
                                </span>
                            )}
                        </div>
                    </div>
                    {!isComplete && (
                        <div className={`
                            p-1 rounded-md text-slate-500 group-hover:text-slate-300 transition-all
                            ${isCollapsed ? '-rotate-90' : 'rotate-0'}
                        `}>
                            <ChevronDown size={14} />
                        </div>
                    )}
                </div>

                {!isCollapsed && !isComplete && (
                    <div className="p-2 pt-0 max-h-[400px] overflow-y-auto scrollbar-hide">
                        <div className="space-y-1">
                            {tasks.map((step, index) => {
                                const state = getTaskState(step);
                                const message = ONBOARDING_MESSAGES[step];
                                const isLast = index === tasks.length - 1;

                                return (
                                    <div
                                        key={step}
                                        className={`
                                            relative flex items-start gap-3 p-3 rounded-xl transition-all duration-300
                                            ${state === 'active'
                                                ? 'bg-blue-500/10 border border-blue-500/20 shadow-lg cursor-pointer scale-[1.02]'
                                                : 'border border-transparent hover:bg-white/5'}
                                            ${state === 'locked' ? 'opacity-40 grayscale pointer-events-none' : ''}
                                            ${state === 'completed' ? 'opacity-70 grayscale-[0.3]' : ''}
                                        `}
                                        onClick={() => handleTaskClick(step)}
                                    >
                                        {/* Connector Line */}
                                        {!isLast && (
                                            <div className={`
                                                absolute left-[23px] top-[40px] w-[1px] h-[30px] z-0
                                                ${state === 'completed' ? 'bg-emerald-500/30' : 'bg-slate-800'}
                                            `} />
                                        )}

                                        <div className={`
                                            relative z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all duration-500
                                            ${state === 'completed' ? 'bg-emerald-500/20 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : ''}
                                            ${state === 'active' ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-pulse' : ''}
                                            ${state === 'locked' ? 'bg-slate-800 text-slate-600' : ''}
                                        `}>
                                            {state === 'completed' && <CheckCircle size={14} strokeWidth={3} />}
                                            {state === 'active' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                            {state === 'locked' && <Lock size={12} />}
                                        </div>

                                        <div className="flex-1 min-w-0 pt-0.5">
                                            <div className={`
                                                text-[12px] font-bold leading-none mb-1
                                                ${state === 'active' ? 'text-blue-100' : 'text-slate-300'}
                                                ${state === 'completed' ? 'text-slate-400 line-through' : ''}
                                            `}>
                                                {message.title}
                                            </div>
                                            <div className={`
                                                text-[10px] leading-snug line-clamp-2
                                                ${state === 'active' ? 'text-blue-300/80' : 'text-slate-500'}
                                            `}>
                                                {message.benefit}
                                            </div>
                                        </div>

                                        {state === 'active' && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <ChevronRight size={14} className="text-blue-400" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {isComplete && (
                    <div className="p-4 pt-1 flex flex-col items-center text-center animate-fade-in">
                        <div className="text-[11px] font-medium text-indigo-300/90 max-w-[180px] leading-relaxed">
                            Has configurado lo esencial con éxito. <br />
                            <span className="text-white font-bold">¡Tu workspace está listo! 🚀</span>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

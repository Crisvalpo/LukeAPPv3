import type { OnboardingStatus, OnboardingStep } from '@/actions/onboarding';

/**
 * Helper to check if a specific step is completed
 */
export function isStepCompleted(status: OnboardingStatus, step: OnboardingStep): boolean {
    return status.completedSteps.includes(step);
}

/**
 * Helper to check if a specific step is the current active step
 */
export function isStepActive(status: OnboardingStatus, step: OnboardingStep): boolean {
    return status.currentStep === step && !status.isComplete;
}

/**
 * Helper to check if a specific step is locked (not yet accessible)
 */
export function isStepLocked(status: OnboardingStatus, step: OnboardingStep): boolean {
    const stepOrder: OnboardingStep[] = ['company', 'roles', 'projects', 'invitations'];
    const currentIndex = stepOrder.indexOf(status.currentStep);
    const targetIndex = stepOrder.indexOf(step);

    return targetIndex > currentIndex && !status.isComplete;
}

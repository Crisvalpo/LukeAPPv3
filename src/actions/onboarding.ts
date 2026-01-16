'use server';

import { createClient } from '@/lib/supabase/server';

export type OnboardingStep = 'roles' | 'company' | 'projects' | 'invitations' | 'complete';

export interface OnboardingStatus {
    currentStep: OnboardingStep;
    completedSteps: OnboardingStep[];
    stepsRemaining: number;
    isComplete: boolean;
}

/**
 * Calculate onboarding status for a company based on existing data
 * No database persistence - computed dynamically from current state
 */
export async function getOnboardingStatus(companyId: string): Promise<OnboardingStatus> {
    const supabase = await createClient();

    try {
        const { data: { user } } = await supabase.auth.getUser();
        const userEmail = user?.email || '';

        // Run all checks in parallel for better performance
        const [
            { count: rolesCount },
            { data: company },
            { count: projectsCount },
            { count: invitationsCount }
        ] = await Promise.all([
            // Check Step 1: Roles configured
            supabase
                .from('company_roles')
                .select('*', { count: 'exact', head: true })
                .eq('company_id', companyId),

            // Check Step 2: Company info completed
            supabase
                .from('companies')
                .select('name, logo_url, rut')
                .eq('id', companyId)
                .single(),

            // Check Step 3: Projects created
            supabase
                .from('projects')
                .select('*', { count: 'exact', head: true })
                .eq('company_id', companyId),

            // Check Step 4: Invitations sent (excluding self)
            supabase
                .from('invitations')
                .select('*', { count: 'exact', head: true })
                .eq('company_id', companyId)
                .neq('email', userEmail)
        ]);

        const hasRoles = (rolesCount ?? 0) > 0;

        const hasCompanyInfo = company &&
            company.logo_url !== null &&
            company.rut !== null && company.rut !== '';

        const hasProjects = (projectsCount ?? 0) > 0;

        const hasInvitations = (invitationsCount ?? 0) > 0;

        // Check ALL steps independently (not sequentially)
        // Then determine currentStep as the FIRST incomplete step in order
        const stepChecks = {
            roles: hasRoles,
            company: hasCompanyInfo,
            projects: hasProjects,
            invitations: hasInvitations
        };

        const stepOrder: Array<keyof typeof stepChecks> = ['company', 'roles', 'projects', 'invitations'];
        const completedSteps: OnboardingStep[] = [];

        // Add all completed steps
        for (const step of stepOrder) {
            if (stepChecks[step]) {
                completedSteps.push(step as OnboardingStep);
            }
        }

        // Find the first incomplete step
        let currentStep: OnboardingStep = 'complete';
        for (const step of stepOrder) {
            if (!stepChecks[step]) {
                currentStep = step as OnboardingStep;
                break;
            }
        }

        const isComplete = currentStep === 'complete';
        const stepsRemaining = 4 - completedSteps.length;

        return {
            currentStep,
            completedSteps,
            stepsRemaining,
            isComplete
        };

    } catch (error) {
        console.error('Error getting onboarding status:', error);
        // Return default status on error
        return {
            currentStep: 'company',
            completedSteps: [],
            stepsRemaining: 4,
            isComplete: false
        };
    }
}

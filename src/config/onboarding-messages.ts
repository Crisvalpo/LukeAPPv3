import type { OnboardingStep } from '@/actions/onboarding';

export interface OnboardingMessage {
    title: string;
    benefit: string;
    cta: string;
    description: string;
}

export const ONBOARDING_MESSAGES: Record<OnboardingStep, OnboardingMessage> = {
    roles: {
        title: 'Configurar Roles',
        benefit: 'Define quién puede hacer qué en tu organización',
        cta: 'Cargar roles predeterminados',
        description: 'Los roles te permiten controlar permisos y accesos de tu equipo de forma eficiente.'
    },
    company: {
        title: 'Información de Empresa',
        benefit: 'Personaliza tu workspace con logo y datos corporativos',
        cta: 'Completar información',
        description: 'Agrega tu logo y actualiza el nombre para que tu equipo reconozca la organización.'
    },
    projects: {
        title: 'Crear Primer Proyecto',
        benefit: 'Empieza a gestionar tu primera obra o instalación',
        cta: 'Crear proyecto',
        description: 'Los proyectos organizan el trabajo de tu equipo en obras específicas con contextos separados.'
    },
    invitations: {
        title: 'Invitar Equipo',
        benefit: 'Colabora con tu equipo y empieza a trabajar juntos',
        cta: 'Enviar invitaciones',
        description: 'Invita a miembros de tu equipo para que puedan acceder y colaborar en los proyectos.'
    },
    complete: {
        title: '¡Todo Listo!',
        benefit: 'Tu organización está configurada y lista para operar',
        cta: 'Explorar funciones avanzadas',
        description: 'Has completado la configuración inicial. Ahora puedes aprovechar al máximo LukeAPP.'
    }
};

export const CELEBRATION_MESSAGES: Record<OnboardingStep, string> = {
    roles: '✅ ¡Roles configurados! Siguiente: Completa la información de tu empresa',
    company: '✅ ¡Información actualizada! Siguiente: Crea tu primer proyecto',
    projects: '✅ ¡Proyecto creado! Siguiente: Invita a tu equipo',
    invitations: '🎉 ¡Felicitaciones! Tu organización está lista para operar',
    complete: '🎉 ¡Configuración completada!'
};

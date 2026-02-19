
import { createClient } from '@/lib/supabase/server'
import EngineeringDashboard from '@/components/engineering/EngineeringDashboard'
import { getIsometricControlTable } from '@/services/document-control'
import { FolderOpen } from 'lucide-react'
import { Heading, Text } from '@/components/ui/Typography'

export default async function EngineeringPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // 1. Get user's current project (same logic, reusable in future)
    let projectId: string | null = null

    if (user) {
        const { data: member } = await supabase
            .from('members')
            .select('project_id')
            .eq('user_id', user.id)
            .not('project_id', 'is', null)
            .limit(1)
            .maybeSingle()

        if (member) projectId = member.project_id
    }

    if (!projectId || !user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
                <FolderOpen className="w-16 h-16 text-slate-500" />
                <Heading level={2}>Sin proyecto asignado</Heading>
                <Text className="text-slate-400">Debes estar asignado a un proyecto para acceder a ingeniería.</Text>
            </div>
        )
    }

    // 2. Fetch Isometrics with Engineering Data
    const { data: isometrics } = await getIsometricControlTable(projectId)

    return (
        <EngineeringDashboard
            isometrics={isometrics || []}
            projectId={projectId}
            userId={user.id}
        />
    )
}

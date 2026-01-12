'use client'

import { useParams } from 'next/navigation'
import ProjectDetailView from '@/components/projects/ProjectDetailView'

export default function AdminProjectDetailPage() {
    const params = useParams()
    const projectId = params.id as string

    return <ProjectDetailView projectId={projectId} role="admin" />
}

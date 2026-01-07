import { FolderKanban } from 'lucide-react'
import { Project } from '@/types'

export const ProjectSchema = { // Intentionally leaving out explicit generic for now to avoid complexity in this file
    entity: 'project',
    label: {
        singular: 'Proyecto',
        plural: 'Proyectos'
    },
    icon: FolderKanban,
    fields: {
        name: {
            type: 'text',
            label: 'Proyecto',
            required: true
        },
        code: {
            type: 'text',
            label: 'Código',
            readOnly: true
        },
        status: {
            type: 'status',
            label: 'Estado'
        },
        members_count: {
            type: 'number',
            label: 'Miembros',
            readOnly: true
        },
        current_week: {
            type: 'text',
            label: 'Semana',
            readOnly: true
        },
        created_at: {
            type: 'date',
            label: 'Creado',
            readOnly: true
        }
    },
    views: {
        list: {
            columns: ['name', 'status', 'members_count', 'current_week', 'created_at'],
            actions: []
        }
    }
} as const

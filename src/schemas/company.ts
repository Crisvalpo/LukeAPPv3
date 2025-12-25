import { Building2 } from 'lucide-react'
import { Company } from '@/types'

export interface ViewSchema<T> {
    entity: string
    label: {
        singular: string
        plural: string
    }
    icon: any
    fields: Record<keyof T | string, {
        type: 'text' | 'date' | 'number' | 'status'
        label: string
        icon?: any
        readOnly?: boolean
        required?: boolean
    }>
    views: {
        list: {
            columns: readonly (keyof T)[]
            actions?: readonly ('view' | 'edit' | 'delete')[]
        }
    }
}

export const CompanySchema: ViewSchema<Company> = {
    entity: 'company',
    label: {
        singular: 'Empresa',
        plural: 'Empresas'
    },
    icon: Building2,
    fields: {
        name: {
            type: 'text',
            label: 'Empresa',
            required: true
        },
        slug: {
            type: 'text',
            label: 'Slug',
            readOnly: true
        },
        created_at: {
            type: 'date',
            label: 'Registro',
            readOnly: true
        }
    },
    views: {
        list: {
            columns: ['name', 'slug', 'created_at'],
            actions: ['view']
        }
    }
}

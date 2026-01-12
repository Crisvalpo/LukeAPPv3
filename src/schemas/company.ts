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
        type: 'text' | 'date' | 'number' | 'status' | 'select'
        label: string
        icon?: any
        readOnly?: boolean
        required?: boolean
        options?: { label: string; value: string }[]
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
        subscription_tier: {
            type: 'select',
            label: 'Plan de Suscripción',
            required: true,
            options: [
                { label: 'Starter', value: 'starter' },
                { label: 'Pro', value: 'pro' },
                { label: 'Enterprise', value: 'enterprise' }
            ]
        },
        initial_months: {
            type: 'select',
            label: 'Meses Pagados (Inicial)',
            required: true,
            options: [
                { label: '1 Mes', value: '1' },
                { label: '3 Meses', value: '3' },
                { label: '6 Meses', value: '6' },
                { label: '12 Meses', value: '12' }
            ]
        },
        created_at: {
            type: 'date',
            label: 'Registro',
            readOnly: true
        }
    },
    views: {
        list: {
            columns: ['name', 'slug', 'created_at']
        }
    }
}

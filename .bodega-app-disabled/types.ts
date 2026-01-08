export type Member = {
    id: string
    user_id: string
    company_id: string
    project_id: string | null
    created_at: string
    roles: string[]
    job_title?: string
    status: string
    company?: {
        name: string
    }
    project?: {
        name: string
    }
}

export type MaterialRequest = {
    id: string
    request_number: string
    project_id: string
    company_id: string
    request_type: 'CLIENT_MIR' | 'CONTRACTOR_PO'
    status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'PARTIAL' | 'REJECTED' | 'COMPLETED'
    requested_date: string
    eta_date: string | null
    notes: string | null
    created_at: string
}

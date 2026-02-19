
import { createClient } from '@/lib/supabase/server'
import { getDocumentDetails, getDocumentRevisions, getDocumentHistory } from '@/services/document-control'
import DocumentDetailsView from '@/components/documents/DocumentDetailsView'
import { notFound } from 'next/navigation'

export default async function DocumentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const [detailsRes, revisionsRes, historyRes] = await Promise.all([
        getDocumentDetails(id),
        getDocumentRevisions(id),
        getDocumentHistory(id)
    ])

    if (!detailsRes.success || !detailsRes.data) {
        notFound()
    }

    return (
        <DocumentDetailsView
            document={detailsRes.data}
            revisions={revisionsRes.data || []}
            history={historyRes.data || []}
        />
    )
}

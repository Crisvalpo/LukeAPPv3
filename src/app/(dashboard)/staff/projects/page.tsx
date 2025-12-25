import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Plus, MoreHorizontal } from 'lucide-react'
import { DataGrid, ListViewHeader, Column } from '@/components/ui/DataGrid'
import { StatusBadge } from '@/components/ui/StatusBadge'

// 1. Data Fetching (Server Side)
async function getProjects() {
    const cookieStore = cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll() { } // Read-only access here
            }
        }
    )

    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching projects:', error)
        return []
    }

    return data || []
}

// 2. View Definition
export default async function ProjectsListView() {
    const projects = await getProjects()

    // 3. Column Definition (The "What to see")
    const columns: Column<any>[] = [
        {
            key: 'name',
            header: 'Project Name',
            render: (project) => (
                <div>
                    <div className="font-medium text-white">{project.name}</div>
                    <div className="text-xs text-slate-500">{project.description || 'No description'}</div>
                </div>
            )
        },
        {
            key: 'status',
            header: 'Status',
            width: '150px',
            render: (project) => (
                <StatusBadge
                    status={project.status || 'inactive'}
                    label={project.status === 'active' ? 'Operational' : 'Paused'}
                />
            )
        },
        {
            key: 'created_at',
            header: 'Created',
            width: '200px',
            render: (project) => new Date(project.created_at).toLocaleDateString()
        }
    ]

    return (
        <div className="space-y-6">
            {/* Canonical Context Header */}
            <ListViewHeader
                title="Projects Registry"
                description="Global overview of all piped projects managed by LukeAPP."
                action={
                    <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        <Plus className="w-4 h-4" />
                        New Project
                    </button>
                }
            />

            {/* Canonical Data Grid */}
            <DataGrid
                data={projects}
                columns={columns}
                keyField="id"
                emptyMessage="No projects found in the system."
                actions={(item) => (
                    <button className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                    </button>
                )}
            />
        </div>
    )
}

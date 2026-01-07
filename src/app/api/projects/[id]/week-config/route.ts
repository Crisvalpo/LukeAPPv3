import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params
    const projectId = params.id
    const supabase = await createClient()

    try {
        // Get project configuration
        const { data: project, error } = await supabase
            .from('projects')
            .select('start_date, week_end_day')
            .eq('id', projectId)
            .single()

        if (error) throw error

        // Calculate current week if start date is set
        let currentWeek = null
        let projectDay = null

        if (project.start_date) {
            const { data: weekData } = await supabase
                .rpc('calculate_project_week', {
                    p_project_id: projectId,
                    p_date: new Date().toISOString().split('T')[0]
                })

            currentWeek = weekData

            // Calculate days elapsed
            const startDate = new Date(project.start_date)
            const today = new Date()
            projectDay = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        }

        return NextResponse.json({
            success: true,
            data: {
                start_date: project.start_date,
                week_end_day: project.week_end_day,
                current_week: currentWeek,
                project_day: projectDay
            }
        })
    } catch (error: any) {
        console.error('[GET /api/projects/[id]/week-config] Error:', error)
        return NextResponse.json(
            { success: false, error: error.message || 'Error al obtener configuración' },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params
    const projectId = params.id
    const supabase = await createClient()

    try {
        const body = await request.json()
        const { start_date, week_end_day } = body

        // Validate inputs
        if (start_date) {
            const date = new Date(start_date)
            if (isNaN(date.getTime())) {
                return NextResponse.json(
                    { success: false, error: 'Fecha de inicio inválida' },
                    { status: 400 }
                )
            }
        }

        if (week_end_day !== undefined && (week_end_day < 0 || week_end_day > 6)) {
            return NextResponse.json(
                { success: false, error: 'Día de cierre debe estar entre 0 y 6' },
                { status: 400 }
            )
        }

        // Update project
        const { data, error } = await supabase
            .from('projects')
            .update({
                start_date,
                week_end_day
            })
            .eq('id', projectId)
            .select('start_date, week_end_day')
            .single()

        if (error) throw error

        // Calculate new week number
        let currentWeek = null
        if (data.start_date) {
            const { data: weekData } = await supabase
                .rpc('calculate_project_week', {
                    p_project_id: projectId,
                    p_date: new Date().toISOString().split('T')[0]
                })
            currentWeek = weekData
        }

        return NextResponse.json({
            success: true,
            message: 'Configuración actualizada exitosamente',
            data: {
                ...data,
                current_week: currentWeek
            }
        })
    } catch (error: any) {
        console.error('[PUT /api/projects/[id]/week-config] Error:', error)
        return NextResponse.json(
            { success: false, error: error.message || 'Error al actualizar configuración' },
            { status: 500 }
        )
    }
}

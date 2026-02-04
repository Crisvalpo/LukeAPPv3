import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateRut, formatRut } from '@/lib/rut-utils'

interface BulkWorker {
    rut: string
    internal_id?: string
    nombre: string
    cargo?: string
    email?: string
    telefono?: string
    jornada?: string
    turno?: string
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { workers, projectId } = body as { workers: BulkWorker[], projectId: string }

        if (!projectId) {
            return NextResponse.json(
                { error: 'Se requiere seleccionar un proyecto' },
                { status: 400 }
            )
        }

        if (!workers || !Array.isArray(workers) || workers.length === 0) {
            return NextResponse.json(
                { error: 'Se requiere un array de trabajadores' },
                { status: 400 }
            )
        }

        const supabase = await createClient()

        // 1. Validate User Permissions (RLS fallback check)
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 })
        }

        // 2. Process Workers
        const results = {
            imported: 0,
            skipped: 0,
            errors: [] as Array<{ rut: string; error: string }>
        }

        for (const worker of workers) {
            try {
                // Validation: Basic fields
                if (!worker.rut || !worker.nombre) {
                    results.errors.push({
                        rut: worker.rut || 'DESCONOCIDO',
                        error: 'RUT y nombre son requeridos'
                    })
                    results.skipped++
                    continue
                }

                // Validation: RUT Validity
                if (!validateRut(worker.rut)) {
                    results.errors.push({
                        rut: worker.rut,
                        error: 'RUT inválido (formato o dígito verificador)'
                    })
                    results.skipped++
                    continue
                }

                const formattedRut = formatRut(worker.rut)

                // Validation: Split Name
                // Simple heuristic: Last word is last_name, rest is first_name
                // or user provides separate columns. Assuming single "nombre" field:
                const nameParts = worker.nombre.trim().split(' ')
                let firstName = worker.nombre
                let lastName = ''

                if (nameParts.length > 1) {
                    // Start from end, take up to 2 words as last name if it looks like surnames
                    // For simplicity: First word is First Name, rest is Last Name (common in CHL to have 2 surnames)
                    // Better: First 2 words = First Name (if 4 words), Last 2 = Surnames
                    // Implementation: Just split reasonably
                    if (nameParts.length >= 3) {
                        firstName = nameParts.slice(0, Math.ceil(nameParts.length / 2)).join(' ')
                        lastName = nameParts.slice(Math.ceil(nameParts.length / 2)).join(' ')
                    } else {
                        firstName = nameParts[0]
                        lastName = nameParts.slice(1).join(' ')
                    }
                } else {
                    lastName = '(Sin Apellido)'
                }

                // Resolve Work Schedule
                let scheduleId = null
                if (worker.jornada) {
                    const { data: schedule } = await supabase
                        .from('work_schedules')
                        .select('id')
                        .eq('project_id', projectId)
                        .eq('name', worker.jornada.trim())
                        .single()

                    if (schedule) scheduleId = schedule.id
                }

                // Prepare Insert
                const InsertData = {
                    project_id: projectId,
                    internal_id: worker.internal_id || null, // New Field
                    rut: formattedRut,
                    first_name: firstName.toUpperCase(),
                    last_name: lastName.toUpperCase(),
                    email: worker.email || null,
                    phone: worker.telefono || null,
                    role_tag: (worker.cargo || 'TRABAJADOR').toUpperCase(),
                    work_schedule_id: scheduleId,
                    shift_type: worker.turno ? worker.turno.toUpperCase() : null, // New Field
                    active: true
                }

                // Execute Insert
                const { error: insertError } = await supabase
                    .from('project_personnel')
                    .insert(InsertData)

                if (insertError) {
                    // Check for unique violation
                    if (insertError.code === '23505') {
                        // Optional: Update instead of skip? For now, skip duplicates as requested in plan
                        results.errors.push({
                            rut: formattedRut,
                            error: 'Trabajador ya existe en el proyecto'
                        })
                        results.skipped++
                    } else {
                        throw insertError
                    }
                } else {
                    results.imported++
                }

            } catch (err: any) {
                console.error(`Error processing worker ${worker.rut}:`, err)
                results.errors.push({
                    rut: worker.rut,
                    error: err.message || 'Error interno al procesar'
                })
                results.skipped++
            }
        }

        return NextResponse.json({
            success: true,
            summary: `Procesados: ${workers.length}. Importados: ${results.imported}. Errores: ${results.skipped}`,
            details: results
        })

    } catch (error: any) {
        console.error('API Error:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}

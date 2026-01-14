'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function assignJointToSpoolAction(jointId: string, spoolId: string) {
    try {
        const supabase = await createClient()

        const { error } = await supabase
            .from('spools_joints')
            .update({ spool_id: spoolId })
            .eq('id', jointId)

        if (error) throw error

        return { success: true }
    } catch (error: any) {
        console.error('Error assigning joint to spool:', error)
        return { success: false, message: error.message }
    }
}

export async function updateJointStatusAction({
    jointId,
    projectId,
    status,
    executionNotes,
    photoUrl
}: {
    jointId: string
    projectId: string
    status: 'PENDING' | 'EXECUTED' | 'REWORK' | 'DELETED'
    executionNotes?: string
    photoUrl?: string | null
}) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        // Get current status and company_id for history
        const { data: currentJoint, error: fetchError } = await supabase
            .from('spools_joints')
            .select('execution_status, company_id, revision_id')
            .eq('id', jointId)
            .single()

        if (fetchError) throw fetchError

        // Prepare Update Data
        const updateData: any = {
            execution_status: status,
            execution_notes: executionNotes,
            updated_at: new Date().toISOString()
        }

        if (photoUrl !== undefined) {
            updateData.photo_url = photoUrl
        }

        if (status === 'EXECUTED') {
            updateData.executed_at = new Date().toISOString()
            updateData.executed_revision_id = currentJoint.revision_id // Capture Revision Snapshot
        } else if (status === 'PENDING') {
            updateData.executed_at = null
            updateData.executed_revision_id = null
            updateData.photo_url = null // Clear photo on pending? Or keep trace? Usually clear on reset.
        }

        // Update Joint
        const { error: updateError } = await supabase
            .from('spools_joints')
            .update(updateData)
            .eq('id', jointId)

        if (updateError) throw updateError

        // Add History Record
        await supabase.from('joint_status_history').insert({
            joint_id: jointId,
            project_id: projectId,
            company_id: currentJoint.company_id, // Added company_id
            previous_status: currentJoint.execution_status,
            new_status: status,
            changed_by: user.id,
            comments: executionNotes ? `Usuario: ${user.user_metadata?.full_name || 'Desconocido'} | ${executionNotes}` : `Usuario: ${user.user_metadata?.full_name || 'Desconocido'}`
        })

        revalidatePath('/')
        return { success: true }
    } catch (error: any) {
        console.error('Error updating joint status:', error)
        return { success: false, error: error.message }
    }
}

export async function getJointHistoryAction(jointId: string) {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('joint_status_history')
            .select('*')
            .eq('joint_id', jointId)
            .order('changed_at', { ascending: false })

        if (error) throw error
        return { success: true, data }
    } catch (error: any) {
        console.error('Error fetching joint history:', error)
        return { success: false, error: error.message }
    }
}

export async function unassignJointAction(jointId: string, projectId: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        // Get current status
        const { data: currentJoint } = await supabase
            .from('spools_joints')
            .select('execution_status')
            .eq('id', jointId)
            .single()

        // Update Joint
        const { error } = await supabase
            .from('spools_joints')
            .update({ spool_id: null })
            .eq('id', jointId)

        if (error) throw error

        // Add history log of unassignment (optional, or just status change log if status changed?)
        // The user asked for "Desvincular" action. It might not change status, but is a significant event.
        // We can log it in history as a comment with same status?
        if (user) {
            await supabase.from('joint_status_history').insert({
                joint_id: jointId,
                project_id: projectId,
                previous_status: currentJoint?.execution_status || 'UNKNOWN',
                new_status: currentJoint?.execution_status || 'UNKNOWN', // Status doesn't change
                changed_by: user.id,
                comments: `Usuario: ${user.user_metadata?.full_name || 'Desconocido'} | Desvinculada del Spool`
            })
        }

        return { success: true }
    } catch (error: any) {
        console.error('Error unassigning joint:', error)
        return { success: false, error: error.message }
    }
}
